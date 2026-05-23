from app.components.registry import registry
from langchain_community.docstore.document import Document
from langchain_core.indexing.api import index as langchain_index
class PipelineFactory:

    # ### The Main Factories of The Rag Pipeline ###
    # def loader_factory(self , config:dict ={}) -> list[Document]:
    #     loader = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
    #     documents = loader.load()
    #     return documents

    # def chunker_factory(self,config:dict ={}) -> list[Document]:
    #     chunker = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
    #     chunks = chunker.split_documents(config["documents"])
    #     return chunks

    # def embedder_factory(self,config:dict ={}):
    #     embedder = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
    #     # embedding = embedder.embed_documents(config["text"])
    #     return embedder

    # def vector_store_factory(self,config:dict ={}):
    #     vector_store = registry.build(category=config["category"], name=config["name"], config=config["build_config"])
    #     return vector_store

    # def record_manager_factory(self,config:dict={}):
    #     record_manager=registry.build(category=config["category"] , name=config["name"], config=config["build_config"])
    #     return record_manager

####################################################################################
# Pipelines

    def build_loader_pipeline(self,Loader_config: dict) -> list[Document]:
        # Load documents
        loader = registry.build(
            category="loader",
            name=Loader_config["loader"]["name"],
            config=Loader_config["loader"]["build_config"])
        documents = loader.load()
        # Split into chunks
        chunker = registry.build(
            category="chunker",
            name=Loader_config["chunker"]["name"],
            config=Loader_config["chunker"]["build_config"])
        chunks = chunker.split_documents(documents)
        return chunks
        

    def build_upsert_pipeline(self,chunks ,upsert_config: dict) -> dict:
        
        # Build embedder
        embedder = registry.build(
            category="embedder",
            name=upsert_config["embedder"]["name"],
            config=upsert_config["embedder"]["build_config"])
        # Build + instantiate vector store (inject embedder)
        vs_def = registry.build(
            category="vector_store",
            name=upsert_config["vector_store"]["name"],
            config=upsert_config["vector_store"]["build_config"])
        vector_store = vs_def["cls"](embedding_function=embedder, **vs_def["kwargs"])
        # Build record manager + ensure schema exists
        record_manager = registry.build(
            category="record_manager",
            name=upsert_config["record_manager"]["name"],
            config=upsert_config["record_manager"]["build_config"])
        record_manager.create_schema()
        # Run LangChain incremental indexing
        result = langchain_index(
            docs_source=chunks,
            record_manager=record_manager,
            vector_store=vector_store,
            batch_size=100,
            cleanup="incremental", # cleanup: Literal['incremental', 'full', 'scoped_full']   i have to do it later
            source_id_key="source",
        )
        return result
    



    def build_chat_pipeline(self, chatbot):
        """Build a ConversationalRetrievalChain from a Chatbot ORM object.
        Supports both flat config format ({"name":..., "build_config":...})
        and nested format from DocumentStore ({"vector_store": {"name":..., ...}}).
        """
        # 1. LLM
        llm_cfg = chatbot.llm_config
        if not llm_cfg or "name" not in llm_cfg:
            raise ValueError("Chatbot has no valid llm_config")
        llm = registry.build(
            category="chat_model",
            name=llm_cfg["name"],
            config=llm_cfg.get("build_config", {}),
        )
        # 2. Embedder (get in the chat with store id stored in the chatbot )
        emb_cfg = chatbot.embedding_config
        emb_cfg = emb_cfg["embedder"]
        embedder = registry.build(
            category="embedder",
            name=emb_cfg["name"],
            config=emb_cfg.get("build_config", {}),
        )
        # 3. Vector Store → Retriever (get in the chat with store id stored in the chatbot )
        vs_cfg = chatbot.vector_store_config
        vs_cfg = vs_cfg["vector_store"]
        vs_def = registry.build(
            category="vector_store",
            name=vs_cfg["name"],
            config=vs_cfg.get("build_config", {}),
        )
        vector_store = vs_def["cls"](embedding_function=embedder, **vs_def["kwargs"])
        retriever = vector_store.as_retriever(
            search_kwargs={"k": vs_cfg.get("build_config", {}).get("top_k", 4)}  ## later will let admin set the top_k while creating chatbot
        )

            # llm=llm,
            # retriever=retriever,
            # chain_type=chain_type,
            # verbose=verbose,
        # chain_type  stuff - map_reduce - refine - map_rerank
        chain_cfg=chatbot.chain_config
        chain_conf={"llm":llm ,"retriever":retriever ,"chain_type": "stuff"}#chain_cfg["chain_type"] , chain_cfg["k"]
        # 4. Chain (no memory — endpoint passes chat_history via invoke)
        chain =registry.build(
            category="chain",
            name="ConversationalRetrievalChain",
            config=chain_conf
        )
        return chain