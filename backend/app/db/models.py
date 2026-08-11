"""
RagFlow Database Schema
SQLAlchemy ORM models
"""

import uuid
import enum
from datetime import datetime

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    Enum,
    JSON,
    ForeignKey,
    DateTime,
    event,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, Session


Base = declarative_base()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uuid():
    return str(uuid.uuid4())

def _now():
    return datetime.utcnow()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    admin = "admin"
    user  = "user"


class DocumentStoreStatus(str, enum.Enum):
    active      = "active"
    processing  = "processing"
    error       = "error"
    inactive    = "inactive"
    ready       = "ready"


class LoaderStatus(str, enum.Enum):
    pending     = "pending"
    processing  = "processing"
    completed   = "completed"
    error       = "error"


class UploadedDocumentStatus(str, enum.Enum):
    uploaded   = "uploaded"
    processing = "processing"
    ready      = "ready"
    error      = "error"


class ChunkStatus(str, enum.Enum):
    pending     = "pending"
    embedded    = "embedded"
    error       = "error"


class MessageRole(str, enum.Enum):
    human       = "human"
    ai          = "ai"
    system      = "system"



# ---------------------------------------------------------------------------
# user_kb_access
# ---------------------------------------------------------------------------

class UserAccess(Base):
    __tablename__ = "user_access"
    id         = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id    = Column(UUID(as_uuid=False), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    chatbot_id = Column(UUID(as_uuid=False), ForeignKey("chatbot.id", ondelete="CASCADE"), nullable=False, index=True)
    granted_at = Column(DateTime, nullable=False, default=_now)
    __table_args__ = (
        UniqueConstraint('user_id', 'chatbot_id', name='user_chatbot_access'),
    )
    def __repr__(self):
        return f"<UserAccess id={self.id} user_id={self.user_id} chatbot_id={self.chatbot_id}>"

# ---------------------------------------------------------------------------


class User(Base):
    __tablename__ = "user"

    id                        = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    username                  = Column(String(64),  nullable=False, unique=True, index=True)
    email                     = Column(String(255), nullable=False, unique=True, index=True)
    password_hash             = Column(String(255), nullable=False)
    role                      = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    is_active                 = Column(Boolean, nullable=False, default=True)
    is_verified               = Column(Boolean, nullable=False, default=False)
    email_verified_at         = Column(DateTime, nullable=True)
    refresh_token_hash        = Column(String(255), nullable=True)
    reset_password_token      = Column(String(255), nullable=True, index=True)
    reset_password_expires_at = Column(DateTime, nullable=True)
    last_login_at             = Column(DateTime, nullable=True)
    daily_message_limit        = Column(Integer, nullable=False, default=100)
    messages_used_today        = Column(Integer, nullable=False, default=0)
    limit_reset_date           = Column(DateTime, nullable=True)
    stt_enabled                = Column(Boolean, nullable=False, default=False)
    tts_enabled                = Column(Boolean, nullable=False, default=False)
    initial_access_granted     = Column(Boolean, nullable=False, default=False)
    granted_by                 = Column(UUID(as_uuid=False), ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    granted_at                 = Column(DateTime, nullable=True)
    created_at                = Column(DateTime, nullable=False, default=_now)
    updated_at                = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    document_stores = relationship("DocumentStore", back_populates="creator",    cascade="all, delete-orphan")
    chatbots        = relationship("Chatbot",        back_populates="creator",    cascade="all, delete-orphan")
    chat_sessions   = relationship("ChatSession",    back_populates="user",       cascade="all, delete-orphan")
    chat_messages   = relationship("ChatMessage",    back_populates="user")

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"


# ---------------------------------------------------------------------------
# document_store
# ---------------------------------------------------------------------------

class DocumentStore(Base):
    __tablename__ = "document_store"

    id                   = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    created_by           = Column(UUID(as_uuid=False), ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True)
    name                 = Column(String(255), nullable=False)
    description          = Column(Text, nullable=True)
    status               = Column(Enum(DocumentStoreStatus), nullable=False, default=DocumentStoreStatus.active)
    upsert_config_snapshot = Column(JSON, nullable=True)     # Snapshot of embedder/vector store config at time of ingestion
    vector_store_config  = Column(JSON, nullable=True)   # e.g. {"provider": "pgvector", "collection": "..."}
    embedding_config     = Column(JSON, nullable=True)   # e.g. {"provider": "openai", "model": "text-embedding-3-small"}
    record_manager_config = Column(JSON, nullable=True)  # LangChain record manager settings
    created_date         = Column(DateTime, nullable=False, default=_now)
    updated_date         = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    creator             = relationship("User",             back_populates="document_stores")
    uploaded_documents  = relationship("UploadedDocument", back_populates="document_store", cascade="all, delete-orphan")
    loaders             = relationship("DocumentLoader",   back_populates="document_store", cascade="all, delete-orphan")
    chunks              = relationship("DocumentChunk",    back_populates="document_store", cascade="all, delete-orphan")
    chatbots            = relationship("Chatbot",          back_populates="document_store")

    def __repr__(self):
        return f"<DocumentStore id={self.id} name={self.name}>"


# ---------------------------------------------------------------------------
# uploaded_document
# ---------------------------------------------------------------------------

class UploadedDocument(Base):
    __tablename__ = "uploaded_document"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    store_id     = Column(UUID(as_uuid=False), ForeignKey("document_store.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name    = Column(String(512),  nullable=False)
    file_path    = Column(String(1024), nullable=False)          # full path consumed by the loader
    file_type    = Column(String(16),   nullable=False)          # pdf | docx | txt | csv | html
    file_size_mb = Column(Float,        nullable=False)
    status       = Column(Enum(UploadedDocumentStatus), nullable=False, default=UploadedDocumentStatus.uploaded)
    created_date = Column(DateTime, nullable=False, default=_now)
    updated_date = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    document_store = relationship("DocumentStore",  back_populates="uploaded_documents")
    loader         = relationship("DocumentLoader", back_populates="document",
                                  primaryjoin="UploadedDocument.id == foreign(DocumentLoader.doc_id)",
                                  uselist=False)

    def __repr__(self):
        return f"<UploadedDocument id={self.id} file_name={self.file_name} status={self.status}>"


# ---------------------------------------------------------------------------
# document_loader
# ---------------------------------------------------------------------------

class DocumentLoader(Base):
    __tablename__ = "document_loader"

    id              = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    store_id          = Column(UUID(as_uuid=False), ForeignKey("document_store.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_id = Column(UUID(as_uuid=False), ForeignKey("uploaded_document.id", ondelete="SET NULL"), nullable=True, index=True)
    name         = Column(String(255), nullable=False)
    loader_type  = Column(String(64),  nullable=False)   # e.g. "pdf", "web", "s3", "docx", "csv"
    loader_config = Column(JSON, nullable=True)          # loader-specific options
    file_path    = Column(String(1024), nullable=True)   # file path, URL, bucket key, etc.
    status       = Column(Enum(LoaderStatus), nullable=False, default=LoaderStatus.pending)
    created_date = Column(DateTime, nullable=False, default=_now)
    updated_date = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    document_store  = relationship("DocumentStore",   back_populates="loaders")
    document        = relationship("UploadedDocument", back_populates="loader", foreign_keys=[doc_id])
    splitter        = relationship("DocumentSplitter", back_populates="loader", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<DocumentLoader id={self.id} type={self.loader_type} status={self.status}>"


# ---------------------------------------------------------------------------
# document_splitter  (1-to-1 with document_loader)
# ---------------------------------------------------------------------------

class DocumentSplitter(Base):
    __tablename__ = "document_splitter"

    id             = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    loader_id      = Column(UUID(as_uuid=False), ForeignKey("document_loader.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    splitter_type  = Column(String(64), nullable=False, default="recursive")  # recursive | sentence | token | markdown | html
    chunk_size     = Column(Integer, nullable=False, default=1000)
    chunk_overlap  = Column(Integer, nullable=False, default=200)
    extra_config   = Column(JSON, nullable=True)   # e.g. {"separators": ["\n\n", "\n"]}
    created_date   = Column(DateTime, nullable=False, default=_now)
    updated_date   = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    loader = relationship("DocumentLoader", back_populates="splitter")

    def __repr__(self):
        return f"<DocumentSplitter id={self.id} type={self.splitter_type} chunk_size={self.chunk_size}>"


# ---------------------------------------------------------------------------
# document_chunk
# ---------------------------------------------------------------------------

class DocumentChunk(Base):
    __tablename__ = "document_chunk"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    store_id     = Column(UUID(as_uuid=False), ForeignKey("document_store.id",   ondelete="CASCADE"), nullable=False, index=True)
    doc_id       = Column(UUID(as_uuid=False), ForeignKey("uploaded_document.id", ondelete="CASCADE"), nullable=True, index=True)
    page_content     = Column(Text, nullable=False)
    meta_data   = Column(JSON, nullable=True)   # source, page number, headings, etc.
    chunk_no         = Column(Integer, nullable=False, default=0)
    status       = Column(Enum(ChunkStatus), nullable=False, default=ChunkStatus.pending)
    created_date = Column(DateTime, nullable=False, default=_now)
    updated_date = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    document       = relationship("UploadedDocument", back_populates="chunks")
    document_store = relationship("DocumentStore",   back_populates="chunks")


    def __repr__(self):
        return f"<DocumentChunk id={self.id} chunk_no={self.chunk_no} status={self.status}>"




class ChatbotStatus(str, enum.Enum):
    active    = "active"
    inactive  = "inactive"

# ---------------------------------------------------------------------------
# chatbot
# ---------------------------------------------------------------------------

class Chatbot(Base):
    __tablename__ = "chatbot"

    id                  = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    created_by          = Column(UUID(as_uuid=False), ForeignKey("user.id", ondelete="SET NULL"), nullable=True, index=True)
    store_id            = Column(UUID(as_uuid=False), ForeignKey("document_store.id", ondelete="SET NULL"), nullable=True, index=True)
    name                = Column(String(255), nullable=False)
    description         = Column(Text, nullable=True)
    status              = Column(Enum(ChatbotStatus), nullable=False, default=ChatbotStatus.active)
    published_at        = Column(DateTime, nullable=True)

    # --- LangChain configs stored as JSON blobs ---
    # vector_store_config:  {"provider": "pgvector"|"chroma"|"pinecone", "collection": "...", "top_k": 4}
    vector_store_config = Column(JSON, nullable=True)
    embedding_config    = Column(JSON, nullable=True)
    # llm_config:           {"provider": "openai"|"anthropic"|"ollama", "model": "gpt-4o", "temperature": 0.0, "max_tokens": 1024}
    llm_config          = Column(JSON, nullable=True)

    # chain_config:         {"chain_type": "ConversationalRetrievalChain", "memory_type": "buffer"|"summary",
    #                         "prompt_template": "...", "return_source_documents": true}
    chain_config        = Column(JSON, nullable=True)

    memory_config       = Column(JSON, nullable=True)
    prompt_config       = Column(JSON, nullable=True)
    created_date = Column(DateTime, nullable=False, default=_now)
    updated_date = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    creator        = relationship("User",          back_populates="chatbots")
    document_store = relationship("DocumentStore", back_populates="chatbots")
    chat_sessions  = relationship("ChatSession",   back_populates="chatbot", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Chatbot id={self.id} name={self.name}>"



# ---------------------------------------------------------------------------
# chat_session
# ---------------------------------------------------------------------------

class ChatSession(Base):
    __tablename__ = "chat_session"

    id           = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    chatbot_id   = Column(UUID(as_uuid=False), ForeignKey("chatbot.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id      = Column(UUID(as_uuid=False), ForeignKey("user.id",    ondelete="CASCADE"), nullable=False, index=True)
    title        = Column(String(512), nullable=True)
    created_date = Column(DateTime, nullable=False, default=_now)
    updated_date = Column(DateTime, nullable=False, default=_now, onupdate=_now)

    # relationships
    chatbot  = relationship("Chatbot",     back_populates="chat_sessions")
    user     = relationship("User",        back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_date")

    def __repr__(self):
        return f"<ChatSession id={self.id} chatbot_id={self.chatbot_id}>"


# ---------------------------------------------------------------------------
# chat_message
# ---------------------------------------------------------------------------

class ChatMessage(Base):
    __tablename__ = "chat_message"

    id               = Column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    session_id       = Column(UUID(as_uuid=False), ForeignKey("chat_session.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id          = Column(UUID(as_uuid=False), ForeignKey("user.id",         ondelete="SET NULL"), nullable=True,  index=True)
    role             = Column(Enum(MessageRole), nullable=False)
    content          = Column(Text, nullable=False)
    source_documents = Column(JSON, nullable=True)   # retrieved chunks used to answer
    execution_time   = Column(Float, nullable=True)  # seconds the chain took
    created_date     = Column(DateTime, nullable=False, default=_now)

    # relationships
    session = relationship("ChatSession", back_populates="messages")
    user    = relationship("User",        back_populates="chat_messages")

    def __repr__(self):
        return f"<ChatMessage id={self.id} role={self.role}>"


# ---------------------------------------------------------------------------
# create_all  (convenience entry point)
# ---------------------------------------------------------------------------

def create_tables(database_url: str) -> None:
    """
    Create all tables in the target database.

    Usage:
        from models import create_tables
        create_tables("postgresql+psycopg2://user:pass@localhost/ragflow")
    """
    engine = create_engine(database_url, echo=True)
    Base.metadata.create_all(engine)
    print("All tables created successfully.")
    return engine


if __name__ == "__main__":

    DATABASE_URL = "postgresql://postgres:2463@localhost:5432/ragflow"

    engine = create_tables(DATABASE_URL)

    with Session(engine) as session:
        admin = User(
            username      = "admin",
            email         = "admin@gmail.com",
            password_hash = "admin123",    #or  m123456789
            role          = UserRole.admin,
            is_active     = True,
            is_verified   = True,
        )
        session.add(admin)
        session.flush()

        store = DocumentStore(
            created_by  = admin.id,
            name        = "Product Docs",
            description = "Internal product documentation knowledge base",
            embedding_config    = {"provider": "openai", "model": "text-embedding-3-small"},
            vector_store_config = {"provider": "pgvector", "collection": "product_docs"},
        )
        session.add(store)
        session.flush()

        uploaded_doc = UploadedDocument(
            store_id     = store.id,
            file_name    = "product_manual.pdf",
            file_path    = "/docs/product_manual.pdf",
            file_type    = "pdf",
            file_size_mb = 2.4,
            status       = UploadedDocumentStatus.uploaded,
        )
        session.add(uploaded_doc)
        session.flush()

        loader = DocumentLoader(
            store_id          = store.id,
            doc_id = uploaded_doc.id,
            name            = "Product PDF Loader",
            loader_type = "pdf",
            loader_config = {"extract_images": False},
            file_path = "/docs/product_manual.pdf",
            status      = LoaderStatus.pending,
        )
        session.add(loader)
        session.flush()

        splitter = DocumentSplitter(
            loader_id     = loader.id,
            splitter_type = "recursive",
            chunk_size    = 1000,
            chunk_overlap = 200,
            extra_config  = {"separators": ["\n\n", "\n", " "]},
        )
        session.add(splitter)
        session.flush()

        bot = Chatbot(
            created_by        = admin.id,
            store_id          = store.id,
            name              = "Support Bot",
            description       = "Answers product questions from the docs",
            status         = ChatbotStatus.active,
            vector_store_config = {"provider": "pgvector", "collection": "product_docs", "top_k": 4},
            llm_config          = {"provider": "openai", "model": "gpt-4o", "temperature": 0.0, "max_tokens": 1024},
            chain_config        = {
                "chain_type":             "ConversationalRetrievalChain",
                "memory_type":            "buffer",
                "return_source_documents": True,
                "prompt_template":        "You are a helpful assistant. Use the context below to answer.\n\n{context}\n\nQuestion: {question}",
            },
        )
        session.add(bot)
        session.flush()

        sess = ChatSession(
            chatbot_id = bot.id,
            user_id    = admin.id,
            title      = "First session",
        )
        session.add(sess)
        session.flush()

        session.add_all([
            ChatMessage(session_id=sess.id, user_id=admin.id, role=MessageRole.human, content="What is the return policy?"),
            ChatMessage(session_id=sess.id, user_id=None,     role=MessageRole.ai,    content="Our return policy allows returns within 30 days.", execution_time=0.84),
        ])

        session.commit()
        print("\nSample data inserted — all good!")
