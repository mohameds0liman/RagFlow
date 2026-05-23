from langchain.chains.conversational_retrieval.base import ConversationalRetrievalChain
from app.components.base import BaseComponent, InputParam


class ConversationalRetrievalChainComponent(BaseComponent):
    name = "ConversationalRetrievalChain"
    category = "chain"
    inputs = [
        InputParam(name="llm",          type="chat_model",    required=True,  description="Language model to use"),
        InputParam(name="retriever",     type="vector_store",  required=True,  description="Vector store retriever"),
        InputParam(name="chain_type",    type="str",           default="stuff", description="Chain type: stuff, map_reduce, refine, map_rerank"),
        InputParam(name="k",             type="int",           default=4,       description="Number of documents to retrieve"),
        InputParam(name="combine_docs_chain_kwargs", type="dict", default={},description="Extra kwargs for load_qa_chain (e.g. custom prompt)"),
        # InputParam(name="verbose",       type="bool",          default=False),
        # InputParam(name="return_source_documents", type="bool", default=True,  description="Include source documents in output"),
        # InputParam(name="return_generated_question", type="bool", default=False, description="Include the rewritten standalone question in output"),
    ]

    def build(self, config: dict):
        llm           = config["llm"]
        retriever     = config["retriever"]
        chain_type    = config.get("chain_type", "stuff")
        k             = config.get("k", 4)
        verbose       = config.get("verbose", False)
        return_source = config.get("return_source_documents", True)
        return_question = config.get("return_generated_question", False)

        combine_docs_chain_kwargs = config.get("combine_docs_chain_kwargs", {})

        retriever.search_kwargs = {"k": k}

        return ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=retriever,
            chain_type=chain_type,
            verbose=verbose,
            return_source_documents=return_source,
            return_generated_question=return_question,
            combine_docs_chain_kwargs=combine_docs_chain_kwargs,
        )