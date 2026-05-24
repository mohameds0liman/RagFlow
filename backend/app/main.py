from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.bootstrap import register_all
from fastapi.staticfiles import StaticFiles
## Admin
from app.api.Admin.admin import router as admin_router
from app.api.Admin.chatbot import router as chatbot_router
from app.api.Admin.chat import router as chat_router
from app.api.Admin.users import router as users_router
from app.api.auth import router as auth_router
from app.api.Admin.profile import router as admin_profile_router

## User
from app.api.User.chat import router as user_router
from app.api.User.profile import router as user_profile_router




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
app.include_router(admin_profile_router)




app.include_router(user_router)
app.include_router(user_profile_router)



app.mount(
    "/",
    StaticFiles(
        directory=r"D:\WorkSpace\GitHub\Repo\Rag_Flow\Frontend\dist",
        html=True
    ),
    name="frontend"
)
