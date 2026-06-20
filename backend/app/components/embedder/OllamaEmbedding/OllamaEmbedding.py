from app.components.base import BaseComponent, InputParam
from langchain_ollama import OllamaEmbeddings

class OllamaEmbeddingComponent(BaseComponent):
    name = "OllamaEmbedding"
    category="embedder"
    icon="ollama.svg"
    inputs = [
        InputParam(name="base_url",   type="str", default="http://localhost:11434"),
        InputParam(name="model", type="str", default="nomic-embed-text"),
    ]

    def build(self, config: dict):
        return OllamaEmbeddings(
            base_url=config["base_url"],
            model=config["model"],
        )