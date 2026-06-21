from fastapi import (
    APIRouter,
    HTTPException,
    Query,
    Depends,
    Body,
)
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import (
    ChatSession,
    ChatMessage,
    MessageRole,
    User,
)
from app.core.factory import PipelineFactory
from app.api.Admin.admin import to_dict , _validate_chatbot
from app.api.auth import require_admin
router = APIRouter(prefix="/admin", tags=["Chat"])
##########################################################################
# Pydantic Schemas
##########################################################################
class CreateSessionRequest(BaseModel):
    title: str | None = None
class ChatRequest(BaseModel):
    message: str

######################################################################## 
# define Factory 

factory = PipelineFactory()

########################################################################
##########################################################################
# Helpers
##########################################################################
def _validate_session(db: Session, session_id: str, chatbot_id: str) -> ChatSession:
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.chatbot_id == chatbot_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session
def _session_to_dict(session, db: Session | None = None) -> dict:
    extras = None
    if db:
        extras = {
            "messages_count": db.query(func.count(ChatMessage.id)).filter(
                ChatMessage.session_id == session.id
            ).scalar(),
        }
    d = to_dict(session, extras=extras)
    if session.chatbot:
        d["chatbot_name"] = session.chatbot.name
    return d
def _message_to_dict(msg) -> dict:
    return to_dict(msg)


##########################################################################
# Endpoints
##########################################################################
@router.post("/chatbots/{chatbot_id}/sessions")
def create_session(
    chatbot_id: str,
    request: CreateSessionRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    chatbot = _validate_chatbot(db=db, chatbot_id=chatbot_id)
    session = ChatSession(
        chatbot_id=chatbot.id,
        user_id=admin_user.id,
        title=request.title or f"Chat with {chatbot.name}",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"status": "created", "session": _session_to_dict(session, db)}
@router.get("/chatbots/{chatbot_id}/sessions")
def list_sessions(
    chatbot_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _validate_chatbot(db=db, chatbot_id=chatbot_id)
    query = db.query(ChatSession).filter(ChatSession.chatbot_id == chatbot_id)
    if admin_user:
        query = query.filter(ChatSession.user_id == admin_user.id)  ## only return related session to the admin with his id
    sessions = query.order_by(ChatSession.updated_date.desc()).all()
    return {
        "status": "list",
        "count": len(sessions),
        "sessions": [_session_to_dict(s, db) for s in sessions],
    }
@router.get("/chatbots/{chatbot_id}/sessions/{session_id}")
def get_session(
    chatbot_id: str,
    session_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _validate_chatbot(db=db, chatbot_id=chatbot_id)
    session = _validate_session(db=db, session_id=session_id, chatbot_id=chatbot_id)
    return {"status": "found", "session": _session_to_dict(session, db)}
@router.put("/chatbots/{chatbot_id}/sessions/{session_id}")
def update_session(
    chatbot_id: str,
    session_id: str,
    payload: dict = Body(default_factory=dict),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _validate_chatbot(db=db, chatbot_id=chatbot_id)
    session = _validate_session(db=db, session_id=session_id, chatbot_id=chatbot_id)
    if "title" in payload:
        session.title = payload["title"]
    db.commit()
    db.refresh(session)
    return {"status": "updated", "session": _session_to_dict(session, db)}
@router.delete("/chatbots/{chatbot_id}/sessions/{session_id}")
def delete_session(
    chatbot_id: str,
    session_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _validate_chatbot(db=db, chatbot_id=chatbot_id)
    session = _validate_session(db=db, session_id=session_id, chatbot_id=chatbot_id)
    db.delete(session)
    db.commit()
    return {"status": "deleted", "session_id": session_id}
@router.get("/chatbots/{chatbot_id}/sessions/{session_id}/messages")
def list_messages(
    chatbot_id: str,
    session_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _validate_chatbot(db=db, chatbot_id=chatbot_id)
    _validate_session(db=db, session_id=session_id, chatbot_id=chatbot_id)
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_date).all()
    return {
        "status": "list",
        "count": len(messages),
        "messages": [_message_to_dict(m) for m in messages],
    }
@router.post("/chatbots/{chatbot_id}/sessions/{session_id}/chat")
def send_message(
    chatbot_id: str,
    session_id: str,
    request: ChatRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    chatbot = _validate_chatbot(db=db, chatbot_id=chatbot_id)
    session = _validate_session(db=db, session_id=session_id, chatbot_id=chatbot_id)
    # 1. Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        user_id=session.user_id,
        role=MessageRole.human,
        content=request.message,
    )
    db.add(user_msg)
    db.flush()
    # 2. Load completed exchanges (human + ai pairs) for history
    prev = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id,
        ChatMessage.id != user_msg.id,
    ).order_by(ChatMessage.created_date).all()
    chat_history = [
    (prev[i].content, prev[i + 1].content)
    for i in range(0, len(prev) - 1, 2)
    if prev[i].role == MessageRole.human and prev[i + 1].role == MessageRole.ai
    ][-chatbot.chain_config.get("last_k_message_pairs", 3):]   # last 3 pairs ≈ last 6 messages; use [-2:] for ~5 messages
    # 3. Build and invoke chain
    import time
    start = time.time()
    try:
        chain = factory.build_chat_pipeline(chatbot)
        result = chain.invoke({
            "question": request.message,
            "chat_history": chat_history,
        })
        answer = result.get("answer", "")
        source_docs = [
            {"page_content": d.page_content, "metadata": d.metadata}
            for d in result.get("source_documents", [])
        ]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Chat pipeline error: {str(e)}")
    elapsed = round(time.time() - start, 2)
    # 4. Save AI response
    ai_msg = ChatMessage(
        session_id=session.id,
        user_id=None,
        role=MessageRole.ai,
        content=answer,
        source_documents=source_docs,
        execution_time=elapsed,
    )
    db.add(ai_msg)
    # 5. Touch session timestamp
    session.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(user_msg)
    db.refresh(ai_msg)
    return {
        "status": "ok",
        "user_message": _message_to_dict(user_msg),
        "ai_message": _message_to_dict(ai_msg),
    }