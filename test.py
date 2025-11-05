from backend.retriever import Retriever
from ollama import chat

# Initialize retriever
r = Retriever()
query = "Why do girls get periods?"

# 1. Retrieve relevant docs
contexts = r.retrieve(query, k=4)
ctx_text = "\n\n".join([f"Source: {c['title']}\n{c['text']}" for c in contexts])

# 2. Build prompt
prompt = f"You are a kind, factual assistant specialising in adolescent menstrual health.\n\nContext:\n{ctx_text}\n\nUser: {query}\nAssistant:"

# 3. Call Ollama
response = chat(
    model="llama3.2:1b",
    messages=[{"role": "user", "content": prompt}]
)

# 4. Extract text
# Latest SDK: response.message.content
print("Answer:")
print(response.message.content)
