
"""
import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .retriever import Retriever
from dotenv import load_dotenv
import ollama
from .speech_module import router as speech_router
import whisper

load_dotenv()

MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b")

app = FastAPI()


# Add the router
app.include_router(speech_router)

# --- Enable CORS so frontend can call backend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to your frontend URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load Whisper model once (can be 'tiny', 'base', 'small', 'medium', 'large')
model = whisper.load_model("small")




retriever = Retriever()

class Query(BaseModel):
    question: str

def build_prompt(question, contexts):
    system = "You are a kind, factual assistant specialising in adolescent menstrual health. Use the provided context to answer briefly and clearly. If unsure, encourage seeking a healthcare professional."
    ctx_text = "\n\n".join([f"Source: {c['title']}\n{c['text']}" for c in contexts])
    prompt = f"{system}\n\nContext:\n{ctx_text}\n\nUser: {question}\nAssistant:"
    return prompt

@app.get("/")
async def root():
    return {"message": "Welcome to the Menstrual Health Chatbot API!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/chat")
async def chat(q: Query):
    contexts = retriever.retrieve(q.question, k=4)
    prompt = build_prompt(q.question, contexts)

    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.message.content
        sources = [c["title"] for c in contexts]
        return {"answer": answer, "sources": sources}

    except Exception as e:
        return {"error": str(e)}
    

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # Save the uploaded file temporarily
    with open("temp_audio.wav", "wb") as f:
        f.write(await file.read())

    # Transcribe using Whisper
    result = model.transcribe("temp_audio.wav")

    # Remove temp file
    os.remove("temp_audio.wav")

    return {"text": result["text"]}
"""

import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import ollama
from .retriever import Retriever
from .speech_module import router as speech_router

load_dotenv()

# Use environment variable for model name, fallback to default
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.2:1b")

app = FastAPI()

# Add the router
app.include_router(speech_router)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize retriever once
retriever = Retriever()

# Lazy-load Whisper model
whisper_model = None

class Query(BaseModel):
    question: str

def build_prompt(question, contexts):
    system = (
        "You are a kind, factual assistant specialising in adolescent menstrual health. "
        "Use the provided context to answer briefly and clearly. If unsure, encourage seeking a healthcare professional."
    )
    ctx_text = "\n\n".join([f"Source: {c['title']}\n{c['text']}" for c in contexts])
    prompt = f"{system}\n\nContext:\n{ctx_text}\n\nUser: {question}\nAssistant:"
    return prompt

@app.get("/")
async def root():
    return {"message": "Welcome to the Menstrual Health Chatbot API!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/chat")
async def chat(q: Query):
    contexts = retriever.retrieve(q.question, k=4)
    prompt = build_prompt(q.question, contexts)
    try:
        response = ollama.chat(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}]
        )
        answer = response.message.content
        sources = [c["title"] for c in contexts]
        return {"answer": answer, "sources": sources}
    except Exception as e:
        return {"error": str(e)}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    global whisper_model

    # Lazy-load Whisper model on first request
    if whisper_model is None:
        import whisper
        whisper_model = whisper.load_model("small")  # or "tiny" if memory is tight

    # Save uploaded file temporarily
    temp_path = "temp_audio.wav"
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Transcribe
    result = whisper_model.transcribe(temp_path)

    # Remove temp file
    os.remove(temp_path)

    return {"text": result["text"]}
