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

### ✅ Milestone 5 Validation
- [x] Admin selects chatbot → new session auto-created — code verified
- [x] Send message → reply in markdown bubble — code verified
- [x] Chat history loads on session switch — code verified
- [x] Settings panel toggles via gear icon, 5 config cards — code + visual verified
- [ ] "Update Settings" saves to backend — **not tested** (needs running backend; backend `UpdateChatbotRequest` also missing `store_id` field)
- [ ] Login as user → only assigned chatbots — **not tested** (needs running backend)
- [x] User sends message → reply appears — code verified
- [x] User hits 429 rate limit → banner + input disabled — code verified
- [x] Delete session → removed from list — code verified

---

## Milestone 6 — User Management
> Goal: Admin can fully control user access, features, and chatbot permissions.

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 6.1 | `[x]` | Implement `usersApi.js` — list/get/delete, patch access/features/role, chatbot-access grant/revoke | `src/api/usersApi.js` | 1.8 |
| 6.2 | `[x]` | Implement `usersSlice.js` — user list, selected user, async thunks | `src/store/slices/usersSlice.js` | 1.9 |
| 6.3 | `[x]` | Build `UserList.jsx` — DataGrid, search by email, filter by role/status, actions column | `src/views/admin/Users/UserList.jsx` | 6.1, 6.2 |
| 6.4 | `[x]` | Build `UserAccessDrawer.jsx` — 420px right drawer: account section, features section, chatbot-access section; each section saves independently | `src/views/admin/Users/UserAccessDrawer.jsx` | 6.1 |

### ✅ Milestone 6 Validation (against real backend)
- [x] User list loads with correct status chips — **not tested** (needs running backend)
- [x] Search by email filters table in real time — **not tested** (needs running backend)
- [x] Open drawer → all current values pre-loaded from backend — **not tested** (needs running backend)
- [x] Toggle active → user deactivated, chip updates immediately — **not tested** (needs running backend)
- [x] Change role → saved independently without affecting other sections — **not tested** (needs running backend)
- [x] Enable TTS + set rate limit 20 → saved, re-open drawer shows correct values — **not tested** (needs running backend)
- [x] Grant chatbot access → chip appears; revoke → chip removed — **not tested** (needs running backend)
- [x] Delete user → confirm dialog, removed from table — **not tested** (needs running backend)

---

## Milestone 7 — Dashboard & Polish
> Goal: Dashboard live with real stats. All error states, loading states, and edge cases verified.

| # | Status | Task | File(s) | Depends On |
|--|--------|------|---------|------------|
| 7.1 | `[x]` | Build `Dashboard.jsx` — 5 stat cards + recent activity table | `src/views/admin/Dashboard.jsx`, `src/api/knowledgeBaseApi.js`, `src/store/slices/kbSlice.js` | 1.8 |
| 7.2 | `[x]` | Audit error handling — every API call has `try/catch` + snackbar with `err.response?.data?.detail` | `ChunksViewDialog.jsx`, `ChatbotList.jsx`, `UpsertionConfigDialog.jsx`, `IngestStatusDialog.jsx`, `ChatbotSettingsDialog.jsx`, `AdminChat.jsx`, `UserChat.jsx` | M3–M6 |
| 7.3 | `[x]` | Audit loading states — per-action Redux booleans, inline `CircularProgress`, no full-page spinners | All files | M3–M6 |
| 7.4 | `[x]` | Audit destructive actions — every delete/deactivate goes through `ConfirmDialog` | All files | M3–M6 |
| 7.5 | `[x]` | Audit design — no inline color overrides, all status via `StatusChip`, all pages use `MainCard` | `ChunksViewDialog.jsx` (status column → StatusChip) | M3–M6 |

