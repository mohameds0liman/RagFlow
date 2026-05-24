# RAGFlow — Frontend PRD

## Summary

RAGFlow is an internal RAG platform for company documents. It has two roles: **Admin** and **User**. The Admin builds and manages the knowledge pipeline (document stores → chatbots → users). The User only chats with assigned chatbots. The UI is a pixel-close clone of Flowise's design language: dark sidebar, MUI v5 card-based layout, same color palette and typography. No flow builder. No drag-and-drop. Pure RAG pipeline management UI.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| UI Library | MUI v5 (`@mui/material`) |
| Icons | `@mui/icons-material` + `@tabler/icons-react` |
| State | Redux Toolkit (`@reduxjs/toolkit` + `react-redux`) |
| Routing | `react-router-dom` v6 |
| HTTP | `axios` |
| Streaming | `@microsoft/fetch-event-source` (ready, inactive) |
| Forms | `formik` + `yup` |
| Notifications | MUI Snackbar + `notistack` |

---

## Design System (Flowise-Identical)

```
Background (main):     #1A1F2E  (dark navy)
Sidebar background:    #171C2B
Card background:       #1E2330
Surface/paper:         #232839
Primary accent:        #4B72FF  (blue)
Primary hover:         #3A5EE0
Text primary:          #E0E0E0
Text secondary:        #9099B0
Border/divider:        #2D3448
Danger:                #E74C3C
Success:               #27AE60
Warning:               #F39C12
```

Font: `Inter`, fallback `Roboto`. Sidebar width: `260px`. Header height: `64px`.

---

## Project Structure
backend

```
Rag_Flow/
├── .env
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── requirements.txt
├── run.py
├── ragflow_frontend_prd.md
│
├── backend/
│   ├── __init__.py
│   └── app/
│       ├── __init__.py
│       ├── main.py
│       ├── bootstrap.py
│       ├── api/
│       │   ├── auth.py
│       │   ├── Admin/
│       │   │   ├── admin.py
│       │   │   ├── chat.py
│       │   │   ├── chatbot.py
│       │   │   └── users.py
│       │   └── User/
│       │       ├── chat.py
│       │       └── profile.py
│       ├── components/
│       │   ├── base.py
│       │   ├── registry.py
│       │   ├── chain/
│       │   │   ├── ConversationalRetrievalChain/
│       │   │   ├── ConversationChain/
│       │   │   └── RetrievalQAChain/
│       │   ├── Chatmodels/
│       │   │   ├── ChatGroq/
│       │   │   ├── ChatOllama/
│       │   │   ├── ChatOpenAI/
│       │   │   └── ChatOpenRouter/
│       │   ├── chunker/
│       │   │   ├── Recursive/
│       │   │   └── Semantic/
│       │   ├── documentloaders/
│       │   │   ├── Pdf/
│       │   │   └── Web/
│       │   ├── embedder/
│       │   │   ├── OllamaEmbedding/
│       │   │   └── OpenAIEmbedding/
│       │   ├── memory/
│       │   │   ├── BufferMemory/
│       │   │   ├── BufferWindowMemory/
│       │   │   ├── ConversationSummaryBufferMemory/
│       │   │   └── ConversationSummaryMemory/
│       │   ├── record_manager/
│       │   │   └── langchainrecordmanager/
│       │   ├── vectorstores/
│       │   │   ├── Chroma/
│       │   │   ├── Faiss/
│       │   │   ├── Pinecone/
│       │   │   ├── Qdrant/
│       │   │   └── Supabase/
│       │   └── icons/
│       ├── core/
│       │   └── factory.py
│       └── db/
│           ├── models.py
│           ├── session.py
│           └── ragflow_database_schema.html
│
├── Frontend/
│   ├── index.html
│   └── load_document.html
│
├── Stages/
│   ├── Backend/
│   │   ├── 1_Init.md → 14_front_admin.md (14 stage docs)
│   └── Frontend/
│       ├── Demo/
│       │   ├── admin.html
│       │   └── login.html
│       └── stages/
│
├── chroma_db/         (vector store data)
├── uploads/           (uploaded files)
├── env/               (Python virtual env)
└── .vscode/
    └── settings.json
```
Frontend
```
src/
├── api/
│   ├── axiosInstance.js        # base axios config, interceptors
│   ├── authApi.js
│   ├── knowledgeBaseApi.js
│   ├── chatbotApi.js
│   ├── chatApi.js
│   └── usersApi.js
├── store/
│   ├── index.js
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── kbSlice.js
│   │   ├── chatbotSlice.js
│   │   └── usersSlice.js
├── routes/
│   ├── AdminRoutes.jsx
│   └── UserRoutes.jsx
├── layouts/
│   ├── AdminLayout.jsx         # sidebar + topbar
│   └── UserLayout.jsx
├── views/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── ForgotPassword.jsx
│   ├── admin/
│   │   ├── Dashboard.jsx
│   │   ├── DocumentStores/
│   │   │   ├── DocumentStoreList.jsx
│   │   │   ├── DocumentStoreDetail.jsx
│   │   │   ├── UpsertionConfigDialog.jsx
│   │   │   ├── UploadDocumentDialog.jsx
│   │   │   ├── ChunksViewDialog.jsx
│   │   │   └── IngestStatusDialog.jsx
│   │   ├── Chatbots/
│   │   │   ├── ChatbotList.jsx
│   │   │   └── ChatbotEditor.jsx
│   │   ├── Chat/
│   │   │   └── AdminChat.jsx
│   │   └── Users/
│   │       ├── UserList.jsx
│   │       └── UserAccessDrawer.jsx
│   └── user/
│       └── UserChat.jsx
├── components/
│   ├── MainCard.jsx            # Flowise card wrapper
│   ├── StyledDataGrid.jsx
│   ├── ConfirmDialog.jsx
│   ├── StatusChip.jsx
│   └── ChatWindow.jsx          # shared chat UI
└── theme/
    └── index.js                # MUI theme override
```

