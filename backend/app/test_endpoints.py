import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database import SessionLocal
from app.models import User, Message, UserRole
from app.security import hash_password

client = TestClient(app)


def test_entire_flow():
    db: Session = SessionLocal()
    
    # Nettoyage préventif des anciens comptes de test
    db.query(Message).filter(Message.text.like("%test%")).delete(synchronize_session=False)
    db.query(User).filter(User.email.in_(["test_emp@segula.com", "test_rh@segula.com"])).delete(synchronize_session=False)
    db.commit()

    print("\n--- 1. Inscription et Connexion d'un Employé ---")
    # Inscription de l'employé de test
    reg_emp_resp = client.post(
        "/api/auth/register",
        json={
            "email": "test_emp@segula.com",
            "full_name": "Test Employe",
            "password": "supersecurepassword123",
            "role": "employe",
            "department": "Ingénierie",
            "phone": "0612345678"
        }
    )
    assert reg_emp_resp.status_code == 201, f"Échec de l'inscription: {reg_emp_resp.text}"
    print("[OK] Inscription employé réussie")

    # Connexion de l'employé
    login_emp_resp = client.post(
        "/api/auth/login",
        json={
            "email": "test_emp@segula.com",
            "password": "supersecurepassword123"
        }
    )
    assert login_emp_resp.status_code == 200, f"Échec de la connexion: {login_emp_resp.text}"
    emp_token = login_emp_resp.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print("[OK] Connexion employé réussie (token obtenu)")

    print("\n--- 2. Test du Chatbot ---")
    # Envoyer un message positif
    chat_resp1 = client.post(
        "/api/chat",
        json={"message": "Bonjour, je suis ravi de travailler ici!"},
        headers=emp_headers
    )
    assert chat_resp1.status_code == 200
    res_data1 = chat_resp1.json()
    print(f"Question: 'Bonjour, je suis ravi de travailler ici!'")
    print(f"Réponse: '{res_data1['reply']}'")
    print(f"Sentiment détecté: {res_data1['sentiment']}")
    assert res_data1["sentiment"] in ["Positif", "Neutre", "Stressé", "Frustré", "Colère"]

    # Envoyer un message stressé
    chat_resp2 = client.post(
        "/api/chat",
        json={"message": "Je me sens extrêmement stressé et fatigué par la charge de travail."},
        headers=emp_headers
    )
    assert chat_resp2.status_code == 200
    res_data2 = chat_resp2.json()
    print(f"Question: 'Je me sens extrêmement stressé et fatigué...'.")
    print(f"Réponse: '{res_data2['reply']}'")
    print(f"Sentiment détecté: {res_data2['sentiment']}")
    # En mode fallback ou réel, le sentiment "Stressé" ou "Neutre" sera détecté
    
    # 3. Récupérer l'historique
    history_resp = client.get("/api/chat/history", headers=emp_headers)
    assert history_resp.status_code == 200
    history_data = history_resp.json()
    print(f"[OK] Historique récupéré: {len(history_data)} messages trouvés (2 questions + 2 réponses attendus)")
    assert len(history_data) == 4

    print("\n--- 3. Inscription et Connexion d'un Responsable RH ---")
    # Inscription RH
    reg_rh_resp = client.post(
        "/api/auth/register",
        json={
            "email": "test_rh@segula.com",
            "full_name": "Test RH",
            "password": "supersecurepassword123",
            "role": "rh",
            "department": "RH"
        }
    )
    assert reg_rh_resp.status_code == 201
    print("[OK] Inscription RH réussie")

    # Connexion RH
    login_rh_resp = client.post(
        "/api/auth/login",
        json={
            "email": "test_rh@segula.com",
            "password": "supersecurepassword123"
        }
    )
    assert login_rh_resp.status_code == 200
    rh_token = login_rh_resp.json()["access_token"]
    rh_headers = {"Authorization": f"Bearer {rh_token}"}
    print("[OK] Connexion RH réussie (token obtenu)")

    print("\n--- 4. Test des Indicateurs Analytiques (RH) ---")
    # Résumé
    summary_resp = client.get("/api/analytics/summary", headers=rh_headers)
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    print(f"Score de bien-être global calculé: {summary_data['global_wellbeing_score']}%")
    print(f"Pourcentage de risque de burnout: {summary_data['burnout_risk_percentage']}%")
    print(f"Nombre d'alertes actives détectées: {summary_data['active_alerts_count']}")
    
    # Alertes
    alerts_resp = client.get("/api/analytics/alerts", headers=rh_headers)
    assert alerts_resp.status_code == 200
    alerts_data = alerts_resp.json()
    print(f"Alertes détaillées détectées: {len(alerts_data)}")
    for alert in alerts_data:
        print(f" - Collaborateur: {alert['name']}, Risque: {alert['risk']}, Signal: {alert['reason']} (Score: {alert['score']}%)")

    # Employés
    employees_resp = client.get("/api/analytics/employees", headers=rh_headers)
    assert employees_resp.status_code == 200
    employees_data = employees_resp.json()
    print(f"Nombre de collaborateurs répertoriés: {len(employees_data)}")

    print("\n--- 5. Nettoyage de l'historique ---")
    # Effacer le chat
    clear_resp = client.delete("/api/chat", headers=emp_headers)
    assert clear_resp.status_code == 200
    
    # Re-vérifier l'historique (doit être vide)
    history_resp_after = client.get("/api/chat/history", headers=emp_headers)
    assert len(history_resp_after.json()) == 0
    print("[OK] Historique de chat effacé et vérifié vide")

    # Suppression des utilisateurs de test en base
    db.query(Message).filter(Message.user_id.in_(
        db.query(User.id).filter(User.email.in_(["test_emp@segula.com", "test_rh@segula.com"]))
    )).delete(synchronize_session=False)
    db.query(User).filter(User.email.in_(["test_emp@segula.com", "test_rh@segula.com"])).delete(synchronize_session=False)
    db.commit()
    db.close()
    print("[OK] Nettoyage de la base de données terminé")
    print("\n=============================================")
    print(" TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS ! ✅ ")
    print("=============================================")


if __name__ == "__main__":
    test_flow_func = test_entire_flow
    try:
        test_flow_func()
    except AssertionError as ae:
        print(f"\n❌ ÉCHEC DU TEST: {ae}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERREUR INATTENDUE DURANT LE TEST: {e}")
        sys.exit(1)