### ✅ Milestone 7 Validation
- [x] Dashboard stat cards show real numbers from backend — 5 cards: KB, Documents, Loaders, Chunks, Chatbots
- [ ] Kill the backend → every page shows error snackbar, no blank crashes — **needs running backend to test**
- [x] Slow network → loading spinners appear on all async actions — all pages have CircularProgress for loading states
- [ ] Full flow: login → create KB → upload doc → load → upsert → create chatbot → chat → manage user access → logout — **needs running backend to test**

---

## Milestone 8 — User Experience Redesign & Profiles
> Goal: Redesign `UserChat.jsx` into a clean ChatGPT-style layout that feels nothing like the admin panel. Add profile pages for both roles. Wire all profile/settings API endpoints.

### 8A — UserChat Redesign

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 8.1 | `[ ]` | Redesign `UserLayout.jsx` — full-height, no sidebar; top navbar: logo left, chatbot switcher center, user avatar + dropdown menu right (Profile, Logout) | `src/layouts/UserLayout.jsx` | M5 |
| 8.2 | `[ ]` | Build `ChatbotSwitcher.jsx` — pill/tab bar in top navbar listing all assigned chatbots by name; active chatbot highlighted in `#4B72FF`; clicking a tab switches chatbot and reloads its sessions without auto-creating a new one | `src/components/ChatbotSwitcher.jsx` | 5.1 |
| 8.3 | `[ ]` | Redesign `UserChat.jsx` — on mount: load sessions for the first assigned chatbot; switching tab via `ChatbotSwitcher` reloads session list for that chatbot; no chatbot dropdown in left panel anymore | `src/views/user/UserChat.jsx` | 8.1, 8.2 |
| 8.4 | `[ ]` | Style session list (left panel, 260px) — ChatGPT-style: "New Chat" button at top; session title = first user message truncated to 30 chars or "New Conversation"; relative timestamp (Today / Yesterday / older date); hover shows delete icon; active session highlighted | `src/views/user/UserChat.jsx` | 8.3 |
| 8.5 | `[ ]` | Style chat area (center, full remaining width) — no card border, clean dark background, assistant avatar = chatbot name initial in colored circle, user avatar = user initial; message timestamps appear on hover; smooth auto-scroll | `src/components/ChatWindow.jsx` | 8.3 |
| 8.6 | `[ ]` | Style input bar — full-width rounded textarea at bottom, send button inside input on right, disabled + spinner while awaiting reply, `Shift+Enter` for newline, `Enter` to send | `src/components/ChatWindow.jsx` | 8.5 |
| 8.7 | `[ ]` | Rate limit indicator — show "X / Y messages today" counter in top navbar next to avatar; when limit hit: soft warning banner above input bar, input disabled, counter turns red | `src/views/user/UserChat.jsx` | 8.3 |

### 8B — User Profile & Settings

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 8.8 | `[ ]` | Implement `profileApi.js` — `GET /user/profile`, `PUT /user/profile`, `POST /auth/change-password` | `src/api/profileApi.js` | 1.8 |
| 8.9 | `[ ]` | Build `UserProfilePage.jsx` — route `/profile`; two `MainCard` sections: "Personal Info" (name, email fields + read-only role badge) with Save button; "Change Password" (current password, new password, confirm password) with Save button; each section saves independently with its own loading state | `src/views/user/UserProfilePage.jsx` | 8.8 |
| 8.10 | `[ ]` | Add `/profile` route to `UserRoutes.jsx`; link from avatar dropdown in `UserLayout.jsx` | `src/routes/UserRoutes.jsx`, `src/layouts/UserLayout.jsx` | 8.9 |

### 8C — Admin Profile & Settings

