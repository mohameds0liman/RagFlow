# RAGFlow — Agent Instructions

## STRICT BOUNDARY RULE

You operate ONLY inside the `Frontend/` directory.

NEVER read, edit, create, or delete any file outside of `Frontend/`.
NEVER touch `backend/`, `run.py`, `requirements.txt`, or any Python file.
NEVER modify backend routes, models, schemas, DB config, JWT config, or CORS config.
If a task requires a backend change to work, STOP and tell the user instead of making the change.
When in doubt about whether a file belongs to the frontend: ASK, do not touch.

---

## Project Structure

```
ragflow_frontend_prd.md    # Full frontend spec — read this before doing anything
run.py                     # Backend entrypoint — DO NOT TOUCH
backend/                   # Backend — DO NOT TOUCH
  app/
    main.py                # FastAPI app, CORS, static mount, router includes
    bootstrap.py           # Startup: registers all RAG components in registry
    db/
      session.py           # SQLAlchemy engine — DB URL is HARDCODED here
      models.py            # ORM models; creates tables via create_all()
    api/
      auth.py              # JWT secret/key/expiry are HARDCODED here
      Admin/               # admin.py, chatbot.py, chat.py, users.py
      User/                # chat.py & profile.py are EMPTY PLACEHOLDERS
    core/factory.py        # PipelineFactory: loader, upsert, chat pipelines
    components/            # RAG component implementations (LangChain-based)
Frontend/                  # YOUR ONLY WORKING DIRECTORY
  src/
    api/
      axiosInstance.js     # Base axios + JWT interceptors — import this everywhere
      authApi.js
      knowledgeBaseApi.js
      chatbotApi.js
      chatApi.js
      usersApi.js
    store/
      index.js
      slices/
        authSlice.js
        kbSlice.js
        chatbotSlice.js
        usersSlice.js
    routes/
      AdminRoutes.jsx
      UserRoutes.jsx
    layouts/
      AdminLayout.jsx
      UserLayout.jsx
    views/
      auth/
        Login.jsx
        ForgotPassword.jsx
      admin/
        Dashboard.jsx
        DocumentStores/
          DocumentStoreList.jsx
          DocumentStoreDetail.jsx
          UpsertionConfigDialog.jsx
          UploadDocumentDialog.jsx
          ChunksViewDialog.jsx
          IngestStatusDialog.jsx
        Chatbots/
          ChatbotList.jsx
          ChatbotEditor.jsx
        Chat/
          AdminChat.jsx
        Users/
          UserList.jsx
          UserAccessDrawer.jsx
      user/
        UserChat.jsx
    components/
      MainCard.jsx
      StyledDataGrid.jsx
      ConfirmDialog.jsx
      StatusChip.jsx
      ChatWindow.jsx
    theme/
      index.js
```

---

## Bootstrap Command (run once — Frontend/ is empty)

```bash
cd Frontend && npm create vite@latest . -- --template react && npm install \
  @mui/material @mui/icons-material @mui/x-data-grid \
  @emotion/react @emotion/styled \
  @tabler/icons-react \
  @reduxjs/toolkit react-redux \
  react-router-dom \
  axios \
  formik yup \
  notistack \
  @microsoft/fetch-event-source \
  react-markdown
```

---

## Backend Config (read-only reference — never modify)

| Item | Location | Value |
|---|---|---|
| DB URL | `backend/app/db/session.py` | `postgresql://postgres:2463@localhost:5432/ragflow` |
| JWT config | `backend/app/api/auth.py` | hardcoded secret / algorithm / expiry |
| CORS origin | `backend/app/main.py` | `http://localhost:8000` |
| Static mount | `backend/app/main.py` | points to `Frontend/` |
| API base URL | frontend `.env` | `VITE_API_URL=http://127.0.0.1:8000` |

Run backend: `python run.py` → uvicorn on `127.0.0.1:8000`  
Prerequisites: PostgreSQL on `localhost:5432` db `ragflow`, Ollama on `localhost:11434`

---

## Backend Gotchas (read-only — for context only)

- No Alembic — uses `Base.metadata.create_all()` directly
- User API endpoints (`User/chat.py`, `User/profile.py`) are stubs — not yet implemented
- All RAG components auto-register at startup via `bootstrap.py` + `ComponentRegistry`
- Auth uses `bcrypt` directly — `passlib[bcrypt]` is in requirements

---

## Frontend Rules (strictly enforced)

### API Layer
- Every API call MUST import `api` from `src/api/axiosInstance.js` — never import raw `axios`
- JWT token is attached automatically by the request interceptor — never attach it manually
- On 401 the interceptor auto-refreshes via `POST /auth/refresh` — never handle 401 manually
- File uploads MUST use `FormData` with header `Content-Type: multipart/form-data`
- Always extract error messages from `err.response?.data?.detail` (FastAPI default format)

### State Management
- All async data fetching MUST use `createAsyncThunk` — no raw API calls inside components
- Loading and error state live in Redux slices — no local `useState` for server data
- Component local `useState` is only for UI state (dialog open/close, input value, etc.)

