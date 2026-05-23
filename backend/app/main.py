from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.bootstrap import register_all
from fastapi.staticfiles import StaticFiles

from app.api.Admin.admin import router as admin_router
from app.api.Admin.chatbot import router as chatbot_router
from app.api.Admin.chat import router as chat_router
from app.api.Admin.users import router as users_router
from app.api.auth import router as auth_router

# from pathlib import Path
# BASE_DIR = Path(__file__).resolve().parent  # points to wherever main.py lives

app = FastAPI(title="RAG")


app.add_middleware(
    CORSMiddleware,
    # allow_origins=["*"],
    allow_origins=["http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_all()



# app.mount("/icons", StaticFiles(directory=BASE_DIR/ "components" / "icons"), name="icons")

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(chatbot_router)
app.include_router(chat_router)
app.include_router(users_router)


app.mount(
    "/",
    StaticFiles(
        directory=r"D:\WorkSpace\GitHub\Repo\Rag_Flow\Stages\Frontend\Demo",
        html=True
    ),
    name="frontend"
)
