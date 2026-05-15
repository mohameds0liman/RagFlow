from fastapi import APIRouter ,UploadFile ,File ,HTTPException , Query

from app.components.registry import registry
from app.core.factory import PipelineFactory
from pydantic import BaseModel





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





############ TEST ############
@router.get("/components/categories")
def list_component_categories():
    return {"categories": registry.list_all_categories()}


# List dynamic fields for any component category
@router.get("/components")
def list_components(category: str = "loader"):
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