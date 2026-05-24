## Overview 

Completing the User Side of the API 

### User
#### Chat
this one for the end-user chat experience like chatgpt with list of accessible chatbots and sessions management and daily rate limit
`backend/app/api/User/chat.py`
(router tag: "User Chat") — 8 endpoints:
- `GET /user/chatbots` — List accessible chatbots
- `POST /user/sessions` — Create session
- `GET /user/sessions` — List sessions (sidebar)
- `GET /user/sessions/{session_id}` — Get session
- `PUT /user/sessions/{session_id}` — Update session (rename / switch chatbot)
- `DELETE /user/sessions/{session_id}` — Delete session
- `GET /user/sessions/{session_id}/messages` — Load messages
- `POST /user/chatbots/{chatbot_id}/sessions/{session_id}/chat` — Send message + AI reply
#### Profile
this one for the end-user to view and update their own profile and change password
`backend/app/api/User/profile.py`
(router tag: "User Profile") — 3 endpoints:
- `GET /user/profile` — Get profile
- `PUT /user/profile` — Update profile
- `PATCH /user/profile/password` — Change password