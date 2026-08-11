# RAGFlow — Backend API Documentation

REST API for the RAGFlow platform: document ingestion, vector-store upsert, chatbot management, chat sessions, user administration, and authentication.

## Base URL

| Environment | Base URL | Source |
|---|---|---|
| Development / default | `http://127.0.0.1:8000` | `run.py` (uvicorn `host="127.0.0.1", port=8000`); frontend `VITE_API_URL` |

All routes are mounted at the root (no `/api` prefix). Interactive docs: `http://127.0.0.1:8000/docs` (FastAPI auto-generated).

## Authentication

The API uses **JWT Bearer tokens** (HS256, hand-rolled) plus a rotating **httpOnly refresh cookie**.

- Access token: returned by `POST /auth/login` and `POST /auth/refresh`. Expires after 30 minutes.
- Refresh token: set as an `httpOnly`, `SameSite=Lax` cookie named `refresh_token`; valid 7 days; rotated on every refresh.
- Send the access token in the `Authorization` header on every protected request:

```bash
curl -X GET http://127.0.0.1:8000/admin/chatbots \
  -H "Authorization: Bearer <access_token>"
```

Roles: `admin` and `user`. Admin routes require the `admin` role; user routes require the `user` role. Tokens are valid for both roles; role checks are per-route.

## General Conventions

- **Request format:** JSON (`application/json`) for all bodies except file upload (`multipart/form-data`).
- **Response format:** JSON objects; list endpoints wrap arrays in a named key (`knowledge_bases`, `documents`, `chunks`, `chatbots`, `sessions`, `messages`, `users`, `accesses`).
- **IDs:** UUID strings.
- **Timestamps:** ISO 8601 strings.
- **Enums:** serialized as their string values (`"admin"`, `"active"`, `"uploaded"`, …).
- **Error shape:** `HTTPException` errors return a single object:
  ```json
  { "detail": "Chatbot not found" }
  ```
  Pydantic validation failures return HTTP 422 with a list of field errors:
  ```json
  {
    "detail": [
      { "loc": ["body", "email"], "msg": "value is not a valid email address", "type": "value_error" }
    ]
  }
  ```
- **Pagination:** no global pattern. Only `GET /admin/users` supports `skip`/`limit`.
- **Route naming quirk:** the create-KB endpoint is `POST /admin/knowledge-bases` (hyphen); every other knowledge-base route uses `knowledge_bases` (underscore). Both exist in code.
- **Response of chat endpoints:** `POST .../chat` returns both persisted messages (`user_message`, `ai_message`) rather than a single `reply` string.

## Table of Contents

