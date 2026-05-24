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
| 3.1 | `[ ]` | Implement `knowledgeBaseApi.js` — all KB, config, upload, documents, chunks endpoints | `src/api/knowledgeBaseApi.js` | 1.8 |
| 3.2 | `[ ]` | Implement `kbSlice.js` — KB list, selected KB, documents, chunks, async thunks | `src/store/slices/kbSlice.js` | 1.9 |
| 3.3 | `[ ]` | Build `DocumentStoreList.jsx` — card grid 3/row, add/edit/delete dialogs, status chip | `src/views/admin/DocumentStores/DocumentStoreList.jsx` | 3.1, 3.2 |
| 3.4 | `[ ]` | Build `UpsertionConfigDialog.jsx` — dynamic form from `/components` endpoints, POST/PUT config, "Configured" chip | `src/views/admin/DocumentStores/UpsertionConfigDialog.jsx` | 3.1 |
| 3.5 | `[ ]` | Build `UploadDocumentDialog.jsx` — drag-and-drop zone, format chips, upload progress bar | `src/views/admin/DocumentStores/UploadDocumentDialog.jsx` | 3.1 |
| 3.6 | `[ ]` | Build `DocumentStoreDetail.jsx` — breadcrumb, documents table, row actions menu (Load / View Chunks / Delete) | `src/views/admin/DocumentStores/DocumentStoreDetail.jsx` | 3.1, 3.2 |
| 3.7 | `[ ]` | Build `IngestStatusDialog.jsx` — Load Document action, inline row spinner, status update on success | `src/views/admin/DocumentStores/IngestStatusDialog.jsx` | 3.1 |
| 3.8 | `[ ]` | Build `ChunksViewDialog.jsx` — full-width dialog, chunks table, edit/delete per chunk, pagination 20/page | `src/views/admin/DocumentStores/ChunksViewDialog.jsx` | 3.1 |

### ✅ Milestone 3 Validation (against real backend)
- [ ] Create a KB → card appears in grid with correct name and "Pending" chip
- [ ] Open KB → detail page with breadcrumb
- [ ] Set Upsertion Config → "Configured" green chip appears, reloading page keeps it
- [ ] Upload a PDF → file appears in documents table with size and date
- [ ] "Load Document" → spinner shows, status changes to "Loaded" on success
- [ ] "View & Edit Chunks" → chunks appear, edit one chunk → saved, delete one chunk → removed
- [ ] "Trigger Upsert" → success snackbar
- [ ] Delete KB → confirm dialog appears, KB removed from grid

---

## Milestone 4 — Chatbots
> Goal: Create and configure a chatbot linked to a real KB.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 4.1 | `[ ]` | Implement `chatbotApi.js` — CRUD chatbots | `src/api/chatbotApi.js` | 1.8 |
| 4.2 | `[ ]` | Implement `chatbotSlice.js` — list, selected, async thunks | `src/store/slices/chatbotSlice.js` | 1.9 |
| 4.3 | `[ ]` | Build `ChatbotList.jsx` — card grid, three-dot menu (Edit / Delete / Open Chat), KB name + LLM badge per card | `src/views/admin/Chatbots/ChatbotList.jsx` | 4.1, 4.2 |
| 4.4 | `[ ]` | Build `ChatbotEditor.jsx` — left 60%: form fields (name, desc, chain type, LLM config, KB select, instructions, tools); right 40%: live preview panel placeholder | `src/views/admin/Chatbots/ChatbotEditor.jsx` | 4.1, 4.2 |

### ✅ Milestone 4 Validation (against real backend)
- [ ] Create chatbot → card appears with KB name and LLM badge
- [ ] Edit chatbot → form pre-fills with saved values
- [ ] KB dropdown shows KBs created in M3
- [ ] Delete chatbot → confirm dialog, removed from grid
- [ ] Form validation prevents save with empty name or no KB selected

---

## Milestone 5 — Chat System
> Goal: Full conversation working in both Admin test mode and User mode.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 5.1 | `[ ]` | Implement `chatApi.js` — sessions CRUD, message history, send message with streaming flag | `src/api/chatApi.js` | 1.8 |
| 5.2 | `[ ]` | Build `ChatWindow.jsx` — message bubbles (right=blue, left=dark card), markdown rendering, auto-scroll, loading indicator | `src/components/ChatWindow.jsx` | 5.1 |
| 5.3 | `[ ]` | Build `AdminChat.jsx` — left: chatbot list; right: ChatWindow; session history dropdown; "Edit Instructions" inline overlay | `src/views/admin/Chat/AdminChat.jsx` | 5.1, 5.2 |
| 5.4 | `[ ]` | Build `UserChat.jsx` — left: assigned chatbots; right: ChatWindow; auto-create session on first message; 429 rate limit banner | `src/views/user/UserChat.jsx` | 5.1, 5.2 |
| 5.5 | `[ ]` | Wire live chat preview into right panel of `ChatbotEditor.jsx` | `src/views/admin/Chatbots/ChatbotEditor.jsx` | 5.2 |

### ✅ Milestone 5 Validation (against real backend)
- [ ] Admin selects chatbot in Chat tab → new session created automatically
- [ ] Send a message → reply appears in bubble with markdown rendered
- [ ] Chat history loads when switching back to a previous session
- [ ] "Edit Instructions" updates chatbot and next reply reflects change
- [ ] Login as user → only sees assigned chatbots
- [ ] User sends message → reply appears correctly
- [ ] User hits rate limit → banner shows, input disabled
- [ ] Delete session → removed from dropdown

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
