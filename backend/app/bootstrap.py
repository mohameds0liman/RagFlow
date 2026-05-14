from app.components.registry import registry

from app.components.documentloaders.Pdf.PyPDFLoader   import PDFLoaderComponent

from app.components.chunker.Recursive.Recursive import RecursiveCharacterTextSplitter

from app.components.embedder.OllamaEmbedding.OllamaEmbedding  import OllamaEmbeddingComponent

from app.components.vectorstores.Chroma.Chroma  import ChromaVectorStoreComponent

from app.components.Chatmodels.ChatOllama.ChatOllama import ChatOllama




def register_all():
    
    registry.register(PDFLoaderComponent)

    registry.register(RecursiveCharacterTextSplitter)

    registry.register(OllamaEmbeddingComponent)

    registry.register(ChromaVectorStoreComponent)

    registry.register(ChatOllama)

