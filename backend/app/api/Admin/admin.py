from fastapi import (
    APIRouter ,UploadFile ,File ,
    HTTPException ,
    Query , Depends ,Body
    )
from langchain_community.docstore.document import Document

from app.components.registry import registry
from app.core.factory import PipelineFactory
from pydantic import BaseModel
from typing import Any
from pathlib import Path
import os
import shutil
import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import(
    DocumentStore,
    UploadedDocument,
    DocumentLoader,
    DocumentSplitter,
    DocumentChunk,
    Chatbot,
    User,
    DocumentStoreStatus,
    LoaderStatus,
    UploadedDocumentStatus,
    ChunkStatus,
)
from app.api.auth import require_admin




router = APIRouter(prefix="/admin", tags=["Admin"])
#################################################################################
## Configs Schema
#################################################################################
class LoadDocumentRequest(BaseModel):
    loader_name: str
    chunker_name:str
    loader_config: dict
    chunker_config:dict
    doc_id: str 
# Example of what frontend sends:
# {
#   "loader_name": "PyPDFLoader",
#   "build_config": { "file_path": "/uploads/doc.pdf" }
# }

class UpsertionConfig(BaseModel):
    embedder_name: str
    vector_store_name: str
    record_manager_name: str
    embedder_config:dict
    vector_store_config:dict
    record_manager_config:dict

class UpdateChunkRequest(BaseModel):
    content: str
    meta_data:dict

#################################################################################





############ init ############
@router.get("/components/categories")
def list_component_categories():
    return {"categories": registry.list_all_categories()}


# List dynamic fields for any component category
@router.get("/components")
def list_components(category: str):
    try:
        return registry.list_by_category(category=category)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.get("/components/{name}/schema")
def get_component_schema(name: str, category: str = Query(...)):
    try:
        return registry.get_component_schema(category=category, name=name)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
######################################################################## 
# define class 

factory = PipelineFactory()

########################################################################
# helpers Functions
########################################################################    
def Document_to_dict(doc: Any) -> dict:
    if isinstance(doc, Document):
        return {"page_content": doc.page_content, "metadata": doc.metadata}
    if hasattr(doc, "page_content") and hasattr(doc, "metadata"):
        return {"page_content": doc.page_content, "metadata": doc.metadata}
    if isinstance(doc, dict):
        return {
            "page_content": doc.get("page_content", ""),
            "metadata": doc.get("metadata", {}),
        }
    return {"page_content": str(doc), "metadata": {}}

def to_dict(obj, extras: dict | None = None) -> dict:
    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name, None)
        if isinstance(value, Enum):
            result[column.name] = value.value
        elif isinstance(value, datetime):
            result[column.name] = value.isoformat()
        else:
            result[column.name] = value
    if extras:
        result.update(extras)
    return result


def store_counts(store, db: Session) -> dict:
    return {
        "documents_count": db.query(func.count(UploadedDocument.id)).filter(UploadedDocument.store_id == store.id).scalar(),
        "loaders_count":   db.query(func.count(DocumentLoader.id)).filter(DocumentLoader.store_id == store.id).scalar(),
        "chunks_count":    db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.store_id == store.id).scalar(),
        "chatbots_count":  db.query(func.count(Chatbot.id)).filter(Chatbot.store_id == store.id).scalar(),
    }


def loader_counts(doc_id, db: Session) -> dict:
    return {
        "chunks_count": db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.doc_id == doc_id).scalar(),
    }

