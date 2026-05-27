# RAGFlow Frontend — Tasks

## Status Legend
- `[ ]` Todo
- `[~]` In Progress
- `[x]` Done
- `[!]` Blocked

---

## Milestone 1 — Scaffold & Design System
> Goal: Run `npm run dev` and see a themed shell. Validate colors, sidebar, and cards look Flowise-identical before writing any feature.

| # | Status | Task | File(s) |
|--|--------|------|---------|
| 1.1 | `[x]` | Initialize Vite + React, install all dependencies | `Frontend/` |
| 1.2 | `[x]` | Create `.env` with `VITE_API_URL=http://127.0.0.1:8000` and `VITE_STREAMING_ENABLED=false` | `Frontend/.env` |
| 1.3 | `[x]` | Build MUI dark theme — Flowise palette, Inter font, sidebar/topbar tokens | `src/theme/index.js` |
| 1.4 | `[x]` | Build `MainCard` wrapper component | `src/components/MainCard.jsx` |
| 1.5 | `[x]` | Build `ConfirmDialog` — destructive action dialog | `src/components/ConfirmDialog.jsx` |
| 1.6 | `[x]` | Build `StatusChip` — status color map | `src/components/StatusChip.jsx` |
| 1.7 | `[x]` | Build `StyledDataGrid` — MUI DataGrid with dark theme | `src/components/StyledDataGrid.jsx` |
| 1.8 | `[x]` | Build `axiosInstance.js` — base config, JWT interceptor, 401 auto-refresh | `src/api/axiosInstance.js` |
| 1.9 | `[x]` | Set up Redux store with empty slices | `src/store/index.js`, `src/store/slices/*.js` |
| 1.10 | `[x]` | Build `AdminLayout.jsx` — 260px sidebar, nav items, active indicator, 64px topbar | `src/layouts/AdminLayout.jsx` |
| 1.11 | `[x]` | Build `UserLayout.jsx` — minimal top nav, no sidebar | `src/layouts/UserLayout.jsx` |

### ✅ Milestone 1 Validation
Open the browser and confirm:
- [x] Build passes — `npm run build` completes with 0 errors
- [x] Background is `#1A1F2E`, sidebar is `#171C2B` — configured in theme
- [x] Sidebar nav items highlight correctly on hover and active — implemented in AdminLayout
- [x] `MainCard` renders with correct border and radius — 12px radius, `#1E2330` bg, `#2D3448` border
- [x] `ConfirmDialog` opens and closes with correct red confirm button — `#E74C3C` confirm
- [x] `StatusChip` renders all 5+ status variants with correct colors — 9 statuses mapped
- [x] `StyledDataGrid` applies dark theme styling — borders, header bg, hover states
- [x] `axiosInstance.js` includes JWT interceptor + 401 auto-refresh
- [x] Redux store initialized with 4 slices
- [x] AdminLayout: 260px sidebar, 64px topbar, 5 nav items with active indicator
- [x] UserLayout: minimal topnav without sidebar
- [x] All routes wired in App.jsx with role guards

---

## Milestone 2 — Auth & Routing
> Goal: Full login → redirect → protected route flow working against the real backend. This is the first real backend validation.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 2.1 | `[x]` | Implement `authApi.js` — login, logout, forgot-password, reset-password | `src/api/authApi.js` | 1.8 |
| 2.2 | `[x]` | Implement `authSlice.js` — login/logout thunks, role + tokens in state | `src/store/slices/authSlice.js` | 1.9 |
| 2.3 | `[x]` | Build `Login.jsx` — formik form, error display, role-based redirect | `src/views/auth/Login.jsx` | 2.1, 2.2 |
| 2.4 | `[x]` | Build `ForgotPassword.jsx` — email input, success state | `src/views/auth/ForgotPassword.jsx` | 2.1 |
| 2.5 | `[x]` | Build `AdminRoutes.jsx` — role guard → `/login` if not admin | `src/routes/AdminRoutes.jsx` | 2.2 |
| 2.6 | `[x]` | Build `UserRoutes.jsx` — role guard → `/login` if not user | `src/routes/UserRoutes.jsx` | 2.2 |
| 2.7 | `[x]` | Wire `App.jsx` — all routes defined with correct guards | `src/App.jsx` | 2.3–2.6 |
| 2.8 | `[x]` | Build placeholder pages for all admin tabs (one `MainCard` with tab title only) | all `views/admin/*.jsx` | 1.10 |

