from langchain.chains.retrieval_qa.base import RetrievalQA
from app.components.base import BaseComponent, InputParam


class RetrievalQAChainComponent(BaseComponent):
    name = "RetrievalQAChain"
    category = "chain"
    inputs = [
        InputParam(name="llm", type="chat_model", required=True, description="Language model to use"),
        InputParam(name="retriever", type="vector_store", required=True, description="Vector store retriever"),
        InputParam(name="chain_type", type="str", default="stuff", description="Chain type: stuff, map_reduce, refine, map_rerank"),
        InputParam(name="k", type="int", default=4, description="Number of documents to retrieve"),
        InputParam(name="verbose", type="bool", default=False),
    ]
    def build(self, config: dict):
        llm = config["llm"]
        retriever = config["retriever"]
        chain_type = config.get("chain_type", "stuff")
        k = config.get("k", 4)
        verbose = config.get("verbose", False)
        retriever.search_kwargs = {"k": k}
        return RetrievalQA.from_chain_type(
            llm=llm,
            retriever=retriever,
            chain_type=chain_type,
            verbose=verbose,
        )
    
