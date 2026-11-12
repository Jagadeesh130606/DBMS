#!/usr/bin/env python3
"""
Semantic Embedding Generation Script using Sentence Transformers (all-MiniLM-L6-v2)
Connects to PostgreSQL and generates/updates pgvector embeddings for research papers.
"""

import os
import sys
import numpy as np
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DIMENSION = 384

def main():
    print(f"=== Research Paper Semantic Embedding Generator ===")
    print(f"Model: {MODEL_NAME} (Embedding dimension: {DIMENSION})")

    try:
        from sentence_transformers import SentenceTransformer
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Install dependencies with: pip install -r requirements.txt")
        sys.exit(1)

    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/research_paper_db")
    
    print(f"Connecting to PostgreSQL at {db_url}...")
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

    print(f"Loading Sentence Transformer model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    cur.execute("SELECT paper_id, title, abstract FROM RESEARCH_PAPER ORDER BY paper_id ASC;")
    papers = cur.fetchall()
    print(f"Retrieved {len(papers)} research papers from database.")

    for paper_id, title, abstract in papers:
        text_to_embed = f"{title}. {abstract}"
        embedding = model.encode(text_to_embed, normalize_embeddings=True)
        vector_str = "[" + ",".join(map(str, embedding.tolist())) + "]"

        cur.execute("""
            INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model)
            VALUES (%s, %s, %s)
            ON CONFLICT (paper_id) 
            DO UPDATE SET 
                embedding = EXCLUDED.embedding,
                embedding_model = EXCLUDED.embedding_model,
                created_at = CURRENT_TIMESTAMP;
        """, (paper_id, vector_str, MODEL_NAME))
        print(f"  [Paper #{paper_id}] Generated embedding vector({len(embedding)}) for: {title[:45]}...")

    conn.commit()
    cur.close()
    conn.close()
    print("Semantic embedding generation successfully completed!")

if __name__ == "__main__":
    main()

