import os
import json
from transformers import pipeline

_sentiment_pipeline = None
_is_custom_model = False

def get_sentiment_pipeline():
    """
    Charge le pipeline de sentiment de manière paresseuse (lazy loading).
    Compare les F1-scores de model_metrics_camembert.json et model_metrics_xlm.json
    et charge le modèle ayant le meilleur score.
    """
    global _sentiment_pipeline, _is_custom_model
    if _sentiment_pipeline is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ml_dir = os.path.abspath(os.path.join(base_dir, "..", "ML"))
        
        xlm_path = os.path.join(ml_dir, "fine_tuned_xlm_roberta")
        camembert_path = os.path.join(ml_dir, "fine_tuned_camembert")
        
        xlm_metrics_path = os.path.join(ml_dir, "model_metrics_xlm.json")
        camembert_metrics_path = os.path.join(ml_dir, "model_metrics_camembert.json")
        
        best_model_path = None
        best_model_name = None
        
        xlm_f1 = -1.0
        camembert_f1 = -1.0
        
        # Lire les métriques d'XLM-RoBERTa
        if os.path.exists(xlm_metrics_path) and os.path.exists(xlm_path):
            try:
                with open(xlm_metrics_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    xlm_f1 = float(data.get("f1_score", 0.0))
            except Exception:
                pass
                
        # Lire les métriques de CamemBERT
        if os.path.exists(camembert_metrics_path) and os.path.exists(camembert_path):
            try:
                with open(camembert_metrics_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    camembert_f1 = float(data.get("f1_score", 0.0))
            except Exception:
                pass

        print(f"[INFO] Comparaison des F1-Scores -> XLM-RoBERTa: {xlm_f1:.4f}, CamemBERT: {camembert_f1:.4f}")
        
        # Choisir le modèle avec le plus haut F1-score
        if camembert_f1 >= 0 and camembert_f1 >= xlm_f1:
            best_model_path = camembert_path
            best_model_name = "CamemBERT"
        elif xlm_f1 >= 0:
            best_model_path = xlm_path
            best_model_name = "XLM-RoBERTa"
            
        if best_model_path and os.path.exists(best_model_path):
            print(f"[INFO] Chargement du meilleur modèle personnalisé ({best_model_name}) depuis {best_model_path}...")
            try:
                _sentiment_pipeline = pipeline(
                    "sentiment-analysis",
                    model=best_model_path,
                    tokenizer=best_model_path,
                    device=-1  # CPU
                )
                _is_custom_model = True
                print(f"[OK] Modèle personnalisé {best_model_name} (5 classes) chargé avec succès.")
                return _sentiment_pipeline
            except Exception as e:
                print(f"[WARN] Échec du chargement du modèle personnalisé {best_model_name}: {e}. Fallback...")
        
        print("[INFO] Chargement du modèle de sentiment de base (cardiffnlp/twitter-xlm-roberta-base-sentiment)...")
        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-xlm-roberta-base-sentiment",
            device=-1
        )
        _is_custom_model = False
    return _sentiment_pipeline


def predict_sentiment(text: str) -> str:
    """
    Analyse le sentiment d'un texte à l'aide du modèle XLM-RoBERTa local.
    S'adapte automatiquement selon que le modèle chargé est le modèle
    personnalisé à 5 classes ou le modèle de base à 3 classes.
    """
    try:
        nlp = get_sentiment_pipeline()
        results = nlp(text)
        if not results:
            return "Neutre"
            
        label = results[0]['label'].upper()
        
        if _is_custom_model:
            # Correspondance des classes du modèle fine-tuné (0 à 4)
            label_index_map = {
                0: "Positif",
                1: "Neutre",
                2: "Stressé",
                3: "Frustré",
                4: "Colère"
            }
            if "LABEL_" in label:
                try:
                    idx = int(label.replace("LABEL_", ""))
                    if idx in label_index_map:
                        return label_index_map[idx]
                except Exception:
                    pass
            
            # Fallback de secours si le label n'a pas le format LABEL_X
            clean_label = label.capitalize()
            if clean_label in label_index_map.values():
                return clean_label
            return "Neutre"
            
        else:
            # Modèle de base à 3 classes (LABEL_0: negative, LABEL_1: neutral, LABEL_2: positive)
            if label in ["POSITIVE", "LABEL_2"]:
                return "Positif"
            elif label in ["NEUTRAL", "LABEL_1"]:
                return "Neutre"
            else:
                # Le modèle a détecté un sentiment négatif. On applique les heuristiques linguistiques.
                clean_text = text.lower()
                
                # 1. Mots-clés de Colère
                anger_keywords = [
                    "colère", "colere", "énerve", "enerve", "haine", "fâché", "fache", 
                    "insupportable", "crisp", "agacé", "agace", "rage", "furieux", "énervé", "énerver"
                ]
                
                # 2. Mots-clés de Stress / Burnout
                stress_keywords = [
                    "stress", "fatigue", "surmenage", "burnout", "épuisé", "epuise", "fatigué", "fatigue",
                    "pression", "charge", "craque", "craqué", "tendu", "angoisse", "anxiété", "anxieux",
                    "débordé", "deborde"
                ]
                
                # 3. Mots-clés de Frustration / Découragement
                frustrated_keywords = [
                    "frustré", "frustre", "déçu", "decu", "injustice", "marre", "assez", 
                    "ral-le-bol", "ras-le-bol", "bloqué", "bloque", "démotivé", "demotive", "dégoûté", "degoute"
                ]
                
                if any(k in clean_text for k in anger_keywords):
                    return "Colère"
                elif any(k in clean_text for k in stress_keywords):
                    return "Stressé"
                elif any(k in clean_text for k in frustrated_keywords):
                    return "Frustré"
                    
                return "Stressé"
            
    except Exception as e:
        print(f"[WARN SENTIMENT] Échec du modèle local transformers: {e}. Utilisation du fallback.")
        
        clean_text = text.lower()
        if any(k in clean_text for k in ["stress", "fatigue", "épuisé", "fatigué", "anxiété"]):
            return "Stressé"
        elif any(k in clean_text for k in ["colère", "énerve", "fâché", "énervé"]):
            return "Colère"
        elif any(k in clean_text for k in ["frustré", "déçu", "marre", "ras-le-bol"]):
            return "Frustré"
        elif any(k in clean_text for k in ["bonjour", "salut", "merci", "super", "ravi", "heureux"]):
            return "Positif"
        return "Neutre"