- [Auth](#auth)
- [Admin — Components](#admin--components)
- [Admin — Knowledge Bases](#admin--knowledge-bases)
  - [Store CRUD](#store-crud)
  - [Upsertion Config](#upsertion-config)
  - [Upload & Documents](#upload--documents)
  - [Ingestion](#ingestion)
  - [Chunks](#chunks)
- [Admin — Chatbots](#admin--chatbots)
- [Admin — Chat Sessions & Messages](#admin--chat-sessions--messages)
- [Admin — Users](#admin--users)
- [Admin — Profile](#admin--profile)
- [Admin — Dashboard](#admin--dashboard)
- [User — Chat](#user--chat)
- [User — Profile](#user--profile)
- [Data Models / Schemas](#data-models--schemas)
- [Status Codes](#status-codes)
- [Rate Limiting](#rate-limiting)
- [Versioning](#versioning)

---

## Auth

### POST /auth/register

Creates a new user account with the `user` role. No email verification is performed.

- **Auth:** none

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | yes | 3–64 characters |
| `email` | string (email) | yes | Must be unique |
| `password` | string | yes | 8–128 characters, must contain letters and numbers |

```json
{
  "username": "jane.doe",
  "email": "jane@company.com",
  "password": "password123"
}
```

**Response — 200**

```json
{
  "status": "registered",
  "user_id": "7b9a2c4e-0f1a-4c3e-8a1b-9d2e4f6a8b0c",
  "username": "jane.doe",
  "email": "jane@company.com"
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Password shorter than 8 chars, or missing letters, or missing numbers |
| 409 | Username or email already registered |

### POST /auth/login

Authenticates by email + password. Returns an access token and sets the `refresh_token` httpOnly cookie.

- **Auth:** none

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | yes | Registered email |
| `password` | string | yes | Account password |

```json
{ "email": "admin@gmail.com", "password": "admin123" }
```

**Response — 200** (also sets `Set-Cookie: refresh_token=...; HttpOnly; SameSite=lax`)

```json
{
  "status": "logged_in",
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_at": "2026-08-11T12:30:00",
  "user": {
    "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "username": "admin",
    "email": "admin@gmail.com",
    "role": "admin",
    "is_verified": true
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 401 | Unknown email or wrong password (`"Invalid credentials"`) |
| 403 | Account disabled (`"Account is disabled"`) |

### POST /auth/logout

Invalidates the stored refresh token and clears the cookie. Requires a valid Bearer token.

- **Auth:** yes (any role)

**Request body:** none

**Response — 200**

```json
{ "status": "logged_out" }
```

### POST /auth/refresh

Issues a new access token (and rotates the refresh cookie). Reads the refresh token from the `refresh_token` cookie — no body needed.

- **Auth:** none (cookie-based)

**Request body:** none

**Response — 200**

```json
{
  "access_token": "<new-jwt>",
  "token_type": "Bearer",
  "expires_at": "2026-08-11T12:45:00"
}
```

**Errors**

| Status | Condition |
|---|---|
| 401 | Missing refresh cookie (`"Missing refresh token"`) or unknown/revoked token (`"Invalid refresh token"`) |
| 403 | Account disabled |

### POST /auth/forgot-password

Issues a one-hour reset token (stored hashed) and stores it on the user record. Responds identically whether or not the email exists.

- **Auth:** none

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | string (email) | yes | Account email |

```json
{ "email": "jane@company.com" }
```

**Response — 200**

```json
{
  "status": "email_sent",
  "message": "If the email exists, a reset link has been sent"
}
```

### POST /auth/reset-password

Resets the password using the token issued by `forgot-password`.

- **Auth:** none

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `token` | string | yes | Raw reset token (un-hashed) |
| `new_password` | string | yes | 8–128 characters, letters and numbers required |

```json
{ "token": "xyz123...", "new_password": "newpassword456" }
```

**Response — 200**

```json
{ "status": "password_reset" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid or expired reset token; or weak new password |

---

## Admin — Components

These endpoints introspect the component registry (`ComponentRegistry`) so the frontend can render dynamic configuration forms.

### GET /admin/components/categories

Lists all registered component categories.

- **Auth:** no

**Query parameters:** none

**Response — 200**

```json
{
  "categories": ["loader", "chunker", "embedder", "vector_store", "chat_model", "record_manager", "chain"]
}
```

### GET /admin/components

Lists components in a category with their input parameters.

- **Auth:** no

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `category` | string | yes | — | Component category (see categories endpoint) |

**Response — 200**

```json
{
  "OllamaEmbedding": [
    {
      "name": "base_url",
      "type": "str",
      "default": "http://localhost:11434",
      "required": false,
      "description": ""
    },
    {
      "name": "model",
      "type": "str",
      "default": "nomic-embed-text",
      "required": false,
      "description": ""
    }
  ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Unknown category |

### GET /admin/components/{name}/schema

Returns the full schema (inputs, icon) of a single component.

- **Auth:** no

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Component name, e.g. `ChatOllama` |

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `category` | string | yes | — | Category the component belongs to |

**Response — 200**

```json
{
  "name": "ChatOllama",
  "category": "chat_model",
  "icon": "ollama.svg",
  "icon_path": "/admin/components/chat_model/ChatOllama/icon",
  "inputs": [
    {
      "name": "base_url",
      "type": "str",
      "default": "http://localhost:11434",
      "required": true,
      "description": "Model Base URL"
    }
  ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Unknown category or component |

### GET /admin/components/{category}/{name}/icon

Serves the component's SVG icon file.

- **Auth:** no

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `category` | string | yes | Component category |
| `name` | string | yes | Component name |

**Response — 200:** `image/svg+xml` file.

**Errors**

| Status | Condition |
|---|---|
| 404 | Component, icon attribute, or icon file not found |

---

## Admin — Knowledge Bases

### Store CRUD

#### POST /admin/knowledge-bases

Creates a knowledge base (`DocumentStore`). Note the hyphenated path — this is the only knowledge-base route with a hyphen.

- **Auth:** admin

**Request body** (flat body params, not a model)

| Field | Type | Required | Description |
|---|---|---|---|
| `knowledge_base_name` | string | yes | Store name |
| `description` | string | no | Store description (default `""`) |

```json
{ "knowledge_base_name": "Product Docs", "description": "Internal product documentation" }
```

**Response — 200**

```json
{
  "status": "created",
  "knowledge_base": {
    "id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
    "created_by": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "name": "Product Docs",
    "description": "Internal product documentation",
    "status": "active",
    "upsert_config_snapshot": null,
    "vector_store_config": null,
    "embedding_config": null,
    "record_manager_config": null,
    "created_date": "2026-08-11T10:00:00",
    "updated_date": "2026-08-11T10:00:00"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 401 / 403 | Missing token / not admin |
| 404 | Creator user not found |

#### GET /admin/knowledge_bases

Lists all knowledge bases with per-store counts, newest first.

- **Auth:** no

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `status` | string | no | — | Filter by store status (`active`, `processing`, `error`, `inactive`, `ready`) |

**Response — 200**

```json
{
  "status": "all",
  "count": 2,
  "knowledge_bases": [
    {
      "id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
      "name": "Product Docs",
      "description": "Internal product documentation",
      "status": "active",
      "created_date": "2026-08-11T10:00:00",
      "updated_date": "2026-08-11T10:00:00",
      "documents_count": 3,
      "loaders_count": 2,
      "chunks_count": 42,
      "chatbots_count": 1
    }
  ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid store status value |

#### PUT /admin/knowledge_bases/{knowledge_base_id}

Updates basic fields of a knowledge base. Only provided fields are changed.

- **Auth:** admin

**Path parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `knowledge_base_id` | UUID string | yes | Store id |

**Request body** (partial, all optional)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | no | New name |
| `description` | string | no | New description |
| `status` | string | no | New status (`active`, `processing`, `error`, `inactive`, `ready`) |

```json
{ "name": "Product Docs v2" }
```

**Response — 200**

```json
{
  "status": "updated",
  "knowledge_base": { "id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc", "name": "Product Docs v2", "status": "active" }
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid store status value |
| 404 | Knowledge base not found |

#### DELETE /admin/knowledge_bases/{knowledge_base_id}

Deletes a knowledge base and all related rows (documents, loaders, chunks, chatbots) via cascade.

- **Auth:** admin

**Response — 200**

```json
{ "status": "deleted", "knowledge_base_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc" }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### GET /admin/knowledge_bases/{knowledge_base_id}/status

Returns processing status and totals for a knowledge base.

- **Auth:** no

**Response — 200**

```json
{
  "status": "ok",
  "knowledge_base_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
  "upserion_config_ready": true,
  "vector_store_configured": true,
  "document_store_status": "active",
  "totals": { "documents": 3, "chunks": 42, "embedded_chunks": 40 }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

### Upsertion Config

#### POST /admin/knowledge_bases/{knowledge_base_id}/config

Saves the upsert pipeline configuration (embedder + vector store + record manager) as JSON blobs on the store. First-time configuration.

- **Auth:** admin

**Request body** (`UpsertionConfig`)

| Field | Type | Required | Description |
|---|---|---|---|
| `embedder_name` | string | yes | Registry name, e.g. `OllamaEmbedding` |
| `embedder_config` | object | yes | Component build config, e.g. `{"base_url": ..., "model": ...}` |
| `vector_store_name` | string | yes | Registry name, e.g. `ChromaVectorStore` |
| `vector_store_config` | object | yes | e.g. `{"collection_name": ..., "persist_directory": ...}` |
| `record_manager_name` | string | yes | Registry name, e.g. `LangChainRecordManager` |
| `record_manager_config` | object | yes | e.g. `{"namespace": ..., "db_url": ...}` |

```json
{
  "embedder_name": "OllamaEmbedding",
  "vector_store_name": "ChromaVectorStore",
  "record_manager_name": "LangChainRecordManager",
  "embedder_config": { "base_url": "http://localhost:11434", "model": "nomic-embed-text" },
  "vector_store_config": { "collection_name": "default", "persist_directory": "./chroma_db" },
  "record_manager_config": { "namespace": "chroma/my_collection", "db_url": "postgresql://postgres:2463@localhost:5432/ragflow" }
}
```

**Response — 200**

```json
{
  "status": "config_saved",
  "knowledge_base": { "id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc", "upsert_config_snapshot": { "embedder": { "name": "OllamaEmbedding" } } }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### PUT /admin/knowledge_bases/{knowledge_base_id}/config

Same body as POST; overwrites the existing configuration.

- **Auth:** admin

**Response — 200**

```json
{ "status": "config_updated", "knowledge_base": { "id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc" } }
```

#### POST /admin/knowledge_bases/{knowledge_base_id}/upsert

Embeds the chunks of one document and indexes them into the vector store via LangChain incremental indexing. Marks chunks `embedded` on success.

- **Auth:** admin

**Path parameters:** `knowledge_base_id` — UUID string — required.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `doc_id` | UUID string | yes | Document whose chunks to upsert |

```json
{ "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac" }
```

**Response — 200** (`result` is the LangChain indexing result)

```json
{
  "status": "upserted",
  "result": { "num_added": 42, "num_updated": 0, "num_skipped": 0, "num_deleted": 0 }
}
```

**Errors**

| Status | Condition |
|---|---|
| 400 | No upsert config saved for this store, or no chunks exist for the document |
| 404 | Knowledge base not found |
| 500 | Pipeline error (embedding / vector store / record manager) |

### Upload & Documents

#### POST /admin/knowledge_bases/{knowledge_base_id}/upload

Uploads a file into `uploads/<store_id>/` and registers an `UploadedDocument` row.

- **Auth:** admin
- **Content-Type:** `multipart/form-data`

**Form fields**

| Field | Type | Required | Description |
|---|---|---|---|
| `file` | file | yes | The document file (name is preserved) |
| `url` | string | no | Optional; unused by the handler (TODO: confirm intent) |

**Response — 200**

```json
{
  "status": "uploaded",
  "document": {
    "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
    "file_name": "manual.pdf",
    "file_path": "uploads\\05d803a0-2676-4cc8-a8e8-efd9c9ff70cc\\manual.pdf",
    "file_type": "pdf",
    "file_size_mb": 2.4,
    "status": "uploaded",
    "created_date": "2026-08-11T10:05:00",
    "updated_date": "2026-08-11T10:05:00"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### POST /admin/knowledge_bases/{knowledge_base_id}/web_page

Registers a web URL as a document (`file_type = "url"`) without downloading it.

- **Auth:** admin

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `url` | string | yes | Target URL |
| `name` | string | no | Display name; defaults to the URL |

```json
{ "url": "https://example.com/docs", "name": "Example Docs" }
```

**Response — 200**

```json
{
  "status": "uploaded",
  "document": {
    "id": "b3f1c8a0-2d4e-4f6a-9c8b-1a2b3c4d5e6f",
    "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
    "file_name": "Example Docs",
    "file_path": "https://example.com/docs",
    "file_type": "url",
    "file_size_mb": 0,
    "status": "uploaded"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### GET /admin/knowledge_bases/{knowledge_base_id}/documents

Lists documents of a store, newest first, with a chunk count per document.

- **Auth:** no

**Response — 200**

```json
{
  "documents": [
    {
      "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
      "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
      "file_name": "manual.pdf",
      "file_type": "pdf",
      "file_size_mb": 2.4,
      "status": "ready",
      "created_date": "2026-08-11T10:05:00",
      "updated_date": "2026-08-11T10:10:00",
      "chunks_count": 42
    }
  ]
}
```

#### DELETE /admin/knowledge_bases/{knowledge_base_id}/documents/{doc_id}

Deletes a document row and its physical file.

- **Auth:** admin

**Response — 200**

```json
{ "status": "deleted", "document_id": "f2262c94-dd93-4c93-acc7-908a9faeefac" }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base or document not found |

### Ingestion

#### POST /admin/knowledge_bases/{knowledge_base_id}/ingest_document

Runs the loader + chunker pipeline on an uploaded document: extracts text, splits it into chunks, persists a `DocumentLoader` (status `completed`) + `DocumentSplitter`, creates `DocumentChunk` rows (status `pending`), and marks the document `ready`.

- **Auth:** admin

**Path parameters:** `knowledge_base_id` — UUID string — required.

**Request body** (`LoadDocumentRequest`)

| Field | Type | Required | Description |
|---|---|---|---|
| `loader_name` | string | yes | Registry loader name, e.g. `PyPDFLoader` or `WebBaseLoader` |
| `chunker_name` | string | yes | Registry chunker name, e.g. `RecursiveCharacterTextSplitter` |
| `loader_config` | object | yes | Loader build config; `file_path` (or `web_path` for URL documents) is injected automatically |
| `chunker_config` | object | yes | Chunker build config; `chunk_size` and `chunk_overlap` also populate the `DocumentSplitter` row |
| `doc_id` | UUID string | yes | Document to ingest |

```json
{
  "loader_name": "PyPDFLoader",
  "chunker_name": "RecursiveCharacterTextSplitter",
  "loader_config": {},
  "chunker_config": { "chunk_size": 500, "chunk_overlap": 50 },
  "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac"
}
```

**Response — 200**

```json
{
  "status": "ingested",
  "loader_id": "c4d8e6a2-1b3c-4d5e-8f9a-0b1c2d3e4f5a",
  "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
  "chunks_count": 42
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base or uploaded document not found |
| 500 | Loader / chunker pipeline error (unknown component name, unreadable file, …) |

#### POST /admin/kb_Process/load_document

Test endpoint that runs the loader + chunker pipeline and returns chunks without persisting anything.

- **Auth:** admin

**Request body** (`LoadDocumentRequest`, same fields as `ingest_document`)

```json
{
  "loader_name": "PyPDFLoader",
  "chunker_name": "RecursiveCharacterTextSplitter",
  "loader_config": {},
  "chunker_config": { "chunk_size": 500, "chunk_overlap": 50 },
  "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac"
}
```

**Response — 200**

```json
{
  "loader": "PyPDFLoader",
  "document_count": 10,
  "documents": [
    { "page_content": "...", "metadata": { "source": "uploads/.../manual.pdf" } }
  ]
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Component not found (KeyError) |
| 500 | Pipeline error |

> Note: the handler reads `request.build_config`, but `LoadDocumentRequest` defines `loader_config`/`chunker_config` — this endpoint is inconsistent with its schema and may raise at runtime. TODO: confirm.

### Chunks

#### GET /admin/knowledge_bases/{knowledge_base_id}/chunks

Lists chunks of a document ordered by `chunk_no`.

- **Auth:** no

**Path parameters:** `knowledge_base_id` — UUID string — required.

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `doc_id` | UUID string | yes | — | Filter by document |

**Response — 200**

```json
{
  "chunks": [
    {
      "id": "9f8e7d6c-5b4a-4c3d-2e1f-0a9b8c7d6e5f",
      "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
      "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
      "page_content": "RAGFlow lets you index company documents...",
      "meta_data": { "source": "f2262c94-dd93-4c93-acc7-908a9faeefac" },
      "chunk_no": 0,
      "status": "embedded",
      "created_date": "2026-08-11T10:10:00",
      "updated_date": "2026-08-11T10:15:00"
    }
  ],
  "count": 1
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### GET /admin/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}

Returns a single chunk.

- **Auth:** no

**Response — 200**

```json
{
  "chunk": {
    "id": "9f8e7d6c-5b4a-4c3d-2e1f-0a9b8c7d6e5f",
    "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
    "doc_id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "page_content": "RAGFlow lets you index company documents...",
    "meta_data": {},
    "chunk_no": 0,
    "status": "embedded"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### PUT /admin/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}

Updates a chunk's content and metadata.

- **Auth:** admin

**Request body** (`UpdateChunkRequest`)

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | yes | New chunk text |
| `meta_data` | object | yes | New metadata |

```json
{ "content": "Updated chunk text...", "meta_data": { "source": "f2262c94-dd93-4c93-acc7-908a9faeefac" } }
```

**Response — 200**

```json
{ "chunk": { "id": "9f8e7d6c-5b4a-4c3d-2e1f-0a9b8c7d6e5f", "page_content": "Updated chunk text...", "meta_data": { "source": "f2262c94-dd93-4c93-acc7-908a9faeefac" }, "chunk_no": 0, "status": "embedded" } }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | `request` falsy / empty content (`"Can not save an empty Content"`) — TODO: confirm behavior when body is valid but empty string |
| 404 | Knowledge base not found |

#### DELETE /admin/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}

Deletes a chunk.

- **Auth:** admin

**Response — 200**

```json
{ "chunk": "Deleted" }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

#### POST /admin/knowledge_bases/{knowledge_base_id}/chunks

Appends a manual chunk to a document. `chunk_no` is computed as `existing_count + 1`.

- **Auth:** admin

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `doc_id` | UUID string | yes | — | Target document |

**Request body** (`UpdateChunkRequest`)

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | yes | Chunk text |
| `meta_data` | object | yes | Chunk metadata |

```json
{ "content": "Manually added chunk", "meta_data": {} }
```

**Response — 200**

```json
{ "chunk": "Added" }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Knowledge base not found |

---

## Admin — Chatbots

### POST /admin/chatbots

Creates a chatbot. When `store_id` is given, the store's `vector_store_config` and `embedding_config` are copied onto the chatbot (needed by the chat pipeline).

- **Auth:** admin

**Request body** (`CreateChatbotRequest`)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Chatbot name |
| `description` | string | no | Description |
| `store_id` | UUID string | no | Linked knowledge base |
| `status` | string | no | `active` or `inactive` (default `active`) |
| `llm_config` | object | no | `{"name": "<registry name>", "build_config": {...}}` |
| `chain_config` | object | no | `{"chain_type": "stuff"\|"map_reduce"\|"refine"\|"map_rerank", "k": 4, "last_k_message_pairs": 3}` |
| `memory_config` | object | no | Stored as JSON; not consumed by the pipeline (TODO: confirm) |
| `prompt_config` | object | no | `{"template": "..."}` — template must use `{context}`, `{chat_history}`, `{question}` |

```json
{
  "name": "Support Bot",
  "description": "Answers product questions",
  "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
  "status": "active",
  "llm_config": {
    "name": "ChatOllama",
    "build_config": { "base_url": "http://localhost:11434", "model": "llama3.1:8b", "temperature": 0 }
  },
  "chain_config": { "chain_type": "stuff", "k": 4 },
  "memory_config": { "name": "ConversationBufferWindowMemory", "build_config": { "k": 10 } },
  "prompt_config": {
    "template": "Use the following pieces of context to answer the question at the end.\nIf you don't know the answer, just say that you don't know.\n{context}\nChat History:\n{chat_history}\nQuestion: {question}\nHelpful Answer:"
  }
}
```

**Response — 200**

```json
{
  "status": "created",
  "chatbot": {
    "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "created_by": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
    "name": "Support Bot",
    "description": "Answers product questions",
    "status": "active",
    "vector_store_config": { "vector_store": { "name": "ChromaVectorStore", "build_config": {} } },
    "embedding_config": { "embedder": { "name": "OllamaEmbedding", "build_config": {} } },
    "llm_config": { "name": "ChatOllama", "build_config": { "base_url": "http://localhost:11434", "model": "llama3.1:8b" } },
    "chain_config": { "chain_type": "stuff", "k": 4 },
    "memory_config": null,
    "prompt_config": { "template": "..." },
    "created_date": "2026-08-11T10:20:00",
    "updated_date": "2026-08-11T10:20:00",
    "sessions_count": 0,
    "document_store_name": "Product Docs",
    "created_by_name": "admin"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | `store_id` does not exist (`"store_config not found"`) |

### GET /admin/chatbots

Lists all chatbots, newest first, with `sessions_count`, `document_store_name`, and `created_by_name`.

- **Auth:** no

**Response — 200**

```json
{
  "status": "list",
  "count": 1,
  "chatbots": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "name": "Support Bot",
      "status": "active",
      "sessions_count": 3,
      "document_store_name": "Product Docs",
      "created_by_name": "admin"
    }
  ]
}
```

### GET /admin/chatbots/{chatbot_id}

Returns one chatbot.

- **Auth:** no

**Response — 200**

```json
{
  "status": "found",
  "chatbot": { "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "name": "Support Bot", "status": "active" }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Chatbot not found |

### PUT /admin/chatbots/{chatbot_id}

Updates a chatbot. Only provided fields are changed. `store_id` is **not** updatable (not part of `UpdateChatbotRequest`).

- **Auth:** admin

**Request body** — any subset of: `name`, `description`, `llm_config`, `chain_config`, `memory_config`, `prompt_config` (same shapes as create).

```json
{
  "llm_config": { "name": "ChatOllama", "build_config": { "base_url": "http://localhost:11434", "model": "llama3.1:8b", "temperature": 0.2 } }
}
```

**Response — 200**

```json
{
  "status": "updated",
  "chatbot": { "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "name": "Support Bot", "llm_config": { "name": "ChatOllama" } }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Chatbot not found |

### DELETE /admin/chatbots/{chatbot_id}

Deletes a chatbot and its sessions (cascade).

- **Auth:** admin

**Response — 200**

```json
{ "status": "deleted", "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Chatbot not found |

---

## Admin — Chat Sessions & Messages

All routes require the admin role; sessions are scoped to the calling admin (list only returns the caller's sessions).

### POST /admin/chatbots/{chatbot_id}/sessions

Creates a chat session for the calling admin.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | no | Defaults to `Chat with <chatbot.name>` |

```json
{ "title": "Investigate billing bug" }
```

**Response — 200**

```json
{
  "status": "created",
  "session": {
    "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
    "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "user_id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "title": "Investigate billing bug",
    "created_date": "2026-08-11T10:30:00",
    "updated_date": "2026-08-11T10:30:00",
    "messages_count": 0,
    "chatbot_name": "Support Bot"
  }
}
```

### GET /admin/chatbots/{chatbot_id}/sessions

Lists the calling admin's sessions for a chatbot, most recently updated first.

**Response — 200**

```json
{
  "status": "list",
  "count": 1,
  "sessions": [
    { "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "title": "Investigate billing bug", "messages_count": 4, "chatbot_name": "Support Bot" }
  ]
}
```

### GET /admin/chatbots/{chatbot_id}/sessions/{session_id}

Returns one session.

**Response — 200**

```json
{
  "status": "found",
  "session": { "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "title": "Investigate billing bug", "messages_count": 4 }
}
```

**Errors:** 404 — chatbot or session not found.

### PUT /admin/chatbots/{chatbot_id}/sessions/{session_id}

Renames a session.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | no | New title |

```json
{ "title": "Billing bug — follow-up" }
```

**Response — 200**

```json
{ "status": "updated", "session": { "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "title": "Billing bug — follow-up" } }
```

### DELETE /admin/chatbots/{chatbot_id}/sessions/{session_id}

Deletes a session and its messages (cascade).

**Response — 200**

```json
{ "status": "deleted", "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b" }
```

### GET /admin/chatbots/{chatbot_id}/sessions/{session_id}/messages

Lists messages of a session in chronological order.

**Response — 200**

```json
{
  "status": "list",
  "count": 2,
  "messages": [
    {
      "id": "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
      "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
      "user_id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
      "role": "human",
      "content": "What is the return policy?",
      "source_documents": null,
      "execution_time": null,
      "created_date": "2026-08-11T10:30:01"
    },
    {
      "id": "d2e3f4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
      "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
      "user_id": null,
      "role": "ai",
      "content": "Our return policy allows returns within 30 days.",
      "source_documents": [ { "page_content": "...", "metadata": {} } ],
      "execution_time": 0.84,
      "created_date": "2026-08-11T10:30:04"
    }
  ]
}
```

### POST /admin/chatbots/{chatbot_id}/sessions/{session_id}/chat

Sends a message: persists the human message, loads history (last `last_k_message_pairs` human/ai pairs from `chain_config`, default 3), builds the chat pipeline (LLM + embedder + retriever from the chatbot's stored configs), invokes the chain, persists the AI answer with retrieved source documents and execution time.

- **Auth:** admin

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | yes | User message |

```json
{ "message": "What is the return policy?" }
```

**Response — 200**

```json
{
  "status": "ok",
  "user_message": {
    "id": "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f",
    "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
    "role": "human",
    "content": "What is the return policy?",
    "created_date": "2026-08-11T10:30:01"
  },
  "ai_message": {
    "id": "d2e3f4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a",
    "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
    "role": "ai",
    "content": "Our return policy allows returns within 30 days.",
    "source_documents": [ { "page_content": "...", "metadata": {} } ],
    "execution_time": 0.84,
    "created_date": "2026-08-11T10:30:04"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Chatbot or session not found |
| 500 | Chain build or invocation failure (`"Chat pipeline error: ..."`); DB changes are rolled back |

---

## Admin — Users

All user-management routes require the admin role.

### GET /admin/users

Lists users with `skip`/`limit` pagination.

**Query parameters**

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `skip` | integer | no | 0 | Number of users to skip |
| `limit` | integer | no | 50 | Max rows (no upper bound enforced) |

**Response — 200**

```json
{
  "total": 2,
  "users": [
    {
      "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
      "username": "admin",
      "email": "admin@gmail.com",
      "role": "admin",
      "is_active": true,
      "is_verified": true,
      "daily_message_limit": 100,
      "messages_used_today": 0,
      "stt_enabled": false,
      "tts_enabled": false,
      "initial_access_granted": true,
      "granted_by": null,
      "granted_at": null,
      "created_at": "2026-08-01T09:00:00"
    }
  ]
}
```

### GET /admin/users/{user_id}

Returns one user plus `chat_sessions_count` and `chatbots_count`.

**Response — 200**

```json
{
  "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
  "username": "admin",
  "email": "admin@gmail.com",
  "role": "admin",
  "is_active": true,
  "is_verified": true,
  "daily_message_limit": 100,
  "messages_used_today": 0,
  "stt_enabled": false,
  "tts_enabled": false,
  "initial_access_granted": true,
  "granted_by": null,
  "granted_at": null,
  "created_at": "2026-08-01T09:00:00",
  "chat_sessions_count": 3,
  "chatbots_count": 1
}
```

**Errors:** 404 — user not found.

### PATCH /admin/users/{user_id}/access

Grants/revokes initial access. Note: this updates `initial_access_granted`, not `is_active`.

**Request body** (embedded field)

| Field | Type | Required | Description |
|---|---|---|---|
| `granted` | boolean | yes | `true` to grant access |

```json
{ "granted": true }
```

**Response — 200**

```json
{ "status": "updated", "initial_access_granted": true }
```

**Errors:** 404 — user not found.

### PATCH /admin/users/{user_id}/features

Updates user feature flags and the daily message limit.

**Request body** (`FeaturesUpdate`, partial)

| Field | Type | Required | Description |
|---|---|---|---|
| `stt_enabled` | boolean | no | Speech-to-text toggle |
| `tts_enabled` | boolean | no | Text-to-speech toggle |
| `daily_message_limit` | integer | no | New daily limit |

```json
{ "stt_enabled": true, "tts_enabled": true, "daily_message_limit": 20 }
```

**Response — 200**

```json
{ "status": "updated", "stt_enabled": true, "tts_enabled": true, "daily_message_limit": 20 }
```

**Errors:** 404 — user not found.

### PATCH /admin/users/{user_id}/role

Changes a user's role.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `role` | string | yes | `admin` or `user` |

```json
{ "role": "user" }
```

**Response — 200**

```json
{ "status": "updated", "role": "user" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Invalid role value |
| 404 | User not found |

### DELETE /admin/users/{user_id}

Deletes a user and their owned stores/chatbots/sessions (cascade).

**Response — 200**

```json
{ "status": "deleted" }
```

**Errors:** 404 — user not found.

### GET /admin/users/{user_id}/chatbot-access

Lists the chatbots a user has been granted.

**Response — 200**

```json
{
  "accesses": [
    { "id": "6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d", "user_id": "f2262c94-dd93-4c93-acc7-908a9faeefac", "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "granted_at": "2026-08-11T10:40:00" }
  ]
}
```

**Errors:** 404 — user not found.

### POST /admin/users/{user_id}/chatbot-access

Grants a chatbot to a user.

**Request body** (embedded field)

| Field | Type | Required | Description |
|---|---|---|---|
| `chatbot_id` | UUID string | yes | Chatbot to grant |

```json
{ "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }
```

**Response — 200**

```json
{
  "status": "granted",
  "access": { "id": "6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d", "user_id": "f2262c94-dd93-4c93-acc7-908a9faeefac", "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "granted_at": "2026-08-11T10:40:00" }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | User or chatbot not found |
| 409 | Access already granted |

### DELETE /admin/users/{user_id}/chatbot-access/{chatbot_id}

Revokes a chatbot grant.

**Response — 200**

```json
{ "status": "revoked" }
```

**Errors:** 404 — access not found.

---

## Admin — Profile

### GET /admin/profile

Returns the calling admin's profile.

- **Auth:** admin

**Response — 200**

```json
{
  "status": "ok",
  "profile": {
    "id": "f2262c94-dd93-4c93-acc7-908a9faeefac",
    "username": "admin",
    "email": "admin@gmail.com",
    "role": "admin",
    "is_verified": true,
    "stt_enabled": false,
    "tts_enabled": false,
    "daily_message_limit": 100,
    "messages_used_today": 0,
    "created_at": "2026-08-01T09:00:00"
  }
}
```

### PUT /admin/profile

Updates username and/or email of the calling admin.

**Request body** (partial)

| Field | Type | Required | Description |
|---|---|---|---|
| `username` | string | no | Must be unique |
| `email` | string (email) | no | Must be unique |

```json
{ "username": "superadmin" }
```

**Response — 200**

```json
{ "status": "updated", "profile": { "id": "f2262c94-dd93-4c93-acc7-908a9faeefac", "username": "superadmin", "email": "admin@gmail.com", "role": "admin" } }
```

**Errors**

| Status | Condition |
|---|---|
| 409 | Username or email already taken |

### PATCH /admin/profile/password

Changes the calling admin's password. Invalidates all existing refresh tokens.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `current_password` | string | yes | Current password |
| `new_password` | string | yes | 8–128 chars, letters and numbers required |

```json
{ "current_password": "admin123", "new_password": "newadmin456" }
```

**Response — 200**

```json
{ "status": "password_updated" }
```

**Errors**

| Status | Condition |
|---|---|
| 400 | Weak new password |
| 401 | Current password incorrect |

---

## Admin — Dashboard

### GET /admin/dashboard/stats

Aggregate counts for the dashboard.

- **Auth:** no

**Response — 200**

```json
{
  "knowledge_bases": 2,
  "documents": 3,
  "loaders": 2,
  "chunks": 42,
  "chatbots": 1
}
```

---

## User — Chat

All user routes require the `user` role.

### GET /user/chatbots

Lists chatbots granted to the calling user.

**Response — 200**

```json
{
  "status": "list",
  "count": 1,
  "chatbots": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "created_by": null,
      "store_id": null,
      "name": "Support Bot",
      "description": "Answers product questions",
      "status": "active",
      "published_at": null,
      "vector_store_config": null,
      "embedding_config": null,
      "llm_config": null,
      "chain_config": null,
      "memory_config": null,
      "prompt_config": null,
      "created_date": "2026-08-11T10:20:00",
      "updated_date": "2026-08-11T10:20:00"
    }
  ]
}
```

### POST /user/sessions

Creates a session for the calling user.

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `chatbot_id` | UUID string | yes | Target chatbot |
| `title` | string | no | Defaults to `Chat with <chatbot.name>` |

```json
{ "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "title": "My first chat" }
```

**Response — 200**

```json
{
  "status": "created",
  "session": {
    "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b",
    "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "user_id": "7b9a2c4e-0f1a-4c3e-8a1b-9d2e4f6a8b0c",
    "title": "My first chat",
    "messages_count": 0,
    "chatbot_name": "Support Bot"
  }
}
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Chatbot not found |

### GET /user/sessions

Lists the calling user's sessions, most recently updated first. (Chatbot access is not checked here.)

**Response — 200**

```json
{
  "status": "list",
  "count": 1,
  "sessions": [
    { "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "chatbot_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", "title": "My first chat", "messages_count": 2, "chatbot_name": "Support Bot" }
  ]
}
```

### GET /user/sessions/{session_id}

Returns one of the user's sessions (ownership enforced).

**Errors:** 404 — session not found.

### PUT /user/sessions/{session_id}

Updates title and/or moves the session to another chatbot.

**Request body** (partial)

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | no | New title |
| `chatbot_id` | UUID string | no | New chatbot |

```json
{ "title": "Renamed session" }
```

**Response — 200**

```json
{ "status": "updated", "session": { "id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "title": "Renamed session" } }
```

**Errors**

| Status | Condition |
|---|---|
| 404 | Session or chatbot not found |

### DELETE /user/sessions/{session_id}

Deletes one of the user's sessions.

**Response — 200**

```json
{ "status": "deleted", "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b" }
```

**Errors:** 404 — session not found.

### GET /user/sessions/{session_id}/messages

Lists messages in chronological order (same shape as the admin endpoint).

**Response — 200**

```json
{
  "status": "list",
  "count": 2,
  "messages": [
    { "id": "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f", "role": "human", "content": "What is the return policy?", "created_date": "2026-08-11T10:30:01" },
    { "id": "d2e3f4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a", "role": "ai", "content": "Our return policy allows returns within 30 days.", "execution_time": 0.84, "created_date": "2026-08-11T10:30:04" }
  ]
}
```

### POST /user/chatbots/{chatbot_id}/sessions/{session_id}/chat

Sends a message as the user. Checks chatbot access and the daily message limit, then runs the same pipeline as the admin chat endpoint. Increments `messages_used_today`.

- **Auth:** user

**Request body**

| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string | yes | User message |

```json
{ "message": "What is the return policy?" }
```

**Response — 200**

```json
{
  "status": "ok",
  "user_message": { "id": "c1d2e3f4-5a6b-4c7d-8e9f-0a1b2c3d4e5f", "session_id": "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b", "role": "human", "content": "What is the return policy?", "created_date": "2026-08-11T10:30:01" },
  "ai_message": { "id": "d2e3f4a5-6b7c-4d8e-9f0a-1b2c3d4e5f6a", "role": "ai", "content": "Our return policy allows returns within 30 days.", "source_documents": [ { "page_content": "...", "metadata": {} } ], "execution_time": 0.84, "created_date": "2026-08-11T10:30:04" }
}
```

**Errors**

| Status | Condition |
|---|---|
| 403 | User has no access grant to this chatbot |
| 404 | Session not found, or chatbot not found |
| 429 | Daily message limit exceeded (see [Rate Limiting](#rate-limiting)) |
| 500 | Chain build or invocation failure; DB changes rolled back |

---

## User — Profile

### GET /user/profile

Returns the calling user's profile (same shape as the admin profile).

### PUT /user/profile

Updates username and/or email (same validation and 409 conflicts as the admin endpoint).

### PATCH /user/profile/password

Changes the calling user's password (same rules as the admin endpoint: 400 weak password, 401 wrong current password).

---

## Data Models / Schemas

### Database entities

| Entity | Table | Key fields |
|---|---|---|
| `User` | `user` | `id` (UUID PK), `username` (unique), `email` (unique), `password_hash` (bcrypt), `role` (`admin`/`user`), `is_active`, `is_verified`, `refresh_token_hash`, `reset_password_token` + `reset_password_expires_at`, `last_login_at`, `daily_message_limit` (default 100), `messages_used_today`, `limit_reset_date`, `stt_enabled`, `tts_enabled`, `initial_access_granted`, `granted_by`, `granted_at`, `created_at`, `updated_at` |
| `UserAccess` | `user_access` | `id`, `user_id` (FK, cascade), `chatbot_id` (FK, cascade), `granted_at`; unique on `(user_id, chatbot_id)` |
| `DocumentStore` | `document_store` | `id`, `created_by` (FK, SET NULL), `name`, `description`, `status` (`active`/`processing`/`error`/`inactive`/`ready`), `upsert_config_snapshot` (JSON), `vector_store_config` (JSON), `embedding_config` (JSON), `record_manager_config` (JSON), `created_date`, `updated_date` |
| `UploadedDocument` | `uploaded_document` | `id`, `store_id` (FK, cascade), `file_name`, `file_path`, `file_type`, `file_size_mb` (float), `status` (`uploaded`/`processing`/`ready`/`error`), `created_date`, `updated_date` |
| `DocumentLoader` | `document_loader` | `id`, `store_id`, `doc_id` (FK, SET NULL), `name`, `loader_type`, `loader_config` (JSON), `file_path`, `status` (`pending`/`processing`/`completed`/`error`), `created_date`, `updated_date` |
| `DocumentSplitter` | `document_splitter` | `id`, `loader_id` (FK, cascade, unique), `splitter_type`, `chunk_size` (default 1000), `chunk_overlap` (default 200), `extra_config` (JSON), timestamps |
| `DocumentChunk` | `document_chunk` | `id`, `store_id`, `doc_id` (FK, cascade), `page_content` (text), `meta_data` (JSON), `chunk_no` (int), `status` (`pending`/`embedded`/`error`), timestamps |
| `Chatbot` | `chatbot` | `id`, `created_by`, `store_id` (FK, SET NULL), `name`, `description`, `status` (`active`/`inactive`), `published_at`, `vector_store_config` (JSON), `embedding_config` (JSON), `llm_config` (JSON), `chain_config` (JSON), `memory_config` (JSON), `prompt_config` (JSON), timestamps |
| `ChatSession` | `chat_session` | `id`, `chatbot_id` (FK, cascade), `user_id` (FK, cascade), `title`, timestamps |
| `ChatMessage` | `chat_message` | `id`, `session_id` (FK, cascade), `user_id` (FK, SET NULL), `role` (`human`/`ai`/`system`), `content` (text), `source_documents` (JSON), `execution_time` (float), `created_date` |

### Request DTOs

| DTO | Used by | Fields (required *) |
|---|---|---|
| `RegisterRequest` | `POST /auth/register` | `username*`, `email*`, `password*` |
| `LoginRequest` | `POST /auth/login` | `email*`, `password*` |
| `ForgotPasswordRequest` | `POST /auth/forgot-password` | `email*` |
| `ResetPasswordRequest` | `POST /auth/reset-password` | `token*`, `new_password*` |
| `LoadDocumentRequest` | `ingest_document`, `kb_Process/load_document` | `loader_name*`, `chunker_name*`, `loader_config*` (dict), `chunker_config*` (dict), `doc_id*` |
| `UpsertionConfig` | KB config POST/PUT | `embedder_name*`, `vector_store_name*`, `record_manager_name*`, plus three `*_config` dicts* |
| `UpdateChunkRequest` | chunk PUT/POST | `content*`, `meta_data*` |
| `CreateChatbotRequest` | `POST /admin/chatbots` | `name*`; optional `description`, `store_id`, `status`, `llm_config`, `chain_config`, `memory_config`, `prompt_config` |
| `UpdateChatbotRequest` | `PUT /admin/chatbots/{id}` | all optional; no `store_id` |
| `CreateSessionRequest` (admin) | admin sessions | `title?` |
| `CreateSessionRequest` (user) | `POST /user/sessions` | `chatbot_id*`, `title?` |
| `UpdateSessionRequest` (user) | `PUT /user/sessions/{id}` | `title?`, `chatbot_id?` |
| `ChatRequest` | both chat endpoints | `message*` |
| `UserListItem` | `GET /admin/users` | see response example above |
| `UserDetailItem` | `GET /admin/users/{id}` | `UserListItem` + `chat_sessions_count`, `chatbots_count` |
| `FeaturesUpdate` | `PATCH .../features` | `stt_enabled?`, `tts_enabled?`, `daily_message_limit?` |
| `RoleUpdate` | `PATCH .../role` | `role*` |
| `UpdateProfileRequest` | profile PUT endpoints | `username?`, `email?` |
| `ChangePasswordRequest` | profile password endpoints | `current_password*`, `new_password*` |

### Component registry

`BaseComponent` declares `category`, `name`, `icon`, and `inputs` (`InputParam`: `name`, `type`, `default`, `required`, `description`). Registered components: `PyPDFLoader`, `WebBaseLoader`, `RecursiveCharacterTextSplitter`, `OllamaEmbedding`, `ChromaVectorStore`, `ChatOllama`, `LangChainRecordManager`, `ConversationalRetrievalChain`.

## Status Codes

| Code | Meaning | Used by |
|---|---|---|
| 200 | Success (all endpoints return 200, including mutations) | All |
| 400 | Validation error / bad request | Auth strength & reset token, store status filter, KB config upsert, empty chunk update, invalid role |
| 401 | Missing/invalid/expired token, wrong credentials, wrong current password | Auth, all protected routes |
| 403 | Role not permitted or account disabled | Admin/user guards, disabled accounts, user chatbot access |
| 404 | Resource not found | Stores, documents, chunks, chatbots, sessions, users, components |
| 409 | Conflict — duplicate username/email, duplicate chatbot access | Register, profile updates, grant access |
| 422 | Pydantic request validation failure | Any endpoint with a body model |
| 429 | Daily message limit exceeded | User chat endpoint |
| 500 | Pipeline / server error | Ingestion, upsert, chat pipeline |

## Rate Limiting

Per-user daily message limit, enforced only on `POST /user/chatbots/{chatbot_id}/sessions/{session_id}/chat`:

- Limit value: `User.daily_message_limit` (default 100), editable by admins via `PATCH /admin/users/{user_id}/features`.
- Counter: `User.messages_used_today`, incremented on each successful user message; reset automatically when `limit_reset_date` is from a previous day.
- Exceeded: HTTP 429 with `{ "detail": "Daily message limit (<limit>) exceeded. Please try again later." }`.

No rate limiting exists on auth or admin endpoints.

