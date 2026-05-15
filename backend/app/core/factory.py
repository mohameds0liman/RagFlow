from app.components.registry import registry
from langchain_community.docstore.document import Document

class PipelineFactory:

    ### The Main Factories of The Rag Pipeline ###
    def loader_factory(self , config:dict ={}) -> list[Document]:
        loader = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
        documents = loader.load()
        return documents

    def chunker_factory(self,config:dict ={}) -> list[Document]:
        config = self.config
        chunker = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
        chunks = chunker.split_documents(config["documents"])
        return chunks

    def embedder_factory(self,config:dict ={}):
        config = self.config
        embedder = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
        embedding = embedder.embed_documents(config["text"])
        return embedding

    def vector_store_factory(self,config:dict ={}):
        config = self.config
        vector_store = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
        return vector_store


####################################################################################
# Pipelines

    def build_loader_pipeline(self,build_config: dict) -> list[Document]:
        config = {
            "category": "loader",
            "name": build_config["name"],
            "build_config": build_config["build_config"]
        }
        documents=self.loader_factory(config)
        
        return documents
        