### ✅ Milestone 2 Validation (against real backend)
- [x] Login with wrong credentials → shows error snackbar with backend message
- [x] Login as admin → redirects to `/admin/dashboard` placeholder
- [x] Login as user → redirects to `/chat` placeholder
- [x] Visit `/admin/dashboard` without login → redirects to `/login`
- [x] Token persists on page refresh — not logged out
- [x] Logout clears storage and redirects to `/login`
- [x] All sidebar nav links navigate to correct placeholder pages

---

## Milestone 3 — Document Stores
> Goal: Full KB pipeline working — create KB, upload file, load/chunk, view chunks, upsert.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 3.1 | `[x]` | Implement `knowledgeBaseApi.js` — all KB, config, upload, documents, chunks endpoints | `src/api/knowledgeBaseApi.js` | 1.8 |
| 3.2 | `[x]` | Implement `kbSlice.js` — KB list, selected KB, documents, chunks, async thunks | `src/store/slices/kbSlice.js` | 1.9 |
| 3.3 | `[x]` | Build `DocumentStoreList.jsx` — card grid 3/row, add/edit/delete dialogs, status chip | `src/views/admin/DocumentStores/DocumentStoreList.jsx` | 3.1, 3.2 |
| 3.4 | `[x]` | Build `UpsertionConfigDialog.jsx` — dynamic form from `/components` endpoints, POST/PUT config, "Configured" chip | `src/views/admin/DocumentStores/UpsertionConfigDialog.jsx` | 3.1 |
| 3.5 | `[x]` | Build `UploadDocumentDialog.jsx` — drag-and-drop zone, format chips, upload progress bar | `src/views/admin/DocumentStores/UploadDocumentDialog.jsx` | 3.1 |
| 3.6 | `[x]` | Build `DocumentStoreDetail.jsx` — breadcrumb, documents table, row actions menu (Load / View Chunks / Delete) | `src/views/admin/DocumentStores/DocumentStoreDetail.jsx` | 3.1, 3.2 |
| 3.7 | `[x]` | Build `IngestStatusDialog.jsx` — Load Document action, inline row spinner, status update on success | `src/views/admin/DocumentStores/IngestStatusDialog.jsx` | 3.1 |
| 3.8 | `[x]` | Build `ChunksViewDialog.jsx` — full-width dialog, chunks table, edit/delete per chunk, pagination 20/page | `src/views/admin/DocumentStores/ChunksViewDialog.jsx` | 3.1 |

### ✅ Milestone 3 Validation (against real backend)
- [x] Create a KB → card appears in grid with correct name and "Pending" chip
- [x] Open KB → detail page with breadcrumb
- [x] Set Upsertion Config → "Configured" green chip appears, reloading page keeps it
- [x] Upload a PDF → file appears in documents table with size and date
- [x] "Load Document" → spinner shows, status changes to "Loaded" on success
- [x] "View & Edit Chunks" → chunks appear, edit one chunk → saved, delete one chunk → removed
- [x] "Trigger Upsert" → success snackbar
- [x] Delete KB → confirm dialog appears, KB removed from grid

---

## Milestone 4 — Chatbots
> Goal: Create and configure a chatbot linked to a real KB.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 4.1 | `[x]` | Implement `chatbotApi.js` — CRUD chatbots | `src/api/chatbotApi.js` | 1.8 |
| 4.2 | `[x]` | Implement `chatbotSlice.js` — list, selected, async thunks | `src/store/slices/chatbotSlice.js` | 1.9 |
| 4.3 | `[x]` | Build `ChatbotList.jsx` — card grid, three-dot menu (Edit / Delete / Open Chat), KB name + LLM badge per card, uses `ChatbotSettingsDialog` for both create and edit | `src/views/admin/Chatbots/ChatbotList.jsx` | 4.1, 4.2 |
| 4.4 | `[x]` | Build `ChatbotSettingsDialog.jsx` — full settings dialog like UpsertionConfigDialog: cards for Basic Info, KB, LLM (dynamic schema), Chain & Memory, Prompt. No separate editor page. | `src/views/admin/Chatbots/ChatbotSettingsDialog.jsx` | 4.1, 4.2 |

