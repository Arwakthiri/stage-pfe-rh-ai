import os
import json
import pandas as pd
import numpy as np
import torch
import shutil
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from torch.optim import AdamW
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, classification_report
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

# Fixer la graine
torch.manual_seed(42)
np.random.seed(42)

ML_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(ML_DIR, "sentiment_dataset.csv")

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

def download_and_sample_amazon():
    print("\n=== [STAGE 1] Ingestion du dataset Amazon Reviews (HuggingFace) ===")
    from datasets import load_dataset
    
    # Charger la portion d'entraînement française (format Parquet standard sans script)
    raw_dataset = load_dataset("SetFit/amazon_reviews_multi_fr", split="train")
    df = pd.DataFrame(raw_dataset)
    print(f"Dataset Amazon original chargé : {len(df)} lignes.")
    
    # Échantillonnage équilibré de 2000 avis (400 par label de 0 à 4)
    sampled_dfs = []
    for label in [0, 1, 2, 3, 4]:
        label_df = df[df['label'] == label]
        if len(label_df) > 400:
            label_df = label_df.sample(n=400, random_state=42)
        sampled_dfs.append(label_df)
        
    balanced_df = pd.concat(sampled_dfs).reset_index(drop=True)
    print(f"Dataset Amazon échantillonné : {len(balanced_df)} lignes.")
    
    # Extraire textes et labels en listes python standard pour éviter les erreurs d'indexation pyarrow
    texts = list(balanced_df['text'].astype(str))
    labels = list(balanced_df['label'].astype(int))
    
    return train_test_split(texts, labels, test_size=0.15, random_state=42, stratify=labels)

def train_stage1(model_type, base_model_name, train_texts, test_texts, train_labels, test_labels, device):
    print(f"\n=== [STAGE 1] Pré-entraînement du modèle {model_type.upper()} sur Amazon Reviews ===")
    
    tokenizer = AutoTokenizer.from_pretrained(base_model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        base_model_name,
        num_labels=5,
        ignore_mismatched_sizes=True
    )
    model = model.to(device)
    
    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer)
    test_dataset = SentimentDataset(test_texts, test_labels, tokenizer)
    
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False)
    
    optimizer = AdamW(model.parameters(), lr=3e-5, weight_decay=0.01)
    
    # 2 époques de pré-entraînement pour la rapidité sur CPU
    epochs = 2
    for epoch in range(epochs):
        model.train()
        correct = 0
        total = 0
        print(f"Époque {epoch + 1}/{epochs}")
        for idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            
            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            
            _, preds = torch.max(outputs.logits, dim=1)
            correct += torch.sum(preds == labels).item()
            total += labels.size(0)
            
            if (idx + 1) % 40 == 0 or (idx + 1) == len(train_loader):
                acc = (correct / total) * 100
                print(f"  Batch {idx+1}/{len(train_loader)} - Loss: {loss.item():.4f} - Acc: {acc:.2f}%")
                
    # Sauvegarder les poids intermédiaires du stage 1
    temp_dir = os.path.join(ML_DIR, f"temp_stage1_{model_type}")
    os.makedirs(temp_dir, exist_ok=True)
    model.save_pretrained(temp_dir)
    tokenizer.save_pretrained(temp_dir)
    print(f"[OK] Modèle intermédiaire Stage 1 sauvegardé sous {temp_dir}")
    return temp_dir

