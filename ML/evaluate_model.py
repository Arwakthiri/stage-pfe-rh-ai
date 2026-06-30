import os
import json
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend pour exécution sans GUI
import matplotlib.pyplot as plt
import seaborn as sns

# Configuration des chemins
ML_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(ML_DIR, "sentiment_dataset.csv")

# Dictionnaire de correspondance des labels
LABEL_MAP = {
    "Positif": 0,
    "Neutre": 1,
    "Stressé": 2,
    "Frustré": 3,
    "Colère": 4
}
REV_LABEL_MAP = {v: k for k, v in LABEL_MAP.items()}

class SentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=64):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]
        
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt',
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'label': torch.tensor(label, dtype=torch.long)
        }

def evaluate_single_model(model_type, df, test_texts, test_labels):
    model_output_dir = os.path.join(ML_DIR, f"fine_tuned_{model_type}")
    cm_image_path = os.path.join(ML_DIR, f"confusion_matrix_{model_type}.png")
    metrics_json_path = os.path.join(ML_DIR, f"model_metrics_{model_type}.json")
    
    print(f"\n" + "="*50)
    print(f" ÉVALUATION DU MODÈLE : {model_type.upper()}")
    print("="*50)

    if not os.path.exists(model_output_dir):
        # Si le modèle n'a pas encore été entraîné localement, charger le modèle de base correspondant
        if model_type == "xlm":
            base_model_name = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
        else:
            base_model_name = "camembert-base"
        print(f"[WARN] Modèle personnalisé introuvable à {model_output_dir}. Utilisation du modèle de base : {base_model_name}")
    else:
        base_model_name = model_output_dir
        print(f"Chargement du modèle depuis {model_output_dir}...")

    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model_name,
        num_labels=5,
        ignore_mismatched_sizes=True
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)

    test_dataset = SentimentDataset(test_texts, test_labels, tokenizer)
    test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False)

    model.eval()
    all_preds = []
    all_true_labels = []

    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label']

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            logits = outputs.logits
            _, preds = torch.max(logits, dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_true_labels.extend(labels.numpy())

    # Calcul des métriques globales
    accuracy = accuracy_score(all_true_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_true_labels, all_preds, average='weighted', zero_division=0
    )
    
    # Rapport détaillé
    target_names = [REV_LABEL_MAP[i] for i in range(5)]
    class_report = classification_report(
        all_true_labels, all_preds, target_names=target_names, zero_division=0
    )

    print(f"\n--- RÉSULTATS DE L'ÉVALUATION ({model_type.upper()}) ---")
    print(f"Accuracy  : {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1-Score  : {f1:.4f}")
    print("\nRapport de classification par classe :")
    print(class_report)

    # Matrice de confusion
    cm = confusion_matrix(all_true_labels, all_preds)
    
    # Tracer la matrice de confusion avec Seaborn/Matplotlib
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm, 
        annot=True, 
        fmt='d', 
        cmap='Blues', 
        xticklabels=target_names, 
        yticklabels=target_names
    )
    plt.title(f'Matrice de Confusion - Modèle {model_type.upper()} Segula (PFE)')
    plt.ylabel('Vrais sentiments')
    plt.xlabel('Sentiments prédits')
    plt.tight_layout()
    plt.savefig(cm_image_path)
    plt.close()
    print(f"[OK] Graphique de la matrice de confusion sauvegardé/mis à jour sous {cm_image_path}\n")

    # Extraire le rapport complet sous forme de dictionnaire
    report_dict = classification_report(
        all_true_labels, all_preds, target_names=target_names, zero_division=0, output_dict=True
    )

    # Formater les métriques pour sauvegarde JSON
    metrics_data = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "total_samples": int(len(df)),
        "test_samples": int(len(test_texts)),
        "class_metrics": {
            name: {
                "precision": float(report_dict[name]["precision"]),
                "recall": float(report_dict[name]["recall"]),
                "f1_score": float(report_dict[name]["f1-score"]),
                "support": int(report_dict[name]["support"])
            }
            for name in target_names
        }
    }

    # Sauvegarde dans le fichier JSON
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Métriques sauvegardées dans {metrics_json_path}\n")

    return metrics_data

def evaluate_model(model_type=None):
    print("=== Étape 1 : Chargement et préparation des données ===")
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Le fichier CSV {CSV_PATH} n'existe pas.")
        
    df = pd.read_csv(CSV_PATH)
    print(f"Dataset chargé avec {len(df)} lignes.")

    # Mapper les sentiments en IDs
    df['label'] = df['sentiment'].map(LABEL_MAP)
    
    # Division train / test (80% / 20%) identique à l'entraînement
    _, test_texts, _, test_labels = train_test_split(
        df['text'].values,
        df['label'].values,
        test_size=0.20,
        random_state=42,
        stratify=df['label'].values
    )
    print(f"Jeu de test : {len(test_texts)} exemples")

    if model_type is not None:
        if model_type not in ["xlm", "camembert"]:
            raise ValueError(f"Modèle inconnu : {model_type}. Choisissez 'xlm' ou 'camembert'.")
        return evaluate_single_model(model_type, df, test_texts, test_labels)
    else:
        results = {}
        for m_type in ["xlm", "camembert"]:
            try:
                results[m_type] = evaluate_single_model(m_type, df, test_texts, test_labels)
            except Exception as e:
                print(f"[ERR] Échec de l'évaluation du modèle {m_type.upper()}: {e}")
        return results

if __name__ == "__main__":
    import sys
    model_arg = None
    if len(sys.argv) > 1:
        model_arg = sys.argv[1]
    evaluate_model(model_arg)