---

## API Communication Layer

### 1. Axios Instance (`src/api/axiosInstance.js`)

This is the most critical file. All API calls go through here. Never use raw `fetch` anywhere except streaming.

```js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// REQUEST INTERCEPTOR — attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// RESPONSE INTERCEPTOR — auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post('/auth/refresh', { refresh_token: refresh })
        localStorage.setItem('access_token', data.access_token)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
```

**Rules for the AI when generating API calls:**
- Always import `api` from `axiosInstance.js`, never import raw `axios`
- Always wrap in `try/catch`, extract error message from `error.response?.data?.detail`
- File uploads must use `Content-Type: multipart/form-data` via `FormData`
- Never put tokens in query params

### 2. Auth API (`src/api/authApi.js`)

```
POST /auth/login          → { username, password } → { access_token, refresh_token, role }
POST /auth/logout         → {} (send access_token in header)
POST /auth/forgot-password → { email }
POST /auth/reset-password  → { token, new_password }
```

On login success: store `access_token`, `refresh_token`, `role` in `localStorage`. Redirect admin → `/admin/dashboard`, user → `/chat`.

### 3. Knowledge Base API (`src/api/knowledgeBaseApi.js`)

```
GET    /admin/knowledge-bases                              → list all KBs
POST   /admin/knowledge-bases                             → { name, description } → create KB
PUT    /admin/knowledge_bases/:id                         → { name, description } → update KB
DELETE /admin/knowledge_bases/:id                         → delete KB
GET    /admin/knowledge_bases/:id/status                  → { status, doc_count, chunk_count }

POST   /admin/knowledge_bases/:id/config                  → { splitter, embedder, vector_store, ... } → create upsertion config
PUT    /admin/knowledge_bases/:id/config                  → same body → update upsertion config

POST   /admin/knowledge_bases/:id/upload                  → FormData { file } → upload doc
GET    /admin/knowledge_bases/:id/documents               → list uploaded docs
DELETE /admin/knowledge_bases/:id/documents/:doc_id       → delete doc

POST   /admin/kb_Process/load_document                    → { knowledge_base_id, doc_id } → ingest (extract+chunk)
POST   /admin/knowledge_bases/:id/ingest_document         → same effect, alternate endpoint

GET    /admin/knowledge_bases/:id/chunks                  → list all chunks
GET    /admin/knowledge_bases/:id/chunks/:chunk_id        → get single chunk
PUT    /admin/knowledge_bases/:id/chunks/:chunk_id        → { content, metadata } → edit chunk
DELETE /admin/knowledge_bases/:id/chunks/:chunk_id        → delete chunk
POST   /admin/knowledge_bases/:id/chunks                  → { content, metadata } → add manual chunk

POST   /admin/knowledge_bases/:id/upsert                  → trigger full upsert to vector store

GET    /admin/components/categories                       → for upsertion config dropdowns
GET    /admin/components                                  → for upsertion config dropdowns
GET    /admin/components/:name/schema                     → for dynamic form rendering in config dialog
```