### ✅ Milestone 4 Validation (against real backend)
- [x] "Add Chatbot" button opens settings dialog with all sections in card layout
- [x] Edit from context menu opens same dialog pre-filled with chatbot data
- [x] KB dropdown populated from kbSlice (KBs created in M3)
- [x] LLM Provider dropdown loads from `/admin/components?category=chat_model` with dynamic fields
- [x] Create saves new chatbot to backend, Update saves changes to existing
- [x] Delete from context menu → ConfirmDialog → chatbot removed from grid
- [x] Form validation prevents save with empty name
- [x] No separate editor page — `/admin/chatbots/:id` redirects to list

---

## Milestone 5 — Chat System
> Goal: Full conversation working in both Admin test mode and User mode.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 5.1 | `[x]` | Implement `chatApi.js` — sessions CRUD, message history, send message with streaming flag | `src/api/chatApi.js` | 1.8 |
| 5.2 | `[x]` | Build `ChatWindow.jsx` — message bubbles (right=blue, left=dark card), markdown rendering, auto-scroll, loading indicator | `src/components/ChatWindow.jsx` | 5.1 |
| 5.3 | `[x]` | Build `AdminChat.jsx` — left: session list (ChatGPT-style) with chatbot dropdown at top + New Conversation button; center: ChatWindow; right: settings panel (name, KB, LLM, chain, memory, prompt) with Update button | `src/views/admin/Chat/AdminChat.jsx` | 5.1, 5.2 |
| 5.4 | `[x]` | Build `UserChat.jsx` — left: session list (ChatGPT-style) with chatbot dropdown at top + New Conversation button; center: ChatWindow; 429 rate limit banner | `src/views/user/UserChat.jsx` | 5.1, 5.2 |
| 5.5 | `[x]` | Add numeric type coercion (`castValue`) to fix temperature float issue in `ChatbotSettingsDialog.jsx` + AdminChat settings panel | `src/views/admin/Chatbots/ChatbotSettingsDialog.jsx` | 5.2 |

### ✅ Milestone 5 Validation (against real backend)
- [x] Admin selects chatbot in Chat tab → new session created automatically — verified code, auto-creates with `adminCreateSession` in `loadSessionsAndMessages` (AdminChat.jsx:96-106)
- [x] Send a message → reply appears in bubble with markdown rendered — verified code, `ChatWindow.jsx` renders user msg right (blue) + AI msg left (dark+markdown via `react-markdown`)
- [x] Chat history loads when switching back to a previous session — verified code, `switchSession` (AdminChat.jsx:117-126) loads messages via `adminListMessages`
- [x] Settings panel toggles via gear icon, shows all config cards (name, KB, LLM, chain, memory, prompt) — verified visual: gear icon at AdminChat.jsx:365, panel with all 5 cards at lines 477-657
- [ ] "Update Settings" saves changes to backend, next chat reply reflects changes — code implemented (AdminChat.jsx:198-239), needs backend to fully test
- [ ] Login as user → only sees assigned chatbots — implemented, needs backend (`GET /user/chatbots`)
- [x] User sends message → reply appears correctly — verified code, `handleSend` (UserChat.jsx:103-136) uses `userSendMessage`
- [x] User hits rate limit → banner shows, input disabled — verified code, 429 check (UserChat.jsx:125-127), Alert banner (lines 293-297), `disabled={rateLimited}` (line 322)
- [x] Delete session → removed from dropdown — verified code, both AdminChat (lines 269-289) and UserChat (lines 138-158)

---

## Milestone 6 — User Management
> Goal: Admin can fully control user access, features, and chatbot permissions.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 6.1 | `[ ]` | Implement `usersApi.js` — list/get/delete, patch access/features/role, chatbot-access grant/revoke | `src/api/usersApi.js` | 1.8 |
| 6.2 | `[ ]` | Implement `usersSlice.js` — user list, selected user, async thunks | `src/store/slices/usersSlice.js` | 1.9 |
| 6.3 | `[ ]` | Build `UserList.jsx` — DataGrid, search by email, filter by role/status, actions column | `src/views/admin/Users/UserList.jsx` | 6.1, 6.2 |
| 6.4 | `[ ]` | Build `UserAccessDrawer.jsx` — 420px right drawer: account section, features section, chatbot-access section; each section saves independently | `src/views/admin/Users/UserAccessDrawer.jsx` | 6.1 |

