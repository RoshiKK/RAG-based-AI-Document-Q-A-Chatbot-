import os
import uuid
from typing import Dict, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PyPDF2 import PdfReader
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()

app = FastAPI(title="RAG Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_stores: Dict[str, FAISS] = {}

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

try:
    llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash", temperature=0)
except Exception as e:
    print(f"Warning: Failed to initialize LLM: {e}")
    llm = None

class AskRequest(BaseModel):
    session_id: str
    question: str

class SourceSnippet(BaseModel):
    page_content: str
    metadata: dict

class AskResponse(BaseModel):
    answer: str
    sources: List[SourceSnippet]

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        reader = PdfReader(file.file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(text)
        documents = [Document(page_content=chunk, metadata={"source": file.filename}) for chunk in chunks]

        vectorstore = FAISS.from_documents(documents, embeddings)
        session_id = str(uuid.uuid4())
        session_stores[session_id] = vectorstore

        return {"message": "Upload successful", "session_id": session_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest):
    if request.session_id not in session_stores:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a PDF first.")
    
    if not llm:
        raise HTTPException(status_code=500, detail="LLM not initialized. Is GOOGLE_API_KEY set?")

    vectorstore = session_stores[request.session_id]
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    prompt = ChatPromptTemplate.from_messages([
        ("system", 
         "You are an assistant for question-answering tasks. "
         "Use the following retrieved context to answer the question. "
         "If you don't know the answer, say you don't know. "
         "Keep the answer concise.\n\nContext: {context}"),
        ("human", "{question}"),
    ])

    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    try:
        retrieved_docs = retriever.invoke(request.question)
        context = format_docs(retrieved_docs)
        
        chain = prompt | llm | StrOutputParser()
        answer = chain.invoke({"context": context, "question": request.question})

        sources = [
            SourceSnippet(page_content=doc.page_content, metadata=doc.metadata)
            for doc in retrieved_docs
        ]

        return AskResponse(answer=answer, sources=sources)

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "RAG Chatbot API is running"}