**File upload pattern:**
```js
const formData = new FormData()
formData.append('file', file)
await api.post(`/admin/knowledge_bases/${kbId}/upload`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### 4. Chatbot API (`src/api/chatbotApi.js`)

```
GET    /admin/chatbots              → list chatbots
POST   /admin/chatbots              → { name, description, kb_id, llm_config, instructions, tools, chain_type }
GET    /admin/chatbots/:id          → get chatbot
PUT    /admin/chatbots/:id          → update chatbot
DELETE /admin/chatbots/:id          → delete chatbot
```

### 5. Chat API (`src/api/chatApi.js`)

```
POST   /admin/chatbots/:chatbot_id/sessions                          → { title? } → create session
GET    /admin/chatbots/:chatbot_id/sessions                          → list sessions
GET    /admin/chatbots/:chatbot_id/sessions/:session_id              → get session
DELETE /admin/chatbots/:chatbot_id/sessions/:session_id              → delete session
GET    /admin/chatbots/:chatbot_id/sessions/:session_id/messages     → load history
POST   /admin/chatbots/:chatbot_id/sessions/:session_id/chat         → { message } → send message → { reply }
```

**Streaming flag pattern (for when backend supports SSE):**
```js
// STREAMING_ENABLED = false until backend is ready
// When true, replace the POST /chat call with fetchEventSource

import { fetchEventSource } from '@microsoft/fetch-event-source'

const STREAMING_ENABLED = false  // flip to true when backend ready

export const sendMessage = async (chatbotId, sessionId, message, onChunk) => {
  if (!STREAMING_ENABLED) {
    const { data } = await api.post(
      `/admin/chatbots/${chatbotId}/sessions/${sessionId}/chat`,
      { message }
    )
    onChunk(data.reply)  // treat full response same as final chunk
    return
  }

  // SSE path — activated later
  await fetchEventSource(
    `${BASE_URL}/admin/chatbots/${chatbotId}/sessions/${sessionId}/chat`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      onmessage(event) { onChunk(event.data) },
    }
  )
}
```

### 6. Users API (`src/api/usersApi.js`)

```
GET    /admin/users                           → list users
GET    /admin/users/:id                       → get user
DELETE /admin/users/:id                       → delete user
PATCH  /admin/users/:id/access                → { is_active: bool }
PATCH  /admin/users/:id/features              → { tts: bool, stt: bool, image_gen: bool, rate_limit: int }
PATCH  /admin/users/:id/role                  → { role: 'admin'|'user' }
GET    /admin/users/:id/chatbot-access        → list chatbot access
POST   /admin/users/:id/chatbot-access        → { chatbot_id }
DELETE /admin/users/:id/chatbot-access/:chatbot_id
```

### 7. Dashboard API

```
GET /admin/dashboard/stats → { total_users, total_kbs, total_chatbots, total_messages, active_users, ... }
```

---

## Redux Store

```
store/
  authSlice     → { user, role, isAuthenticated }
  kbSlice       → { kbs[], selectedKb, documents[], chunks[] }
  chatbotSlice  → { chatbots[], selectedChatbot }
  usersSlice    → { users[], selectedUser }
```

Async actions use `createAsyncThunk`. Loading/error state per slice. Never put raw API calls in components — always dispatch thunks.

---

## Routing

```
/login                          → Login.jsx (public)
/forgot-password                → ForgotPassword.jsx (public)

