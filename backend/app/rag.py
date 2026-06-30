import os
import json
import pypdf
import google.generativeai as genai
import chromadb
from chromadb.config import Settings

# Configuration des chemins
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "data"))
CHROMA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "chroma_db"))
METADATA_FILE = os.path.join(CHROMA_DIR, "ingested_metadata.json")

# S'assurer que le dossier Chroma existe
os.makedirs(CHROMA_DIR, exist_ok=True)

# Configuration de Google Gemini
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("[WARN] GEMINI_API_KEY n'est pas configurée dans l'environnement backend. Le RAG ne fonctionnera pas.")

# Initialisation du client persistant ChromaDB
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_or_create_collection(name="segula_hr_policies")


def get_pdf_text(pdf_path: str) -> str:
    """Extrait tout le texte d'un fichier PDF page par page."""
    text = ""
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    except Exception as e:
        print(f"[ERREUR RAG] Impossible de lire le PDF {pdf_path}: {e}")
    return text


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Découpe un texte en morceaux (chunks) avec chevauchement."""
    chunks = []
    text = text.replace('\r', '').strip()
    if not text:
        return chunks
        
    start = 0
    while start < len(text):
        end = start + chunk_size
        # Si on n'est pas à la fin, on essaie de couper sur un espace pour ne pas couper un mot au milieu
        if end < len(text):
            last_space = text.rfind(' ', start, end)
            if last_space != -1 and last_space > start + (chunk_size // 2):
                end = last_space
        
        chunks.append(text[start:end].strip())
        start = end - overlap
        if start >= len(text) or chunk_size - overlap <= 0:
            break
            
    return [c for c in chunks if len(c) > 10]


def get_embedding(text: str, is_query: bool = False) -> list[float]:
    """Appelle l'API Gemini pour générer l'embedding d'un texte (avec retry en cas de quota dépassé)."""
    import time
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY manquante.")
        
    task_type = "retrieval_query" if is_query else "retrieval_document"
    
    max_retries = 5
    base_delay = 5
    
    for attempt in range(max_retries):
        try:
            response = genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                task_type=task_type
            )
            return response['embedding']
        except Exception as e:
            err_str = str(e).lower()
            if "429" in err_str or "quota" in err_str or "limit" in err_str:
                if attempt < max_retries - 1:
                    sleep_time = base_delay * (attempt + 1)
                    print(f"[RAG] Quota atteint pour l'embedding. Nouvelle tentative dans {sleep_time}s...")
                    time.sleep(sleep_time)
                    continue
            raise e


def load_metadata() -> dict:
    """Charge le fichier de métadonnées pour savoir quels PDFs sont déjà ingérés."""
    if os.path.exists(METADATA_FILE):
        try:
            with open(METADATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_metadata(metadata: dict):
    """Enregistre le statut d'ingestion dans le fichier de métadonnées."""
    with open(METADATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)


def ingest_documents(force: bool = False):
    """
    Parcourt le dossier data/ à la recherche de fichiers PDF.
    Découpe et intègre uniquement les nouveaux fichiers ou ceux ayant été modifiés.
    """
    if not API_KEY:
        print("[INFO RAG] Ingestion ignorée car GEMINI_API_KEY n'est pas configurée.")
        return

    if not os.path.exists(DATA_DIR):
        print(f"[WARN RAG] Le dossier de données '{DATA_DIR}' n'existe pas.")
        return

    metadata = load_metadata()
    updated_metadata = {}
    files_processed = 0

    # Liste tous les fichiers PDF du dossier data/
    pdf_files = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.pdf')]
    print(f"[RAG] Vérification des PDFs dans {DATA_DIR} ({len(pdf_files)} fichiers trouvés)...")

    for filename in pdf_files:
        file_path = os.path.join(DATA_DIR, filename)
        mtime = str(os.path.getmtime(file_path))
        
        # Si le fichier a déjà été ingéré avec la même date de modif, on passe (sauf si force=True)
        if not force and filename in metadata and metadata[filename] == mtime:
            updated_metadata[filename] = mtime
            continue

        print(f"[RAG] Ingestion du document : {filename}...")
        text = get_pdf_text(file_path)
        chunks = chunk_text(text)
        
        if not chunks:
            print(f"[RAG] Aucun texte exploitable extrait de {filename}.")
            continue

        # Supprimer les anciens chunks associés à ce fichier
        try:
            collection.delete(where={"source": filename})
        except Exception:
            pass

        # Générer les embeddings et ajouter à ChromaDB
        embeddings = []
        ids = []
        documents = []
        metadatas = []

        for idx, chunk in enumerate(chunks):
            try:
                embedding = get_embedding(chunk, is_query=False)
                embeddings.append(embedding)
                ids.append(f"{filename}_{idx}")
                documents.append(chunk)
                metadatas.append({"source": filename, "chunk_id": idx})
            except Exception as e:
                print(f"[RAG] Erreur lors de la génération d'embedding pour le chunk {idx} de {filename}: {e}")

        if embeddings:
            collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            print(f"[RAG] {filename} ingéré avec succès ({len(embeddings)} chunks enregistrés).")
            files_processed += 1
            
        updated_metadata[filename] = mtime

    # Mettre à jour les métadonnées pour supprimer les fichiers qui ont été effacés du dossier data/
    save_metadata(updated_metadata)
    if files_processed > 0:
        print(f"[RAG] Ingestion terminée. {files_processed} document(s) mis à jour.")
    else:
        print("[RAG] Tous les documents sont déjà à jour.")


def query_context(query_text: str, n_results: int = 4) -> str:
    """
    Recherche dans ChromaDB les morceaux de documents les plus pertinents
    par rapport à la requête de l'utilisateur, et les renvoie concaténés.
    """
    if not API_KEY:
        return ""

    try:
        # Si la collection est vide, retourner vide
        if collection.count() == 0:
            return ""

        query_embedding = get_embedding(query_text, is_query=True)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )
        
        context_list = []
        if results and 'documents' in results and results['documents']:
            # results['documents'] est une liste de listes de chaînes
            for doc_list in results['documents']:
                for doc in doc_list:
                    context_list.append(doc)
                    
        return "\n\n---\n\n".join(context_list)
    except Exception as e:
        print(f"[ERREUR RAG] Échec de la recherche de contexte : {e}")
        return ""
