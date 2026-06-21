from app.components.registry import registry

from app.components.documentloaders.Pdf.PyPDFLoader   import PDFLoaderComponent
from app.components.documentloaders.Web.WebBase import WebLoaderComponent


from app.components.chunker.Recursive.Recursive import RecursiveTextSplitter

from app.components.embedder.OllamaEmbedding.OllamaEmbedding  import OllamaEmbeddingComponent

from app.components.vectorstores.Chroma.Chroma  import ChromaVectorStoreComponent

from app.components.Chatmodels.ChatOllama.ChatOllama import ChatModelOllama

from app.components.record_manager.langchainrecordmanager.langchain_record_manager import LangChainRecordManagerComponent

# from app.components.chain.RetrievalQAChain.RetrievalQAChain import RetrievalQAChainComponent
from app.components.chain.ConversationalRetrievalChain.ConversationalRetrievalChain import ConversationalRetrievalChainComponent


# from app.components.memory.BufferMemory.BufferMemory import BufferMemoryComponent
# from app.components.memory.BufferWindowMemory.BufferWindowMemory import BufferWindowMemoryComponent


def register_all():
    
    registry.register(PDFLoaderComponent)
    registry.register(WebLoaderComponent)


    registry.register(RecursiveTextSplitter)



    registry.register(OllamaEmbeddingComponent)



    registry.register(ChromaVectorStoreComponent)



    registry.register(ChatModelOllama)



    registry.register(LangChainRecordManagerComponent)



    # registry.register(RetrievalQAChainComponent)
    registry.register(ConversationalRetrievalChainComponent)


    # registry.register(BufferMemoryComponent)
    # registry.register(BufferWindowMemoryComponent)