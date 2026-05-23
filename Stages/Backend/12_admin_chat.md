## plan
### Admin — Chat Pipeline
`backend/app/api/Admin/chat.py`
(router tag: "Chat") — 7 endpoints for session management and live chat testing:
- `POST /admin/chatbots/{chatbot_id}/sessions` — Create a new chat session for a chatbot
- `GET /admin/chatbots/{chatbot_id}/sessions` — List all sessions for a chatbot
- `GET /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Get a single session by ID
- `PUT /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Rename a session
- `DELETE /admin/chatbots/{chatbot_id}/sessions/{session_id}` — Delete a session
- `GET /admin/chatbots/{chatbot_id}/sessions/{session_id}/messages` — List all messages in a session
- `POST /admin/chatbots/{chatbot_id}/sessions/{session_id}/chat` — Send a message and get AI reply via the pipeline
`backend/app/core/factory.py` — `build_chat_pipeline(chatbot)` builds LLM → embedder → vector store → retriever → chain (via registry) from the chatbot's stored configs.
`backend/app/components/chain/ConversationalRetrievalChain/ConversationalRetrievalChain.py` — Registry component wrapping `ConversationalRetrievalChain.from_llm()`, accepts pre-built `llm` + `retriever` + `chain_type` + `k`.