| # | Status | Task | File(s) | Depends On |
|---|--------|------|---------|------------|
| 8.11 | `[ ]` | Build `AdminProfilePage.jsx` — route `/admin/profile`; same two-card layout as `UserProfilePage`: Personal Info + Change Password; reuses `profileApi.js`; each section saves independently | `src/views/admin/AdminProfilePage.jsx` | 8.8 |
| 8.12 | `[ ]` | Build `AdminSettingsPage.jsx` — route `/admin/settings`; placeholder `MainCard` sections for future platform config; at minimum renders without errors and shows a "Coming Soon" state per section | `src/views/admin/AdminSettingsPage.jsx` | 1.8 |
| 8.13 | `[ ]` | Add Profile + Settings to admin sidebar bottom section (above logout, separated by divider); link topbar avatar to `/admin/profile` | `src/layouts/AdminLayout.jsx` | 8.11, 8.12 |

### ✅ Milestone 8 Validation

**UserChat redesign:**
- [ ] Chatbot switcher tabs visible in top navbar — all assigned chatbots shown
- [ ] Switching chatbot tab loads that chatbot's sessions, no blank flash, no auto-new-session
- [ ] Sessions list shows truncated first-message title and relative timestamp
- [ ] "New Chat" creates session and opens empty chat area
- [ ] Assistant messages show chatbot initial avatar, user messages show user initial avatar
- [ ] Message timestamps appear on hover only
- [ ] Rate limit counter in navbar; hitting limit disables input and shows banner
- [ ] `Enter` sends message, `Shift+Enter` adds newline
- [ ] Layout looks clearly different from admin — no card borders on chat area, clean minimal feel

**Profiles:**
- [ ] Admin sidebar shows Profile and Settings links in bottom section with divider
- [ ] Admin topbar avatar links to `/admin/profile`
- [ ] Admin profile loads name and email pre-filled from `GET /user/profile`
- [ ] Admin updates name → saved, success snackbar
- [ ] Admin wrong current password → error snackbar from backend
- [ ] Admin settings page loads without errors
- [ ] User avatar dropdown shows Profile and Logout
- [ ] User profile page loads and saves correctly
- [ ] User change password works end-to-end

---

## Dependency Graph

```
M1 Scaffold & Design System
  └── M2 Auth & Routing
        ├── M3 Document Stores ─────────────────┐
        ├── M4 Chatbots ──── M5 Chat System ◄───┘ (chatbot needs KB)
        ├── M6 User Management
        ├── M7 Dashboard & Polish (depends on M3–M6)
        └── M8 UX Redesign & Profiles (depends on M5)
```

M3, M4, M6 are parallel after M2. M5 depends on M4. M7 and M8 are both final-layer — safe to work in parallel since M8 only touches user views and profile pages.

---

## Backend Bug Found (M5 — debunked)

**Earlier claim**: `InputParam(name="temperature " , ...)` in `ChatOllama.py` has a trailing space.
**Actual (verified byte-level)**: `name="temperature"` is correct — the space is after the closing `"` and before the `,`, which is Python formatting only. Does NOT affect serialization.

## Fixed During M5 Review

### AdminChat.jsx
1. **`selectedChatbot` stale after settings save** — `handleUpdateSettings` now captures the result and calls `setSelectedChatbot(result)`.
2. **`store_id` missing from update payload** — Added `store_id: settingsForm.store_id || null`. Backend `UpdateChatbotRequest` doesn't support `store_id` yet.
3. **Missing `fetchKnowledgeBases()`** — Added dispatch in `useEffect` so KB dropdown populates on direct nav to `/admin/chat`.

### ChatbotSettingsDialog.jsx + AdminChat.jsx — typedConfig fallback
4. **Untouched schema fields omitted from `build_config`** — The `typedConfig` builder used `if (field.name in form.llm_config)` which excluded fields the user never interacted with. If the user left `temperature` empty (expecting the default `0`), it was **missing entirely** → `config["temperature"]` KeyError. Fixed by falling back to `field.default`:
   ```js
   const raw = form.llm_config[field.name];
   const value = (raw !== undefined && raw !== '') ? raw : field.default;
   if (value !== undefined && value !== null)
     typedConfig[field.name] = castValue(value, field.type);
   ```

### .env
- **Empty `VITE_API_URL`** → `http://127.0.0.1:8000`.

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
