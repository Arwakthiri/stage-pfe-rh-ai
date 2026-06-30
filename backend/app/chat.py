from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import os
import json
from typing import Literal
import pydantic
import google.generativeai as genai

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.rag import query_context, API_KEY

router = APIRouter(prefix="/api", tags=["💬 Chatbot"])


class ChatbotResponseSchema(pydantic.BaseModel):
    reply: str


def get_local_fallback_response(text: str) -> tuple[str, str]:
    """Système de repli en cas d'absence d'API Key ou d'erreur réseau."""
    clean_text = text.lower()
    
    if any(k in clean_text for k in ['cong', 'vacanc', 'repos', 'leave', 'holiday', 'إجاز', 'رخص']):
        reply = (
            "En tant que collaborateur de Segula Technologies, vous bénéficiez de 25 jours de congés payés par an. "
            "Pour soumettre une demande de congés, veuillez passer par le portail RH en spécifiant les dates et le "
            "type de congé souhaité. Votre manager direct recevra une notification pour validation."
        )
        sentiment = "Neutre"
    elif any(k in clean_text for k in ['stress', 'fatigue', 'bien', 'sant', 'burn', 'health', 'ضغط', 'تعب']):
        reply = (
            "Le bien-être de nos collaborateurs est essentiel. Segula Technologies met à votre disposition "
            "une ligne d'écoute psychologique gratuite, anonyme et disponible 24h/24 au 0800 900 800. "
            "Vous pouvez également en parler en toute confidentialité avec votre référent RH ou planifier un entretien dédié."
        )
        sentiment = "Stressé"
    elif any(k in clean_text for k in ['frais', 'rembours', 'transport', 'bus', 'train', 'expense', 'مصاريف', 'نقل']):
        reply = (
            "Pour vos frais de transport professionnels, Segula Technologies rembourse 50% de votre abonnement "
            "de transports en commun. Veuillez déposer votre justificatif d'achat mensuel sur la plateforme RH "
            "avant le 15 du mois en cours pour un remboursement sur la paye suivante."
        )
        sentiment = "Neutre"
    elif any(k in clean_text for k in ['format', 'apprend', 'cours', 'train', 'learn', 'تدريب', 'تعليم']):
        reply = (
            "Vous disposez de plusieurs modules de formation en ligne sur votre tableau de bord (Gestion du stress, "
            "Communication en équipe). Si vous souhaitez suivre une formation externe ou acquérir de nouvelles compétences, "
            "vous pouvez soumettre une demande dans le cadre de votre entretien professionnel annuel."
        )
        sentiment = "Neutre"
    elif any(k in clean_text for k in ['bonjour', 'salut', 'hello', 'hi', 'مرحب']):
        reply = (
            "Bonjour ! Je suis votre Assistant RH IA de Segula Technologies. "
            "Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur les congés, les formations ou votre bien-être."
        )
        sentiment = "Positif"
    else:
        reply = (
            "Je prends bien note de votre message. Notre IA analyse votre demande. "
            "Pour toute urgence ou question administrative complexe, je vous invite à contacter directement le service RH de Segula."
        )
        sentiment = "Neutre"
        
    return reply, sentiment


@router.post(
    "/chat",
    response_model=schemas.ChatbotReplyResponse,
    summary="Discuter avec l'assistant RH IA (RAG & Analyse de sentiment)",
)
def chat_with_bot(
    chat_input: schemas.ChatMessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint principal pour discuter avec le Chatbot RH.
    1. Récupère le contexte des documents RH (ChromaDB)
    2. Récupère l'historique récent de l'utilisateur
    3. Interroge Gemini avec une réponse structurée (Reply + Sentiment)
    4. Enregistre les messages dans la base de données
    """
    user_message_text = chat_input.message.strip()
    if not user_message_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le message ne peut pas être vide."
        )

    # 1. Rechercher le contexte pertinent (RAG)
    context = query_context(user_message_text, n_results=4)

    # 2. Récupérer l'historique récent (10 derniers messages)
    history_messages = db.query(models.Message).filter(
        models.Message.user_id == current_user.id
    ).order_by(models.Message.created_at.desc()).limit(10).all()
    history_messages.reverse()

    history_str = ""
    for msg in history_messages:
        role = "Collaborateur" if msg.sender == "user" else "Assistant"
        history_str += f"{role}: {msg.text}\n"

    reply_text = ""

    # 3. Interroger Gemini ou exécuter le système de repli
    if API_KEY:
        try:
            # Nous utilisons gemini-2.5-flash car il est rapide et supporte les schémas de réponse
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = f"""Vous êtes l'Assistant RH IA de SEGULA Technologies. Votre rôle est d'aider le collaborateur en répondant à ses questions de manière professionnelle, chaleureuse, confidentielle et précise, en vous basant sur les documents de référence RH fournis ci-dessous.

Documents de référence RH :
{context if context else "Aucun document trouvé pour cette question. Répondez au mieux de vos connaissances de manière générale sur les pratiques RH standard."}

Historique récent de la conversation :
{history_str if history_str else "Aucun historique de conversation."}

Question du collaborateur :
{user_message_text}

Instructions :
1. Répondez en français (ou dans la langue de la question si approprié).
2. Soyez clair, concis et bienveillant.
3. Si la réponse ne se trouve pas du tout dans les documents et nécessite une décision managériale/RH, dites-le poliment et conseillez de contacter le service RH de Segula.
"""

            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=ChatbotResponseSchema
                )
            )

            # Charger la réponse structurée
            result_data = json.loads(response.text)
            reply_text = result_data.get("reply", "").strip()
            
            if not reply_text:
                raise ValueError("Réponse vide générée par l'IA.")
                
        except Exception as e:
            print(f"[WARN RAG] Échec de l'appel Gemini, utilisation du fallback : {e}")
            reply_text, _ = get_local_fallback_response(user_message_text)
    else:
        # Pas d'API key -> fallback local
        reply_text, _ = get_local_fallback_response(user_message_text)

    # 4. Détecter le sentiment de l'utilisateur avec notre modèle local XLM-RoBERTa (Transformers)
    from app.sentiment_model import predict_sentiment
    sentiment = predict_sentiment(user_message_text)

    # 5. Enregistrer les messages dans la base de données
    # Message de l'utilisateur
    user_msg = models.Message(
        user_id=current_user.id,
        sender="user",
        text=user_message_text,
        sentiment=sentiment
    )
    db.add(user_msg)
    
    # Réponse du bot
    bot_msg = models.Message(
        user_id=current_user.id,
        sender="bot",
        text=reply_text,
        sentiment=None
    )
    db.add(bot_msg)
    
    db.commit()

    return schemas.ChatbotReplyResponse(
        reply=reply_text,
        sentiment=sentiment
    )


@router.get(
    "/chat/history",
    response_model=list[schemas.ChatMessageResponse],
    summary="Récupérer l'historique complet des messages de l'utilisateur",
)
def get_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Renvoie tous les messages échangés par l'utilisateur connecté avec le chatbot."""
    return db.query(models.Message).filter(
        models.Message.user_id == current_user.id
    ).order_by(models.Message.created_at.asc()).all()


@router.delete(
    "/chat",
    response_model=schemas.MessageResponse,
    summary="Effacer l'historique complet des messages de l'utilisateur",
)
def clear_chat_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Supprime tous les messages de l'utilisateur connecté."""
    db.query(models.Message).filter(models.Message.user_id == current_user.id).delete()
    db.commit()
    return schemas.MessageResponse(message="Historique de chat effacé avec succès.")