/admin/dashboard                → Dashboard.jsx
/admin/document-stores          → DocumentStoreList.jsx
/admin/document-stores/:id      → DocumentStoreDetail.jsx
/admin/chatbots                 → ChatbotList.jsx
/admin/chatbots/:id             → ChatbotEditor.jsx
/admin/chat                     → AdminChat.jsx
/admin/users                    → UserList.jsx

/chat                           → UserChat.jsx (user role only)
```

Route guards: `AdminRoutes.jsx` checks `role === 'admin'` from Redux, else redirect `/login`. `UserRoutes.jsx` checks `role === 'user'`.

---

## Views — Admin

### Admin Layout

Flowise-identical sidebar layout:
- Left: fixed `260px` dark sidebar with logo top, nav items, profile+logout bottom
- Top: `64px` topbar with page title and breadcrumb
- Content: scrollable main area

Sidebar nav items (with Tabler icons):
- Dashboard → `IconLayoutDashboard`
- Document Stores → `IconDatabase`
- Chatbots → `IconRobot`
- Chat → `IconMessageCircle`
- Users → `IconUsers`
- Settings → `IconSettings` (bottom section)

Active item: left border `4px solid #4B72FF`, background `rgba(75,114,255,0.12)`.

---

### Dashboard

Cards row (4): Total KBs, Total Chatbots, Total Users, Total Messages. Each card: icon + number + label. Same style as Flowise stats cards. Below: recent activity table (last 10 chat sessions).

API: `GET /admin/dashboard/stats`

---

### Document Stores

**DocumentStoreList:**
- Page header: "Document Stores" + `+ Add Document Store` button (top right)
- Grid of cards (3 per row). Each card: name, description, doc count, chunk count, status chip, three-dot menu (Edit, Delete).
- Add/Edit: MUI Dialog with name + description fields.

**DocumentStoreDetail (click into a card):**
- Breadcrumb: Document Stores > {name}
- Top right: two buttons: `Upsertion Config` + `Upload Document`
- Documents table: columns — filename, size, status, uploaded_at, Actions (⋮)
- ⋮ menu per document: Load Document, View & Edit Chunks, Delete

**UpsertionConfigDialog:**
- Triggered by `Upsertion Config` button
- Calls `GET /admin/components/categories` + `GET /admin/components` to populate dropdowns (splitter type, embedder, vector store)
- Calls `GET /admin/components/:name/schema` on selection change to render dynamic form fields
- Save: `POST /kb/:id/config` if first time, `PUT /kb/:id/config` if exists
- One-time setup indicator: show green chip "Configured" if config exists

**UploadDocumentDialog:**
- MUI Dialog with drag-and-drop file zone (MUI `Box` styled, no external lib)
- Supported formats shown as chips: PDF, DOCX, TXT, CSV, MD
- On confirm: `POST /kb/:id/upload` with FormData
- Show upload progress via axios `onUploadProgress`

**"Load Document" action:**
- Calls `POST /admin/kb_Process/load_document` with `{ knowledge_base_id, doc_id }`
- Show inline loading spinner on the row
- On success: status chip changes to "Loaded"
- On error: show snackbar with `error.response.data.detail`

**ChunksViewDialog:**
- Full-width MUI Dialog (maxWidth `lg`)
- Table: chunk_id, preview (first 120 chars), metadata, actions (Edit, Delete)
- Edit chunk: inline expansion or nested dialog with textarea
- Calls: `GET /kb/:id/chunks`, `PUT /kb/:id/chunks/:chunk_id`, `DELETE /kb/:id/chunks/:chunk_id`
- Pagination: 20 chunks per page

---

### Chatbots

**ChatbotList:**
- Same card grid as Document Stores
- Each card: name, description, linked KB name, LLM model badge, three-dot (Edit, Delete, Open Chat)
- `+ Create Chatbot` button

**ChatbotEditor (create / edit):**
- Full page (not dialog) — too many fields
- Left panel (60%): form fields
  - Name, Description (text fields)
  - Chain Type (Select: RAG, Conversational, QA)
  - LLM Config: provider select → model select → temperature slider → max_tokens input
  - Knowledge Base: Select from available KBs (GET /admin/knowledge-bases)
  - System Instructions: multiline textarea (tall, monospace font)
  - Tools: multi-select checkboxes (web search, calculator, etc.) — from `GET /admin/components`
