from pathlib import Path

DATA_DIR = Path('data') / 'index'
print(DATA_DIR.exists()) 
print((DATA_DIR / 'faiss.idx').exists())  
print((DATA_DIR / 'docs.json').exists()) 
