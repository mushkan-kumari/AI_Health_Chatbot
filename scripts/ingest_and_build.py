# scripts/ingest_and_build.py
import pandas as pd
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
from pathlib import Path

DATA_DIR = Path('../data').resolve()
EMB_MODEL = "all-MiniLM-L6-v2"  # small & fast
EMB_DIM = 384

def main():
    df = pd.read_csv(DATA_DIR / 'intents.csv')
    docs = []
    texts = []
    for _, r in df.iterrows():
        text = f"{r['title']}\nQ: {r['question']}\nA: {r['answer']}"
        docs.append({
            'id': r['id'],
            'title': r['title'],
            'question': r['question'],
            'answer': r['answer'],
            'text': text
        })
        texts.append(text)

    model = SentenceTransformer(EMB_MODEL)
    embeddings = model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
    # normalize for cosine similarity (FAISS IndexFlatIP)
    faiss.normalize_L2(embeddings)

    index = faiss.IndexFlatIP(EMB_DIM)
    index.add(embeddings.astype('float32'))

    # save
    Path(DATA_DIR / 'index').mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(DATA_DIR / 'index' / 'faiss.idx'))
    with open(DATA_DIR / 'index' / 'docs.json', 'w', encoding='utf-8') as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)

    print("Built index with", len(docs), "documents.")

if __name__ == "__main__":
    main()
