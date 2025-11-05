import json
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from pathlib import Path

DATA_DIR = (Path(__file__).resolve().parents[1] / 'data' / 'index').resolve()
EMB_MODEL = "all-MiniLM-L6-v2"
EMB_DIM = 384

class Retriever:
    def __init__(self):
        self.model = SentenceTransformer(EMB_MODEL)
        self.index = faiss.read_index(str(DATA_DIR / 'faiss.idx'))
        with open(DATA_DIR / 'docs.json', 'r', encoding='utf-8') as f:
            self.docs = json.load(f)

    def retrieve(self, query, k=4):
        emb = self.model.encode([query], convert_to_numpy=True)
        faiss.normalize_L2(emb)
        D, I = self.index.search(emb.astype('float32'), k)
        hits = []
        for idx in I[0]:
            if idx < len(self.docs):
                hits.append(self.docs[idx])
        return hits