def train_stage2(model_type, stage1_model_path, df_corp, train_texts, test_texts, train_labels, test_labels, device):
    print(f"\n=== [STAGE 2] Fine-tuning final du modèle {model_type.upper()} sur les sentiments corporatifs ===")
    
    tokenizer = AutoTokenizer.from_pretrained(stage1_model_path)
    model = AutoModelForSequenceClassification.from_pretrained(stage1_model_path, num_labels=5)
    
    # Forcer la réinitialisation de la tête de classification pour démarrer sur un classifieur vierge
    if hasattr(model, 'classifier'):
        print("[INFO] Réinitialisation de la tête de classification (classifier head)...")
        model.classifier.out_proj.weight.data.normal_(mean=0.0, std=0.02)
        model.classifier.out_proj.bias.data.zero_()
        if hasattr(model.classifier, 'dense'):
            model.classifier.dense.weight.data.normal_(mean=0.0, std=0.02)
            model.classifier.dense.bias.data.zero_()
            
    model = model.to(device)
    
    train_dataset = SentimentDataset(train_texts, train_labels, tokenizer)
    test_dataset = SentimentDataset(test_texts, test_labels, tokenizer)
    
    train_loader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=8, shuffle=False)
    
    optimizer = AdamW(model.parameters(), lr=2e-5, weight_decay=0.01)
    
    # 3 époques de fine-tuning final sur notre dataset corporatif
    epochs = 3
    for epoch in range(epochs):
        model.train()
        correct = 0
        total = 0
        print(f"Époque {epoch + 1}/{epochs}")
        for idx, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['label'].to(device)
            
            optimizer.zero_grad()
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            
            _, preds = torch.max(outputs.logits, dim=1)
            correct += torch.sum(preds == labels).item()
            total += labels.size(0)
            
            if (idx + 1) % 10 == 0 or (idx + 1) == len(train_loader):
                acc = (correct / total) * 100
                print(f"  Batch {idx+1}/{len(train_loader)} - Loss: {loss.item():.4f} - Acc: {acc:.2f}%")

    print("\n=== Évaluation finale et calcul des métriques ===")
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
    
    target_names = [REV_LABEL_MAP[i] for i in range(5)]
    class_report = classification_report(
        all_true_labels, all_preds, target_names=target_names, zero_division=0
    )

    print(f"\n--- RÉSULTATS FINAUX DU FINE-TUNING CASCADE ({model_type.upper()}) ---")
    print(f"Accuracy  : {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"Precision : {precision:.4f}")
    print(f"Recall    : {recall:.4f}")
    print(f"F1-Score  : {f1:.4f}")
    print("\nRapport de classification par classe :")
    print(class_report)

    # Matrice de confusion
    cm = confusion_matrix(all_true_labels, all_preds)
    
    # Tracer la matrice de confusion
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=target_names, yticklabels=target_names)
    plt.title(f'Matrice de Confusion - Modèle Cascade {model_type.upper()} Segula (PFE)')
    plt.ylabel('Vrais sentiments')
    plt.xlabel('Sentiments prédits')
    plt.tight_layout()
    cm_image_path = os.path.join(ML_DIR, f"confusion_matrix_{model_type}.png")
    plt.savefig(cm_image_path)
    plt.close()
    print(f"[OK] Graphique de la matrice de confusion sauvegardé sous {cm_image_path}")

    # Enregistrer les métriques en JSON
    report_dict = classification_report(
        all_true_labels, all_preds, target_names=target_names, zero_division=0, output_dict=True
    )
    metrics_json_path = os.path.join(ML_DIR, f"model_metrics_{model_type}.json")
    metrics_data = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "total_samples": int(len(df_corp)),
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
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Métriques sauvegardées dans {metrics_json_path}")

    # Sauvegarder le modèle fine-tuné final
    model_output_dir = os.path.join(ML_DIR, f"fine_tuned_{model_type}")
    os.makedirs(model_output_dir, exist_ok=True)
    model.save_pretrained(model_output_dir)
    tokenizer.save_pretrained(model_output_dir)
    print(f"[OK] Modèle final sauvegardé sous : {model_output_dir}\n")

def run_cascade_pipeline():
    # Détecter l'appareil
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Exécution du pipeline cascade sur : {device}")
    
    # 1. Charger et préparer le dataset corporatif de PFE
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Le fichier CSV {CSV_PATH} n'existe pas.")
        
    df_corp = pd.read_csv(CSV_PATH)
    df_corp['label'] = df_corp['sentiment'].map(LABEL_MAP)
    
    texts_c = list(df_corp['text'].astype(str))
    labels_c = list(df_corp['label'].astype(int))
    
    train_texts_c, test_texts_c, train_labels_c, test_labels_c = train_test_split(
        texts_c,
        labels_c,
        test_size=0.20,
        random_state=42,
        stratify=labels_c
    )
    
    # 2. Charger le dataset Amazon et échantillonner
    train_texts_a, test_texts_a, train_labels_a, test_labels_a = download_and_sample_amazon()
    
    base_models = {
        "xlm": "cardiffnlp/twitter-xlm-roberta-base-sentiment",
        "camembert": "camembert-base"
    }
    
    for m_type, base_name in base_models.items():
        # Étape 1 : Pré-entraînement sur Amazon
        stage1_path = train_stage1(m_type, base_name, train_texts_a, test_texts_a, train_labels_a, test_labels_a, device)
        
        # Étape 2 : Fine-tuning sur le dataset de sentiments RH
        train_stage2(m_type, stage1_path, df_corp, train_texts_c, test_texts_c, train_labels_c, test_labels_c, device)
        
        # Nettoyer les fichiers intermédiaires temporaires du stage 1 pour libérer de l'espace
        try:
            shutil.rmtree(stage1_path)
            print(f"[CLEAN] Dossier temporaire {stage1_path} supprimé.")
        except Exception as e:
            print(f"[CLEAN ERR] Échec de la suppression de {stage1_path}: {e}")

    print("\n=== PIPELINE DE FINE-TUNING CASCADE TERMINÉ AVEC SUCCÈS ===")

if __name__ == "__main__":
    run_cascade_pipeline()