##############################
def _validate_store(db: Session, knowledge_base_id: str) -> DocumentStore:
    store = db.query(DocumentStore).filter(DocumentStore.id == knowledge_base_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return store

def _validate_chatbot(db: Session, chatbot_id: str) -> Chatbot:
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

########################################################################
# test
@router.post("/kb_Process/load_document")
def load_document(request:LoadDocumentRequest , admin_user: User = Depends(require_admin),):
    try:
        config = {
            "category": "loader",
            "name": request.loader_name,
            "build_config": request.build_config
        }

        documents =factory.build_loader_pipeline(build_config=config)
            # Parse to JSON-serializable format for DB storage later
        documents_payload=[Document_to_dict(doc) for doc in documents ]
        return {
            "loader": request.loader_name,
            "document_count": len(documents),
            "documents":documents_payload
        }

    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"Component not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

########################################################################
# Main Endpoints of admin.py
########################################################################


############################
############################
#  admin document stores
############################
############################

############################
# Knowledge Bases
############################


@router.post("/knowledge-bases")
def create_knowledge_base(
    knowledge_base_name: str = Body(...),
    description: str = Body(""),
    admin_id: User = Depends(require_admin),
    db:Session=Depends(get_db)
    ):
    if admin_id:
        owner=db.query(User).filter(User.id==admin_id.id).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Creator user not found")

    store=DocumentStore(
       created_by=admin_id.id,
        name=knowledge_base_name,
        description=description,
        status=DocumentStoreStatus.active,
    )
    db.add(store)
    db.commit()
    db.refresh(store)
    return {"status": "created", "knowledge_base": to_dict(store)}

@router.get("/knowledge-bases")
def get_knowledge_bases(
    status: str | None = Query(default=None), # used for filtter
    db: Session = Depends(get_db),
    ):
        query=db.query(DocumentStore)
        
        if status:
            try:
                status_enum=DocumentStoreStatus(status)
            except ValueError:
                raise HTTPException(status_code=400 , detail="Invalid document store status")
            query=query.filter(DocumentStore.status==status_enum)
        stores=query.order_by(DocumentStore.created_date.desc()).all()
        return {
        "status": status or "all",
        "count": len(stores),
        "knowledge_bases": [to_dict(store,extras=store_counts(store,db)) for store in stores],
        }

# # Get one knowledge base details by id.
# @router.get("/knowledge_bases/{knowledge_base_id}")
# def get_knowledge_base(knowledge_base_id: str, db: Session = Depends(get_db)):
#     store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
#     return {"status": "found", "knowledge_base": to_dict(store)}


# Update basic knowledge base fields.
@router.put("/knowledge_bases/{knowledge_base_id}")
def update_knowledge_base(
    knowledge_base_id: str,
    payload: dict = Body(default_factory=dict),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)

    if "name" in payload and payload["name"] is not None:
        store.name = payload["name"]
    if "description" in payload:
        store.description = payload["description"]
    if "status" in payload and payload["status"] is not None:
        try:
            store.status = DocumentStoreStatus(payload["status"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid document store status")

    db.commit()
    db.refresh(store)
    return {"status": "updated", "knowledge_base": to_dict(store,extras=store_counts(store, db))}



# Delete one knowledge base and all related rows by cascade.
@router.delete("/knowledge_bases/{knowledge_base_id}")
def delete_knowledge_base_path(knowledge_base_id: str, admin_user: User = Depends(require_admin),db: Session = Depends(get_db)):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    db.delete(store)
    db.commit()
    return {"status": "deleted", "knowledge_base_id": knowledge_base_id}


# Return basic processing status for frontend badges.
@router.get("/knowledge_bases/{knowledge_base_id}/status")
def knowledge_base_status(knowledge_base_id: str, db: Session = Depends(get_db)):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    upserion_config_ready= bool(store.upsert_config_snapshot)
    vector_ready = bool(store.vector_store_config and store.embedding_config and store.record_manager_config)
    total_documents = db.query(func.count(UploadedDocument.id)).filter(UploadedDocument.store_id == store.id).scalar()
    total_chunks = db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.store_id == store.id).scalar()
    embedded_chunks = db.query(func.count(DocumentChunk.id)).filter(
        DocumentChunk.store_id == store.id,
        DocumentChunk.status == ChunkStatus.embedded,
    ).scalar()

    ## add more status Later
    return {
        "status": "ok",
        "knowledge_base_id": store.id,
        "upserion_config_ready":upserion_config_ready,
        "vector_store_configured": vector_ready,
        "document_store_status": store.status,
        "totals": {
            "documents": total_documents,
            "chunks": total_chunks,
            "embedded_chunks": embedded_chunks,
        },
    }

# #get KB status with KB id
# @router.get("/knowledge_bases/{knowledge_base_id}/status")
# def get_knowledge_base_status(knowledge_base_id: str, db: Session = Depends(get_db)):
#     query=db.query(DocumentStore).filter(DocumentStore.id==knowledge_base_id).first()

#     try:
#         status=query.status
#     except ValueError:
#         raise HTTPException(status_code=400 , detail="Invalid document store status")
#     return {"status" : status}

############################
# Set Config (Vector Store + Embedding + record manager)
############################

@router.post("/knowledge_bases/{knowledge_base_id}/config")
def create_upsertion_config(
    knowledge_base_id: str,
    request: UpsertionConfig,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    store.upsert_config_snapshot = {
        "embedder":       {"name": request.embedder_name,       "build_config": request.embedder_config},
        "vector_store":   {"name": request.vector_store_name,   "build_config": request.vector_store_config},
        "record_manager": {"name": request.record_manager_name, "build_config": request.record_manager_config},
    }

    store.embedding_config={
        "embedder":       {"name": request.embedder_name,       "build_config": request.embedder_config},
    }
    store.vector_store_config={
        "vector_store":   {"name": request.vector_store_name,   "build_config": request.vector_store_config},
    }
    store.record_manager_config={
        "record_manager": {"name": request.record_manager_name, "build_config": request.record_manager_config}
    }
    db.commit()
    db.refresh(store)
    return {"status": "config_saved", "knowledge_base": to_dict(store, extras=store_counts(store, db))}


@router.put("/knowledge_bases/{knowledge_base_id}/config")
def update_upsertion_config(
    knowledge_base_id: str,
    request: UpsertionConfig,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    store.upsert_config_snapshot = {
        "embedder":       {"name": request.embedder_name,       "build_config": request.embedder_config},
        "vector_store":   {"name": request.vector_store_name,   "build_config": request.vector_store_config},
        "record_manager": {"name": request.record_manager_name, "build_config": request.record_manager_config},
    }
    store.embedding_config = {
        "embedder": {"name": request.embedder_name, "build_config": request.embedder_config},
    }
    store.vector_store_config = {
        "vector_store": {"name": request.vector_store_name, "build_config": request.vector_store_config},
    }
    store.record_manager_config = {
        "record_manager": {"name": request.record_manager_name, "build_config": request.record_manager_config},
    }
    db.commit()
    db.refresh(store)
    return {"status": "config_updated", "knowledge_base": to_dict(store, extras=store_counts(store, db))}


@router.post("/knowledge_bases/{knowledge_base_id}/upsert")
def trigger_upsert(
    knowledge_base_id: str,
    doc_id: str = Body(...,examples=["doc_id_f2262c94-dd93-4c93-acc7-908a9faeefac"]),    # returned from ingest
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    if not store.upsert_config_snapshot:
        raise HTTPException(status_code=400, detail="No upsert config saved.")
    chunk_rows = db.query(DocumentChunk).filter(
        DocumentChunk.doc_id == doc_id,
        # DocumentChunk.status == ChunkStatus.pending,
    ).order_by(DocumentChunk.chunk_no).all()
    if not chunk_rows:
        raise HTTPException(status_code=400, detail="No chunks for this document.")
    chunks = [
        Document(page_content=r.page_content, metadata={**(r.meta_data or {}), "source": r.doc_id or r.id})
        for r in chunk_rows
    ]
    result = factory.build_upsert_pipeline(chunks=chunks, upsert_config=store.upsert_config_snapshot)
    for r in chunk_rows:
        r.status = ChunkStatus.embedded
    db.commit()
    return {"status": "upserted", "result": result}

# {
#   "embedder_name": "OllamaEmbedding",
#   "vector_store_name": "ChromaVectorStore",
#   "record_manager_name": "LangChainRecordManager",
#   "embedder_config": {"base_url":"http://localhost:11434" , "model":"nomic-embed-text"},
#   "vector_store_config": {"collection_name":"default" , "persist_directory":"./chroma_db"},
#   "record_manager_config": {"namespace":"chroma/my_collection" , "db_url" :"postgresql://postgres:2463@localhost:5432/ragflow"}
# }
############################
# Upload Document
############################
@router.post("/knowledge_bases/{knowledge_base_id}/upload")
def upload_document(
    knowledge_base_id: str,
    file: UploadFile = File(...),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    upload_dir = Path("uploads") / store.id
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / file.filename
    with open(dest, "wb") as f:
        f.write(file.file.read())
    ext = dest.suffix.lower().lstrip(".")
    doc = UploadedDocument(
        store_id=store.id,
        file_name=file.filename,
        file_path=str(dest),
        file_type=ext,
        file_size_mb=round(dest.stat().st_size / (1024 * 1024), 2),
        status=UploadedDocumentStatus.uploaded,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"status": "uploaded", "document": to_dict(doc)}

@router.get("/knowledge_bases/{knowledge_base_id}/documents")
def list_uploaded_documents(knowledge_base_id: str, db: Session = Depends(get_db)):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    docs = db.query(UploadedDocument).filter(
        UploadedDocument.store_id == store.id
    ).order_by(UploadedDocument.created_date.desc()).all()
    return {"documents": [to_dict(d) for d in docs]}


@router.delete("/knowledge_bases/{knowledge_base_id}/documents/{doc_id}")
def delete_uploaded_document(
    knowledge_base_id: str,
    doc_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    doc = db.query(UploadedDocument).filter(
        UploadedDocument.id == doc_id,
        UploadedDocument.store_id == store.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Uploaded document not found")
    
    # delete the physical file first
    if doc.file_path:
        fpath = Path(doc.file_path)
        if fpath.exists():
            fpath.unlink()
    
    db.delete(doc)
    db.commit()
    return {"status": "deleted", "document_id": doc_id}
############################
# Ingestion (load Document + Chunk)
############################

@router.post("/knowledge_bases/{knowledge_base_id}/ingest_document")
def ingest_document(
    knowledge_base_id: str,
    request: LoadDocumentRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    uploaded = db.query(UploadedDocument).filter(
        UploadedDocument.id == request.doc_id,
        UploadedDocument.store_id == store.id,
    ).first()
    if not uploaded:
        raise HTTPException(status_code=404, detail="Uploaded document not found")
    loader = DocumentLoader(
        store_id=store.id,
        doc_id=uploaded.id,
        name=uploaded.file_name,
        loader_type=request.loader_name,
        loader_config=request.loader_config,
        file_path=uploaded.file_path,
        status=LoaderStatus.processing,
    )
    db.add(loader)
    db.flush()
    splitter = DocumentSplitter(
        loader_id=loader.id, splitter_type=request.chunker_name,
        chunk_size=request.chunker_config.get("chunk_size", 1000),
        chunk_overlap=request.chunker_config.get("chunk_overlap", 200),
        extra_config={k: v for k, v in request.chunker_config.items()
                      if k not in ("chunk_size", "chunk_overlap")},
    )
    db.add(splitter)
    db.flush()
    loader_build_config = {**request.loader_config, "file_path": uploaded.file_path}
    chunks = factory.build_loader_pipeline({
        "loader":  {"name": request.loader_name,  "build_config": loader_build_config},
        "chunker": {"name": request.chunker_name, "build_config": request.chunker_config},
    })
    for i, c in enumerate(chunks):
        db.add(DocumentChunk(
            store_id=store.id, doc_id=uploaded.id,
            page_content=c.page_content, meta_data=c.metadata,
            chunk_no=i, status=ChunkStatus.pending,
        ))
    loader.status = LoaderStatus.completed
    uploaded.status = UploadedDocumentStatus.ready
    db.commit()
    return {"status": "ingested", "loader_id": loader.id ,"doc_id":uploaded.id, "chunks_count": len(chunks)}
# The File Path set with the Uplaoded document id
# {
#   "loader_name": "PyPDFLoader",
#   "chunker_name": "RecursiveCharacterTextSplitter",
#   "loader_config": {},
#   "chunker_config": {"chunk_size":500,"chunk_overlap":50},
#   "uploaded_document_id": "f2262c94-dd93-4c93-acc7-908a9faeefac"
# }


############################
# Edit Chunks
############################


##List All Chunks
@router.get("/knowledge_bases/{knowledge_base_id}/chunks")
def list_chunks(
    knowledge_base_id: str,
    doc_id: str = Query(...),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    rows = db.query(DocumentChunk).filter(
        DocumentChunk.doc_id == doc_id,
        DocumentChunk.store_id == store.id,
    ).order_by(DocumentChunk.chunk_no).all()
    return {"chunks": [to_dict(r) for r in rows], "count": len(rows)}

## on pressing The Chunk Get one Chunk with its id to edit
@router.get("/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}")
def get_chunk(
    knowledge_base_id: str,
    chunk_id: str,
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    row = db.query(DocumentChunk).filter(
        DocumentChunk.id == chunk_id,
        DocumentChunk.store_id == store.id,
    ).first()


    return {"chunk": to_dict(row)}

## we open the chunk now edit the content and on press save it update the chunk in DB
@router.put("/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}")
def updated_chunk(
    knowledge_base_id: str,
    chunk_id: str,
    request:UpdateChunkRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    row = db.query(DocumentChunk).filter(
        DocumentChunk.id == chunk_id,
        DocumentChunk.store_id == store.id,
    ).first()
    if request:
        row.page_content=request.content
        row.meta_data=request.meta_data
    else:
        raise HTTPException(status_code=400, detail="Can not save an empty Content")

    db.commit()
    db.refresh(row)
    return {"chunk": row}

@router.delete("/knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}")
def delete_chunk(
    knowledge_base_id: str,
    chunk_id: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    row = db.query(DocumentChunk).filter(
        DocumentChunk.id == chunk_id,
        DocumentChunk.store_id == store.id,
    ).first()

    db.delete(row)
    db.commit()
    return {"chunk": "Deleted"}

@router.post("/knowledge_bases/{knowledge_base_id}/chunks")
def add_chunk(
    knowledge_base_id: str,
    doc_id:str,
    request:UpdateChunkRequest,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    rows = db.query(DocumentChunk).filter(
        DocumentChunk.doc_id == doc_id,
        DocumentChunk.store_id == store.id,
    ).order_by(DocumentChunk.chunk_no).all()
    chunk_no=(len(rows))+1

    db.add(DocumentChunk(
        store_id=store.id, doc_id=doc_id,
        page_content=request.content, meta_data=request.meta_data,
        chunk_no=chunk_no, status=ChunkStatus.pending,
    ))
    db.commit()
    return {"chunk": "Added"}



########################
# Dashboard 
########################

@router.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    return {
        "knowledge_bases": db.query(func.count(DocumentStore.id)).scalar(),
        "documents":       db.query(func.count(UploadedDocument.id)).scalar(),
        "loaders":         db.query(func.count(DocumentLoader.id)).scalar(),
        "chunks":          db.query(func.count(DocumentChunk.id)).scalar(),
        "chatbots":        db.query(func.count(Chatbot.id)).scalar(),
    }