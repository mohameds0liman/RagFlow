from fastapi import APIRouter ,UploadFile ,File ,HTTPException , Query

from app.components.registry import registry







router = APIRouter(prefix="/admin", tags=["Admin"])



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