### Error Handling
- Every API call MUST be wrapped in `try/catch`
- Errors display via `enqueueSnackbar(msg, { variant: 'error' })` from `notistack`
- Destructive actions (delete, deactivate) MUST show `ConfirmDialog` before proceeding

### Routing & Auth
- Admin pages MUST be wrapped in `AdminRoutes.jsx` — checks `role === 'admin'`
- User pages MUST be wrapped in `UserRoutes.jsx` — checks `role === 'user'`
- On login: store `access_token`, `refresh_token`, `role` in `localStorage` and Redux
- On logout or refresh failure: clear `localStorage`, clear Redux, redirect to `/login`

### Design System
- Theme is Flowise-identical dark — defined once in `src/theme/index.js`, never override inline
- All page content MUST use `MainCard` as the wrapper component
- Destructive confirm MUST use `ConfirmDialog` — never use `window.confirm()`
- Status indicators MUST use `StatusChip` — never raw MUI Chip with inline color

| Token | Value |
|---|---|
| Background | `#1A1F2E` |
| Sidebar | `#171C2B` |
| Card | `#1E2330` |
| Surface | `#232839` |
| Primary | `#4B72FF` |
| Primary hover | `#3A5EE0` |
| Text primary | `#E0E0E0` |
| Text secondary | `#9099B0` |
| Border | `#2D3448` |
| Danger | `#E74C3C` |
| Success | `#27AE60` |
| Warning | `#F39C12` |

- Font: `Inter`, fallback `Roboto`
- Sidebar width: `260px`
- Topbar height: `64px`
- Card border-radius: `12px`
- Active sidebar item: `border-left: 4px solid #4B72FF`, `background: rgba(75,114,255,0.12)`

### Streaming (chat)
- Streaming is OFF by default — controlled by `VITE_STREAMING_ENABLED=false` in `.env`
- The `sendMessage` function in `chatApi.js` MUST support both modes via the flag
- When `false`: use standard `api.post()`
- When `true`: use `fetchEventSource` from `@microsoft/fetch-event-source`
- Never hard-code the streaming mode — always read from `import.meta.env.VITE_STREAMING_ENABLED`

---

## Key API Endpoints Reference

### Auth
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Login → `{ access_token, refresh_token, role }` |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |

### Knowledge Bases
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/knowledge-bases` | List all KBs |
| POST | `/admin/knowledge-bases` | Create KB |
| PUT | `/admin/knowledge_bases/:id` | Update KB |
| DELETE | `/admin/knowledge_bases/:id` | Delete KB |
| GET | `/admin/knowledge_bases/:id/status` | KB status |
| POST | `/admin/knowledge_bases/:id/config` | Create upsertion config |
| PUT | `/admin/knowledge_bases/:id/config` | Update upsertion config |
| POST | `/admin/knowledge_bases/:id/upload` | Upload document (FormData) |
| GET | `/admin/knowledge_bases/:id/documents` | List documents |
| DELETE | `/admin/knowledge_bases/:id/documents/:doc_id` | Delete document |
| POST | `/admin/kb_Process/load_document` | Ingest doc (extract + chunk) |
| GET | `/admin/knowledge_bases/:id/chunks` | List chunks |
| GET | `/admin/knowledge_bases/:id/chunks/:chunk_id` | Get chunk |
| PUT | `/admin/knowledge_bases/:id/chunks/:chunk_id` | Edit chunk |
| DELETE | `/admin/knowledge_bases/:id/chunks/:chunk_id` | Delete chunk |
| POST | `/admin/knowledge_bases/:id/upsert` | Trigger upsert to vector store |

### Components (for dynamic config forms)
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/components/categories` | Category list for dropdowns |
| GET | `/admin/components` | All components |
| GET | `/admin/components/:name/schema` | Dynamic form schema |

### Chatbots
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/chatbots` | List chatbots |
| POST | `/admin/chatbots` | Create chatbot |
| GET | `/admin/chatbots/:id` | Get chatbot |
| PUT | `/admin/chatbots/:id` | Update chatbot |
| DELETE | `/admin/chatbots/:id` | Delete chatbot |

### Chat (Admin)
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/admin/chatbots/:id/sessions` | Create session |
| GET | `/admin/chatbots/:id/sessions` | List sessions |
| DELETE | `/admin/chatbots/:id/sessions/:session_id` | Delete session |
| GET | `/admin/chatbots/:id/sessions/:session_id/messages` | Load history |
| POST | `/admin/chatbots/:id/sessions/:session_id/chat` | Send message |

### Users
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/users` | List users |
| GET | `/admin/users/:id` | Get user |
| DELETE | `/admin/users/:id` | Delete user |
| PATCH | `/admin/users/:id/access` | Toggle active |
| PATCH | `/admin/users/:id/features` | Set TTS/STT/image_gen/rate_limit |
| PATCH | `/admin/users/:id/role` | Change role |
| GET | `/admin/users/:id/chatbot-access` | List chatbot access |
| POST | `/admin/users/:id/chatbot-access` | Grant chatbot access |
| DELETE | `/admin/users/:id/chatbot-access/:chatbot_id` | Revoke chatbot access |

### Dashboard
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/dashboard/stats` | Stats for dashboard cards |
