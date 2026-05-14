from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.bootstrap import register_all

from app.api.Admin.admin import router as admin_router


app = FastAPI(title="RAG")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_all()


app.include_router(admin_router)
