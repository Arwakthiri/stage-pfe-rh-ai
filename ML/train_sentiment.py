import os
import pandas as pd
import numpy as np
import torch
import json
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from torch.optim import AdamW
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend pour serveur / exécution sans GUI
import matplotlib.pyplot as plt
import seaborn as sns

# Fixer la graine de reproductibilité
torch.manual_seed(42)
np.random.seed(42)

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

def train_and_evaluate_single_model(model_type, base_model_name, df, train_texts, test_texts, train_labels, test_labels):
    model_output_dir = os.path.join(ML_DIR, f"fine_tuned_{model_type}")
    cm_image_path = os.path.join(ML_DIR, f"confusion_matrix_{model_type}.png")
    metrics_json_path = os.path.join(ML_DIR, f"model_metrics_{model_type}.json")
    
    print(f"\n" + "="*50)
    print(f" ENTRAÎNEMENT DU MODÈLE : {model_type.upper()}")
    print(f" Modèle de base : {base_model_name}")
    print("="*50)
    
    print(f"\n=== Chargement du Tokenizer et du Modèle {model_type.upper()} ===")
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model_name,
        num_labels=5,
        ignore_mismatched_sizes=True
    )
    
    # Détecter l'appareil (GPU si disponible, sinon CPU)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"Entraînement configuré sur : {device}")

    # Préparation des DataLoaders
    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer)
    test_dataset = SentimentDataset(test_texts, test_labels, tokenizer)

    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False)

    # Configuration de l'optimiseur
    optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    
    epochs = 3
    print(f"\n=== Fine-tuning du modèle ({epochs} époques) ===")
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct_predictions = 0
        total_predictions = 0
        
        print(f"\nÉpoque {epoch + 1}/{epochs}")
        for batch_idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)

            optimizer.zero_grad()

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss
            logits = outputs.logits
            
            _, preds = torch.max(logits, dim=1)
            correct_predictions += torch.sum(preds == labels).item()
            total_predictions += labels.size(0)
            total_loss += loss.item()

            loss.backward()
            optimizer.step()

            if (batch_idx + 1) % 10 == 0 or (batch_idx + 1) == len(train_loader):
                acc = (correct_predictions / total_predictions) * 100
                print(f"  Batch {batch_idx+1}/{len(train_loader)} - Loss: {loss.item():.4f} - Acc: {acc:.2f}%")

    print("\n=== Évaluation et Calcul des Métriques ===")
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
    print(f"[OK] Graphique de la matrice de confusion sauvegardé sous {cm_image_path}")

    # Extraire le rapport complet sous forme de dictionnaire pour le JSON
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
    print(f"[OK] Métriques sauvegardées dans {metrics_json_path}")

    print(f"\n=== Sauvegarde du Modèle Fine-tuné {model_type.upper()} ===")
    os.makedirs(model_output_dir, exist_ok=True)
    model.save_pretrained(model_output_dir)
    tokenizer.save_pretrained(model_output_dir)
    print(f"[OK] Modèle et Tokenizer sauvegardés avec succès dans : {model_output_dir}\n")

def train_model(target_model="all"):
    print("=== Étape 1 : Chargement des données ===")
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Le fichier CSV {CSV_PATH} n'existe pas.")
        
    df = pd.read_csv(CSV_PATH)
    print(f"Dataset chargé avec {len(df)} lignes.")
    print("Distribution des classes :")
    print(df['sentiment'].value_counts())

    # Mapper les sentiments en IDs numériques
    df['label'] = df['sentiment'].map(LABEL_MAP)
    
    # Division train / test (80% / 20%)
    train_texts, test_texts, train_labels, test_labels = train_test_split(
        df['text'].values,
        df['label'].values,
        test_size=0.20,
        random_state=42,
        stratify=df['label'].values
    )
    print(f"Jeu d'entraînement : {len(train_texts)} exemples")
    print(f"Jeu de test : {len(test_texts)} exemples")

    models_to_train = {
        "xlm": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
        "camembert": "camembert-base"
    }

    if target_model != "all":
        if target_model not in models_to_train:
            raise ValueError(f"Modèle inconnu : {target_model}. Choisissez 'xlm', 'camembert' ou 'all'.")
        models_to_train = {target_model: models_to_train[target_model]}

    for m_type, base_name in models_to_train.items():
        train_and_evaluate_single_model(m_type, base_name, df, train_texts, test_texts, train_labels, test_labels)

if __name__ == "__main__":
    import sys
    target = "all"
    if len(sys.argv) > 1:
        target = sys.argv[1]
    
    if target == "cascade":
        from train_cascade import run_cascade_pipeline
        run_cascade_pipeline()
    else:
        train_model(target)
