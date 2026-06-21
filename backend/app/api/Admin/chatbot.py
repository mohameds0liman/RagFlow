from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Depends,
    Body,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import (
    DocumentStore,
    Chatbot,
    ChatbotStatus,
    ChatSession,
    User,
)
from app.api.Admin.admin import to_dict , _validate_chatbot
from app.api.auth import require_admin
router = APIRouter(prefix="/admin", tags=["ChatBot"])
#########################################################################
# Pydantic Schemas
#########################################################################
class CreateChatbotRequest(BaseModel):
    name: str
    description: str | None = None
    store_id: str | None = None
    status: ChatbotStatus | None=ChatbotStatus.active
    llm_config: dict | None = None
    chain_config: dict | None = None
    memory_config: dict | None = None
    prompt_config: dict | None = None


class UpdateChatbotRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    llm_config: dict | None = None
    chain_config: dict | None = None
    memory_config: dict | None = None
    prompt_config: dict | None = None
#########################################################################
# Helpers
#########################################################################
def _chatbot_counts(bot, db: Session) -> dict:
    return {
        "sessions_count": db.query(func.count(ChatSession.id)).filter(
            ChatSession.chatbot_id == bot.id
        ).scalar(),
    }
def _chatbot_to_dict(bot, db: Session | None = None) -> dict:
    extras = _chatbot_counts(bot, db) if db else None
    d = to_dict(bot, extras=extras)
    if bot.document_store:
        d["document_store_name"] = bot.document_store.name
    if bot.creator:
        d["created_by_name"] = bot.creator.username
    return d
#########################################################################
# Endpoints
#########################################################################
@router.post("/chatbots")
def create_chatbot(
    request: CreateChatbotRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    
    if request.store_id is not None:
        store_config=db.query(DocumentStore).filter(DocumentStore.id==request.store_id).first()
        if not store_config: raise HTTPException(status_code=404 , detail="store_config not found")


    chatbot = Chatbot(
        created_by=admin_user.id,
        store_id=request.store_id,
        name=request.name,
        description=request.description,
        status=request.status,
        vector_store_config=store_config.vector_store_config,
        embedding_config=store_config.embedding_config,
        llm_config=request.llm_config,
        chain_config=request.chain_config,  ## Do not know how this one should made  its RetrievalQAChainComponent
                                            ## it ask for (llm - retriever - chain_type - verbose) may set of other inputs but will belong to the chat table not chatbot
                                            ## to be set at the Chat pipeline with other configs
                                            ## at fisrt i will only use RetrievalQAChainComponent until i solve the problem and later add more 
                                            ## For the chain_config of the Chat bot i will made it to get the chain_type value
                                            ## chain_type  ->  stuff - map_reduce - refine - map_rerank
        memory_config=request.memory_config,
        prompt_config=request.prompt_config,
    )
    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)
    return {"status": "created", "chatbot": _chatbot_to_dict(chatbot, db)}



# ###############################################################
# Example request body for POST /admin/chatbots:
# ###############################################################
# {
#   "name": "Support Bot",
#   "description": "Answers product questions",
#   "store_id": "05d803a0-2676-4cc8-a8e8-efd9c9ff70cc",
#   "status": "active",
#   "llm_config": {
#     "name": "ChatOllama",
#     "build_config": {
#       "base_url": "http://localhost:11434",
#       "model": "gemma4:31b-cloud",
#       "temperature": 0
#     }
#   },
#   "chain_config": {
#     "chain_type": "stuff",
#     "k": 4
#   },
#   "memory_config": {
#     "name": "ConversationBufferWindowMemory",
#     "build_config": {
#       "k": 10,
#       "return_messages": true
#     }
#   },
#   "prompt_config": {
#     "template": "Use the following pieces of context to answer the question at the end.\nIf you don't know the answer, just say that you don't know.\n{context}\nChat History:\n{chat_history}\nQuestion: {question}\nHelpful Answer:"
#   }
# }
#
# Or use defaults (omit fields):
# {
#   "name": "Simple Bot",
#   "store_id": "...",
#   "llm_config": {"name": "ChatOllama", "build_config": {"base_url": "http://localhost:11434", "model": "llama3.1:8b"}}
# }
#
##########################################

@router.get("/chatbots")
def list_chatbots(
    db: Session = Depends(get_db),
):
    chatbots = db.query(Chatbot).order_by(Chatbot.created_date.desc()).all()

    return {
        "status": "list",
        "count": len(chatbots),
        "chatbots": [_chatbot_to_dict(bot, db) for bot in chatbots],
    }

@router.get("/chatbots/{chatbot_id}")
def get_chatbot(chatbot_id: str, db: Session = Depends(get_db)):
    chatbot = _validate_chatbot(db=db, chatbot_id=chatbot_id)
    return {"status": "found", "chatbot": _chatbot_to_dict(chatbot, db)}

@router.put("/chatbots/{chatbot_id}")
def update_chatbot(
    chatbot_id: str,
    request: UpdateChatbotRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    chatbot = _validate_chatbot(db=db, chatbot_id=chatbot_id)
    if request.name is not None:
        chatbot.name = request.name
    if request.description is not None:
        chatbot.description = request.description
    if request.llm_config is not None:
        chatbot.llm_config = request.llm_config
    if request.chain_config is not None:
        chatbot.chain_config = request.chain_config
    if request.memory_config is not None:
        chatbot.memory_config = request.memory_config
    if request.prompt_config is not None:
        chatbot.prompt_config = request.prompt_config
    db.commit()
    db.refresh(chatbot)
    return {"status": "updated", "chatbot": _chatbot_to_dict(chatbot, db)}

@router.delete("/chatbots/{chatbot_id}")
def delete_chatbot(
    chatbot_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    chatbot = _validate_chatbot(db=db, chatbot_id=chatbot_id)
    db.delete(chatbot)
    db.commit()
    return {"status": "deleted", "chatbot_id": chatbot_id}