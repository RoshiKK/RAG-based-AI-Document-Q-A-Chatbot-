# Complete RAG-based AI Document Q&A Chatbot

This project is a complete RAG-based Document Q&A Chatbot, consisting of a FastAPI backend and a Next.js frontend.

## Prerequisites
- Python 3.9+
- Node.js 18+
- A Google API Key for Gemini.

## How to Run Locally

### 1. Run the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your Google API Key:
   ```bash
   # On Windows (PowerShell):
   $env:GOOGLE_API_KEY="your_api_key_here"
   # On Mac/Linux:
   export GOOGLE_API_KEY="your_api_key_here"
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.

### 2. Run the Frontend (Next.js)

1. Open another terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (already installed during creation, but just in case):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000`.

## Features
- **Upload PDF**: Drag and drop or click to upload a PDF file.
- **RAG Pipeline**: Uses LangChain, FAISS, HuggingFace embeddings, and Gemini.
- **Interactive Chat**: Ask questions and get answers derived directly from the document content, including source snippets.
