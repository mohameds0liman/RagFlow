from fastapi import APIRouter , HTTPException , Query , Depends , Body
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
    UserAccess,
    Chatbot,
)
from app.core.factory import PipelineFactory
from app.api.Admin.admin import to_dict
from app.api.auth import require_user
router = APIRouter(prefix="/user", tags=["User Chat"])
##########################################################################
# Pydantic Schemas
##########################################################################
class CreateSessionRequest(BaseModel):
    chatbot_id: str
    title: str | None = None
class UpdateSessionRequest(BaseModel):
    title: str | None = None
    chatbot_id: str | None = None
class ChatRequest(BaseModel):
    message: str
########################################################################
# define Factory
factory = PipelineFactory()
##########################################################################
# Helpers
##########################################################################
def _validate_user_session(db: Session, session_id: str, user_id: str) -> ChatSession:
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return session
def _validate_chatbot_access(db: Session, chatbot_id: str, user_id: str) -> Chatbot:
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    access = db.query(UserAccess).filter(
        UserAccess.user_id == user_id,
        UserAccess.chatbot_id == chatbot_id,
    ).first()
    if not access:
        raise HTTPException(status_code=403, detail="You do not have access to this chatbot")
    return chatbot
def _check_daily_limit(user: User) -> None:
    now = datetime.utcnow()
    if user.limit_reset_date and user.limit_reset_date.date() < now.date():
        user.messages_used_today = 0
        user.limit_reset_date = now
    if user.messages_used_today >= user.daily_message_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Daily message limit ({user.daily_message_limit}) exceeded. Please try again later.",
        )
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
@router.get("/chatbots")
def list_accessible_chatbots(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    accesses = db.query(UserAccess).filter(
        UserAccess.user_id == user.id
    ).all()
    chatbot_ids = [a.chatbot_id for a in accesses]
    chatbots = db.query(Chatbot).filter(Chatbot.id.in_(chatbot_ids)).all()
    return {
        "status": "list",
        "count": len(chatbots),
        "chatbots": [to_dict(c) for c in chatbots],
    }

@router.post("/sessions")
def create_session(
    request: CreateSessionRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    chatbot = db.query(Chatbot).filter(Chatbot.id == request.chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    session = ChatSession(
        chatbot_id=chatbot.id,
        user_id=user.id,
        title=request.title or f"Chat with {chatbot.name}",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"status": "created", "session": _session_to_dict(session, db)}

@router.get("/sessions")
def list_sessions(
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == user.id
    ).order_by(ChatSession.updated_date.desc()).all()
    return {
        "status": "list",
        "count": len(sessions),
        "sessions": [_session_to_dict(s, db) for s in sessions],
    }
@router.get("/sessions/{session_id}")
def get_session(
    session_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    session = _validate_user_session(db=db, session_id=session_id, user_id=user.id)
    return {"status": "found", "session": _session_to_dict(session, db)}
@router.put("/sessions/{session_id}")
def update_session(
    session_id: str,
    payload: UpdateSessionRequest,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    session = _validate_user_session(db=db, session_id=session_id, user_id=user.id)
    if payload.title is not None:
        session.title = payload.title
    if payload.chatbot_id is not None:
        chatbot = db.query(Chatbot).filter(Chatbot.id == payload.chatbot_id).first()
        if not chatbot:
            raise HTTPException(status_code=404, detail="Chatbot not found")
        session.chatbot_id = chatbot.id
    db.commit()
    db.refresh(session)
    return {"status": "updated", "session": _session_to_dict(session, db)}

@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    session = _validate_user_session(db=db, session_id=session_id, user_id=user.id)
    db.delete(session)
    db.commit()
    return {"status": "deleted", "session_id": session_id}

@router.get("/sessions/{session_id}/messages")
def list_messages(
    session_id: str,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    _validate_user_session(db=db, session_id=session_id, user_id=user.id)
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
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    session = _validate_user_session(db=db, session_id=session_id, user_id=user.id)
    chatbot = _validate_chatbot_access(db=db, chatbot_id=chatbot_id, user_id=user.id)
    _check_daily_limit(user)
    # 1. Save user message
    user_msg = ChatMessage(
        session_id=session.id,
        user_id=user.id,
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
    ][-chatbot.chain_config.get("last_k_message_pairs", 3):]
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
    # 5. Update session chatbot_id and timestamp
    session.chatbot_id = chatbot.id
    session.updated_date = datetime.utcnow()
    # 6. Increment daily usage
    user.messages_used_today += 1
    db.commit()
    db.refresh(user_msg)
    db.refresh(ai_msg)
    return {
        "status": "ok",
        "user_message": _message_to_dict(user_msg),
        "ai_message": _message_to_dict(ai_msg),
    }