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
    UpsertionRecord,
    Chatbot,
    User,
    DocumentStoreStatus,
    LoaderStatus,
    UploadedDocumentStatus,
    ChunkStatus,
)





router = APIRouter(prefix="/admin", tags=["Admin"])
#################################################################################
## Configs Schema
#################################################################################
class LoadDocumentRequest(BaseModel):
    loader_name: str
    build_config: dict

# Example of what frontend sends:
# {
#   "loader_name": "PyPDFLoader",
#   "build_config": { "file_path": "/uploads/doc.pdf" }
# }
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
# test
@router.post("/kb_Process/load_document")
def load_document(request:LoadDocumentRequest):
    try:
        config = {
            "category": "loader",
            "name": request.loader_name,
            "build_config": request.build_config
        }

        documents =factory.build_loader_pipeline(build_config=config)
            # Parse to JSON-serializable format for DB storage later
        return {
            "loader": request.loader_name,
            "document_count": len(documents),
            "documents": [
                {
                    "page_content": doc.page_content,
                    "metadata": doc.metadata
                }
                for doc in documents
            ]
        }

    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"Component not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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
        "loaders_count":   db.query(func.count(DocumentLoader.id)).filter(DocumentLoader.doc_id == store.id).scalar(),
        "chunks_count":    db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.store_id == store.id).scalar(),
        "chatbots_count":  db.query(func.count(Chatbot.id)).filter(Chatbot.document_store_id == store.id).scalar(),
    }


def loader_counts(loader, db: Session) -> dict:
    return {
        "chunks_count": db.query(func.count(DocumentChunk.id)).filter(DocumentChunk.loader_id == loader.id).scalar(),
    }

##############################
def _validate_store(db: Session, knowledge_base_id: str) -> DocumentStore:
    store = db.query(DocumentStore).filter(DocumentStore.id == knowledge_base_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return store


def _validate_loader(db: Session, loader_id: str) -> DocumentLoader:
    loader = db.query(DocumentLoader).filter(DocumentLoader.id == loader_id).first()
    if not loader:
        raise HTTPException(status_code=404, detail="Document loader not found")
    return loader


def _validate_chatbot(db: Session, chatbot_id: str) -> Chatbot:
    chatbot = db.query(Chatbot).filter(Chatbot.id == chatbot_id).first()
    if not chatbot:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot

########################################################################
# Main Endpoints of admin.py
########################################################################

@router.post("/knowledge-bases")
def create_knowledge_base(
    knowledge_base_name: str = Body(...),
    description: str = Body(""),
    # Admin id so when the admin open we give him his KB only
    created_by: str | None = Body(default=None),
    db:Session=Depends(get_db)
    ):
    if created_by:
        owner=db.query(User).filter(User.id==created_by).first()
        if not owner:
            raise HTTPException(status_code=404, detail="Creator user not found")

    store=DocumentStore(
       created_by=created_by,
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
        "status": "list",
        "count": len(stores),
        "knowledge_bases": [to_dict(store,extras=store_counts(store,db)) for store in stores],
        }

# Get one knowledge base details by id.
@router.get("/knowledge_bases/{knowledge_base_id}")
def get_knowledge_base(knowledge_base_id: str, db: Session = Depends(get_db)):
    store = _validate_store(db=db, knowledge_base_id=knowledge_base_id)
    return {"status": "found", "knowledge_base": to_dict(store)}