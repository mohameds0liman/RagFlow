## changes

- I change the Auth to -> auth.py 

### Admin — Users

`backend/app/api/Admin/users.py`
(router tag: "Admin — Users") — 8 endpoints for admin to manage end-users:
- `GET /admin/users` — List all users
- `GET /admin/users/{user_id}` — Get user details with session/chatbot counts
- `PATCH /admin/users/{user_id}/access` — Grant or revoke initial access approval
- `PATCH /admin/users/{user_id}/features` — Toggle STT/TTS features and daily message limit
- `PATCH /admin/users/{user_id}/role` — Change user role
- `DELETE /admin/users/{user_id}` — Delete a user
- `GET /admin/users/{user_id}/chatbot-access` — List chatbot accesses granted to a user
- `POST /admin/users/{user_id}/chatbot-access` — Grant user access to a chatbot (by `chatbot_id`)
- `DELETE /admin/users/{user_id}/chatbot-access/{chatbot_id}` — Revoke chatbot access