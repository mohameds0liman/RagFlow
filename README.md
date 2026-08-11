# RAGFlow

Self-hosted RAG platform that turns company documents into Q&A chatbots.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Description

RAGFlow is an internal Retrieval-Augmented Generation (RAG) platform with two roles: **Admin** and **User**. Admins build and manage the full knowledge pipeline — upload documents to knowledge bases, ingest and chunk them, embed and upsert them into a local vector store, then configure chatbots on top of that data. Users chat with the chatbots they have been granted access to. The backend is a FastAPI + LangChain pipeline driven by a Flowise-style component registry; the frontend is a React/MUI admin console with a chat UI for end users.

## Table of Contents

- [RAGFlow](#ragflow)
  - [Description](#description)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Tech Stack](#tech-stack)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Usage](#usage)
    - [1. Start the backend](#1-start-the-backend)
    - [2. Start the frontend (development)](#2-start-the-frontend-development)
    - [3. Run the admin pipeline](#3-run-the-admin-pipeline)
    - [API reference](#api-reference)
  - [Project Structure](#project-structure)
  - [Running Tests](#running-tests)
  - [Deployment](#deployment)
  - [Contributing](#contributing)
  - [License](#license)

## Features

- **Role-based access control** — JWT access tokens (30 min) with a rotating httpOnly refresh cookie (7 days); `admin` and `user` roles enforced per route.
- **Document stores** — create/update/delete knowledge bases; upload files (PDF, DOCX, TXT, CSV, HTML, MD, JSON) or add web pages by URL.
- **Ingestion pipeline** — extract text with a loader (PDF / web), split into chunks (recursive text splitter), store chunks with metadata, and edit or delete chunks manually afterward.
- **Upsert pipeline** — embed chunks with Ollama and index them into a local Chroma vector store using LangChain incremental indexing (SQL record manager, `cleanup="incremental"`).
- **Dynamic component configuration** — the backend exposes component metadata (`/admin/components/...`) so the frontend renders config forms dynamically, matching the Flowise component model.
- **Chatbots** — link a chatbot to a knowledge base, pick an Ollama model, choose a chain type (`stuff`, `map_reduce`, `refine`, `map_rerank`), set top-K and prompt template with chat history.
- **Chat** — per-chatbot sessions with history; admin live-test mode with a split-screen "compare old vs. new settings" test; user chat with per-user daily message rate limits (HTTP 429).
- **User management** — activate/deactivate users, change roles, toggle STT/TTS features, set daily message limits, and grant/revoke per-chatbot access.
- **Dashboard** — live counts for knowledge bases, documents, loaders, chunks, and chatbots.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI 0.104.1, Uvicorn 0.24.0, Pydantic 2.7.4 |
| RAG | LangChain 0.3.0, langchain-community 0.3.0, langchain-ollama 0.2.0, langchain-openai 0.2.0 |
| Database | PostgreSQL (SQLAlchemy 2.0.23, no Alembic — `create_all()` on boot) |
| Vector store | Chroma (local, `langchain-qdrant` dependency installed but unused) |
| Embeddings / LLM | Ollama (`nomic-embed-text`, `llama3.1:8b`) |
| Auth | bcrypt 4.1.1, passlib, hand-rolled HS256 JWT (python-jose dependency installed, not used) |
| Frontend | React 19, Vite 8, MUI v9 (`@mui/material`, `@mui/x-data-grid`), Redux Toolkit 2, react-router-dom 7, axios, formik + yup, notistack, react-markdown, `@tabler/icons-react` |

## Prerequisites

1. **Python** — `requirements.txt` pins dependency versions; Python interpreter version is not declared in the repo. TODO: confirm.
2. **Node.js + npm** — required by the Vite frontend; minimum version not declared. TODO: confirm.
3. **PostgreSQL** — running on `localhost:5432` with a database named `ragflow`. The connection string `postgresql://postgres:2463@localhost:5432/ragflow` is hardcoded in `backend/app/db/session.py`.
4. **Ollama** — running on `localhost:11434` with the models used by your configuration (defaults: `llama3.1:8b` for chat, `nomic-embed-text` for embeddings):
   ```bash
   ollama pull llama3.1:8b
   ollama pull nomic-embed-text
   ```

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Rag_Flow
   ```
2. Create and activate a Python virtual environment, then install backend dependencies:
   ```bash
   python -m venv env
   .\env\Scripts\activate   # Windows PowerShell
   source env/bin/activate  # macOS / Linux
   pip install -r requirements.txt
   ```
3. Create the PostgreSQL database (tables are created automatically at first run — the app calls `Base.metadata.create_all()`; there is no migration system):
   ```bash
   psql -U postgres -h localhost -c "CREATE DATABASE ragflow;"
   ```
4. Install frontend dependencies:
   ```bash
   cd Frontend
   npm install
   ```
5. Create the frontend environment file:
   ```bash
   copy .env.example ..\Frontend\.env   # Windows
   cp .env.example ../Frontend/.env     # macOS / Linux
   ```
   Then edit `Frontend/.env` (see [Configuration](#configuration)).
6. Start Ollama and PostgreSQL services.
7. (Optional) Seed the database with a sample admin user, document store, chatbot, and session:
   ```bash
   cd backend
   python -m app.db.models
   ```
   The seeded admin account is `admin@gmail.com` / `admin123`.

## Configuration

The backend has **no environment-file configuration** — all settings are hardcoded in source files (see table below).

| Setting | Location | Description | Example value |
|---|---|---|---|
| `VITE_API_URL` | `Frontend/.env` | Base URL of the FastAPI backend, used by axios | `http://127.0.0.1:8000` |
| `VITE_STREAMING_ENABLED` | `Frontend/.env` | Streaming flag; defined but **not read by any frontend code** — streaming is not implemented yet | `false` |
| PostgreSQL URL | `backend/app/db/session.py` | SQLAlchemy engine URL | `postgresql://postgres:2463@localhost:5432/ragflow` |
| JWT secret / algorithm / expiry | `backend/app/api/auth.py` (`get_token_settings`) | Access token 30 min, refresh cookie 7 days, HS256 | `ragflow-super-secret-jwt-key-change-in-production` |
| CORS allowed origins | `backend/app/main.py` | Only the Vite dev server is allowed | `http://localhost:5173` |
| Static mount | `backend/app/main.py` | Serves the built frontend from this absolute path | `D:\WorkSpace\GitHub\Repo\Rag_Flow\Frontend\dist` |
| Chroma persist directory | `backend/app/components/vectorstores/Chroma/Chroma.py` (component default) | Local vector store data directory | `./chroma_db` |
| Uploads directory | `backend/app/api/Admin/admin.py` | Uploaded files are stored per knowledge base under `uploads/<store_id>/` | `uploads/<store_id>/` |

To change any backend setting (DB credentials, JWT secret, CORS origin, static mount path), edit the files listed above and restart the backend.

## Usage

### 1. Start the backend

```bash
python run.py
```

Uvicorn starts on `http://127.0.0.1:8000` (`app.main:app`, no reload).

### 2. Start the frontend (development)

```bash
cd Frontend
npm run dev
```

Open `http://localhost:5173`. Alternatively, `run.bat` starts both servers in separate terminal windows.

### 3. Run the admin pipeline

1. Log in as an admin account (or the seeded `admin@gmail.com` / `admin123`).
2. **Document Stores → Add Document Store** — create a knowledge base.
3. Open the store → **Add Content** — upload a file (or add a web page URL), choose a loader and chunker, set chunk size/overlap, then **Process**. The document is extracted and chunked into `DocumentChunk` rows.
4. **Upsert Config** — select embedder (OllamaEmbedding), vector store (ChromaVectorStore), and record manager (LangChainRecordManager), and save. The example request body below is taken from `backend/app/api/Admin/admin.py`:
   ```json
   {
     "embedder_name": "OllamaEmbedding",
     "vector_store_name": "ChromaVectorStore",
     "record_manager_name": "LangChainRecordManager",
     "embedder_config": {"base_url": "http://localhost:11434", "model": "nomic-embed-text"},
     "vector_store_config": {"collection_name": "default", "persist_directory": "./chroma_db"},
     "record_manager_config": {"namespace": "chroma/my_collection", "db_url": "postgresql://postgres:2463@localhost:5432/ragflow"}
   }
   ```
5. Back in the store, **Upsert** on the ready document — chunks are embedded and indexed into Chroma.
6. **Chatbots → Add Chatbot** — name it, link the knowledge base, select an Ollama chat model, chain type, top-K, and prompt template. Example payload (from the `POST /admin/chatbots` example in `backend/app/api/Admin/chatbot.py`):
   ```json
   {
     "name": "Support Bot",
     "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
     "llm_config": {
       "name": "ChatOllama",
       "build_config": {"base_url": "http://localhost:11434", "model": "llama3.1:8b", "temperature": 0}
     },
     "chain_config": {"chain_type": "stuff", "k": 4},
     "prompt_config": {"template": "Use the following pieces of context to answer the question at the end.\nIf you don't know the answer, just say that you don't know.\n{context}\nChat History:\n{chat_history}\nQuestion: {question}\nHelpful Answer:"}
   }
   ```
7. Test the chatbot under **Chat**, or grant a user access (Users → Manage Access → Chatbot Access) and log in as that user at `/chat`.

### API reference

Interactive API docs are available at `http://127.0.0.1:8000/docs` (FastAPI auto-generated).

Note: the create-KB endpoint uses `POST /admin/knowledge-bases` (hyphen) while all other knowledge-base endpoints use `knowledge_bases` (underscore) — this mismatch exists in the backend and is intentional for now.

## Project Structure

```
Rag_Flow/
├── run.py                        # Backend entrypoint (uvicorn on 127.0.0.1:8000)
├── run.bat                       # Dev launcher: backend + frontend in two windows
├── requirements.txt              # Python dependencies (pinned)
├── .env.example                  # Frontend env template
├── ragflow_frontend_prd.md       # Full frontend spec
├── tasks.md                      # Milestone progress tracker
├── backend/
│   └── app/
│       ├── main.py               # FastAPI app, CORS, router registration, static mount
│       ├── bootstrap.py          # Registers RAG components into the registry
│       ├── api/
│       │   ├── auth.py           # Login/register/refresh, JWT + bcrypt, role guards
│       │   ├── Admin/            # admin.py (KB/chunks/upsert), chatbot.py, chat.py, users.py, profile.py
│       │   └── User/             # chat.py (user chat + rate limits), profile.py
│       ├── components/           # Flowise-style components (BaseComponent + InputParam)
│       │   ├── base.py           # BaseComponent / InputParam models
│       │   ├── registry.py       # Singleton component registry
│       │   ├── documentloaders/  # PyPDFLoader, WebBaseLoader
│       │   ├── chunker/          # RecursiveCharacterTextSplitter
│       │   ├── embedder/         # OllamaEmbedding
│       │   ├── vectorstores/     # Chroma
│       │   ├── Chatmodels/       # ChatOllama
│       │   ├── chain/            # ConversationalRetrievalChain
│       │   └── record_manager/   # LangChain SQLRecordManager
│       ├── core/factory.py       # PipelineFactory: loader, upsert, and chat pipelines
│       └── db/
│           ├── session.py        # Hardcoded PostgreSQL engine + get_db dependency
│           └── models.py         # ORM models + create_all() + optional seed script
├── Frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx              # App entry (Redux + Router + notistack)
│       ├── App.jsx               # Route table with role guards
│       ├── api/                  # axiosInstance.js + per-domain API modules
│       ├── store/                # RTK store + slices (auth, kb, chatbots, users, userChat, theme)
│       ├── routes/               # AdminRoutes / UserRoutes guards
│       ├── layouts/              # AdminLayout (sidebar) / UserLayout (minimal)
│       ├── views/                # auth, admin (Dashboard, DocumentStores, Chatbots, Chat, Users), user
│       ├── components/           # MainCard, StyledDataGrid, ConfirmDialog, StatusChip, ChatWindow
│       └── theme/index.js        # MUI theme factory (light/dark)
├── uploads/                      # Uploaded files, grouped per knowledge base
└── chroma_db/                    # Local Chroma vector store data
```

## Running Tests

No automated test suite exists in this repository (no test framework, no test files).

The frontend has a lint script:

```bash
cd Frontend
npm run lint
```

## Deployment

No deployment configuration exists in the repository (no Dockerfile, no CI pipeline, no hosting config).

The production-serving path is already wired: `backend/app/main.py` mounts the static frontend build via `StaticFiles(html=True)` from `Frontend/dist`:

```bash
cd Frontend
npm run build
```

Then run the backend with `python run.py` and open `http://127.0.0.1:8000`. The static mount path is hardcoded to an absolute Windows path and must be edited before deploying elsewhere. The frontend must be built with `VITE_API_URL` pointing at the deployed backend.

## Contributing

1. Work inside `Frontend/` for UI changes; backend code lives under `backend/`. Do not commit `.env` files or secrets.
2. Follow the existing conventions: every frontend API call goes through `src/api/axiosInstance.js`, server data is fetched via Redux `createAsyncThunk`, destructive actions use `ConfirmDialog`, and errors surface via `enqueueSnackbar`.
3. Run `npm run lint` (frontend) before opening a pull request.
4. Update `tasks.md` and the PRD if you change scope.

## License

MIT License — see [LICENSE](LICENSE). Copyright (c) 2026 Mohamed Soliman.