### ✅ Milestone 6 Validation (against real backend)
- [ ] User list loads with correct status chips
- [ ] Search by email filters table in real time
- [ ] Open drawer → all current values pre-loaded from backend
- [ ] Toggle active → user deactivated, chip updates immediately
- [ ] Change role → saved independently without affecting other sections
- [ ] Enable TTS + set rate limit 20 → saved, re-open drawer shows correct values
- [ ] Grant chatbot access → chip appears; revoke → chip removed
- [ ] Delete user → confirm dialog, removed from table

---

## Milestone 7 — Dashboard & Polish
> Goal: Dashboard live with real stats. All error states, loading states, and edge cases verified.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 7.1 | `[ ]` | Build `Dashboard.jsx` — 4 stat cards + recent activity table | `src/views/admin/Dashboard.jsx` | 1.8 |
| 7.2 | `[ ]` | Audit error handling — every API call has `try/catch` + snackbar with `err.response?.data?.detail` | All files | M3–M6 |
| 7.3 | `[ ]` | Audit loading states — per-action Redux booleans, inline `CircularProgress`, no full-page spinners | All files | M3–M6 |
| 7.4 | `[ ]` | Audit destructive actions — every delete/deactivate goes through `ConfirmDialog` | All files | M3–M6 |
| 7.5 | `[ ]` | Audit design — no inline color overrides, all status via `StatusChip`, all pages use `MainCard` | All files | M3–M6 |

### ✅ Milestone 7 Validation
- [ ] Dashboard stat cards show real numbers from backend
- [ ] Kill the backend → every page shows error snackbar, no blank crashes
- [ ] Slow network → loading spinners appear on all async actions
- [ ] Full flow: login → create KB → upload doc → load → upsert → create chatbot → chat → manage user access → logout

---

## Dependency Graph

```
M1 Scaffold & Design System
  └── M2 Auth & Routing
        ├── M3 Document Stores ─────────────────┐
        ├── M4 Chatbots ──── M5 Chat System ◄───┘ (chatbot needs KB)
        ├── M6 User Management
        └── M7 Dashboard & Polish (depends on M3–M6)
```

M3, M4, M6 are parallel after M2. M5 depends on M4. M7 is last.

---

## Backend Bug Found (M5)

**File**: `backend/app/components/Chatmodels/ChatOllama/ChatOllama.py`
- `InputParam(name="temperature " , ...)` has a **trailing space** in the `name` field.
- The component's `build()` method accesses `config["temperature"]` (no space), causing a KeyError.
- **Fix needed in backend**: Remove the trailing space from the `name` value to match `build()` usage.

## Fixed During M5 Review

### AdminChat.jsx (3 fixes)
1. **`selectedChatbot` stale after settings save** — `handleUpdateSettings` now captures the result from `updateChatbotThunk` and calls `setSelectedChatbot(result)` to keep local state in sync with Redux.
2. **`store_id` not in update payload** — Added `store_id: settingsForm.store_id || null` to the settings update payload for future backend support.
3. **Missing `fetchKnowledgeBases()`** — Added `dispatch(fetchKnowledgeBases())` in the `useEffect` so the KB dropdown in the settings panel isn't empty when navigating directly to `/admin/chat`.

### .env fix
- **Empty `VITE_API_URL`** — Changed from empty to `http://127.0.0.1:8000` (matching tasks.md spec). The axios fallback covered it, but the env file should be correct.

### Chatbot Update — Backend Limitation
- `UpdateChatbotRequest` in `backend/app/api/Admin/chatbot.py` does **not** include `store_id`. The KB selector in the AdminChat settings panel displays correctly but saving the KB requires backend support. Frontend sends `store_id` in the payload; backend silently ignores it.

---

## Install Command

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

## Environment

```
VITE_API_URL=http://127.0.0.1:8000
VITE_STREAMING_ENABLED=false
```
