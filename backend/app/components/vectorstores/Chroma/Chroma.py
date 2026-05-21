from app.components.base import BaseComponent, InputParam
from langchain_community.vectorstores.chroma import Chroma
class ChromaVectorStoreComponent(BaseComponent):
    name = "ChromaVectorStore"
    category="vector_store"
    inputs = [
        InputParam(name="collection_name", type="str", required=True),
        InputParam(name="persist_directory", type="str", default="./chroma_db", required=True),
        InputParam(name="embedding_function", type="str", default="OpenAIEmbedding", required=True)

    ]

    def build(self, config: dict):
        return {
            "cls": Chroma,
            "kwargs": {
                "collection_name": config["collection_name"],
                "persist_directory": config["persist_directory"],
            }
        }
    