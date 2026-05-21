from langchain.indexes import SQLRecordManager
from app.components.base import BaseComponent, InputParam

class LangChainRecordManagerComponent(BaseComponent):
    name = "LangChainRecordManager"
    category = "record_manager"
    inputs = [
        InputParam(name="namespace", type="str", required=True, description="e.g., chroma/my_collection"),
        InputParam(name="db_url", type="str", default="postgresql://user:pass@localhost:5432/ragflow", description="SQLAlchemy connection string"),
    ]
    def build(self, config: dict):
        record_manager = SQLRecordManager(
            namespace=config["namespace"],
            db_url=config["db_url"]
        )

        record_manager.create_schema()
        return record_manager