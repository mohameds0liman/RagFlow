## plan

### Admin

#### Chatbot

this one to create chatbot with kb and configurations of LLM - chain type - memory - Prompts(not in the db schema yet) - and later orchastiration

`backend/app/api/Admin/chatbot.py`
(router tag: "ChatBot") — 5 endpoints:

- `POST /admin/chatbots` — Create
- `GET /admin/chatbots` — List
- `GET /admin/chatbots/{chatbot_id}` — Get
- `PUT /admin/chatbots/{chatbot_id}` — Update
- `DELETE /admin/chatbots/{chatbot_id}` — Delete





#### Chat

this one for live test of the chatbot and tune the instructions 
and may use this file to handle also the user normal chat with some of the endpoints

`backend/app/api/Admin/chat.py`

(router tag: "Chat") — 7 endpoints:

- `POST /admin/chatbots/{chatbot_id}/sessions` — Create session
- `GET /admin/chatbots/{chatbot_id}/sessions` — List sessions
- `GET /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Get session
- `PUT /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Rename session
- `DELETE /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Delete session
- `GET /admin/chatbots/{chatbot_id}/sessions/{session_id}/messages` — List messages
- `POST /admin/chatbots/{chatbot_id}/sessions/{session_id}/chat` — Chat (send + AI reply)