- Right panel (40%): live mini chat preview (calls same chat API)
- Save: `POST /admin/chatbots` or `PUT /admin/chatbots/:id`

---

### Chat (Admin Live Test)

**AdminChat:**
- Left: list of chatbots (sidebar within page). Click to select.
- Right: full chat window
- On chatbot select: `POST /sessions` to create new session, `GET /sessions/:id/messages` to load history
- Input bar: text input + send button
- Each send: `POST /sessions/:id/chat` → append reply to message list
- Top bar of chat: chatbot name + "Edit Instructions" button → opens inline textarea overlay (updates chatbot instructions live via `PUT /admin/chatbots/:id`)
- Session history: dropdown to switch between past sessions for the selected chatbot

**ChatWindow component (shared):**
```
Props: messages[], onSend(text), loading, chatbotName
Message bubble: user = right-aligned blue, assistant = left-aligned dark card
Supports markdown rendering in assistant messages (react-markdown)
Auto-scroll to bottom on new message
```

---

### Users

**UserList:**
- MUI DataGrid table: username, email, role, status (Active/Inactive chip), rate_limit, joined_at, Actions
- Actions column: Edit Access (drawer), Delete (confirm dialog)
- Filter bar: search by email, filter by role, filter by status

**UserAccessDrawer (right-side MUI Drawer, 420px):**
- Header: user email + role badge
- Section 1 — Account: Active toggle (`PATCH /users/:id/access`), Role select (`PATCH /users/:id/role`)
- Section 2 — Features: TTS toggle, STT toggle, Image Gen toggle, Daily Rate Limit number input → `PATCH /users/:id/features`
- Section 3 — Chatbot Access: list of chatbots with add/remove. Current access shown as chips. `+ Add` opens select. Remove = X on chip. Calls `POST/DELETE /users/:id/chatbot-access`
- Each section saves independently with its own Save button + loading state

---

## Views — User

### User Layout

Minimal. No sidebar. Top nav: logo left, logout right.

### UserChat

- On load: `GET /user/chatbots` (user-side endpoint, to be provided) → list assigned chatbots
- Left panel: list of assigned chatbots with name + description. Click to open chat.
- Right panel: `ChatWindow` component
- Session auto-created on first message if none exists
- Rate limit: if backend returns 429, show "Daily message limit reached" banner
- No settings, no config access

---

## Auth Flow

```
1. User hits /login → submits credentials
2. POST /auth/login → receive { access_token, refresh_token, role }
3. Store both tokens in localStorage
4. Store { role, user } in Redux authSlice
5. Redirect by role
6. On every request: interceptor attaches Bearer token
7. On 401: interceptor calls POST /auth/refresh automatically
8. On refresh fail: clear storage, redirect /login
9. Logout: POST /auth/logout → clear storage → redirect /login
```

---

## Error Handling Convention

Applied uniformly across all components:

```js
try {
  const { data } = await api.get('/admin/knowledge-bases')
  dispatch(setKbs(data))
} catch (err) {
  const msg = err.response?.data?.detail || 'Something went wrong'
  enqueueSnackbar(msg, { variant: 'error' })
}
```

Loading states: per-action boolean in Redux slice, not global. Show MUI `CircularProgress` inline, not full-page spinners (except initial app load).

---

## Key Component Specs

### MainCard

```jsx
// Wraps all page-level content cards
// Props: title, secondary (action button slot), children
// Style: background #1E2330, border 1px solid #2D3448, border-radius 12px, padding 20px
```

### ConfirmDialog

```jsx
// Used before every destructive action (delete KB, delete user, delete chunk)
// Props: open, title, message, onConfirm, onCancel, loading
// Confirm button: red (#E74C3C), disabled while loading
```

### StatusChip

```jsx
// Props: status ('active'|'inactive'|'loaded'|'pending'|'error')
// Color map: active=green, inactive=gray, loaded=blue, pending=orange, error=red
```

---

## Environment Variables

```
VITE_API_URL=http://127.0.0.1:8000
VITE_STREAMING_ENABLED=false
```

---

