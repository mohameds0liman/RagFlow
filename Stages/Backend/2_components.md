## overview

init base schema with BaseComponent
init some components with this Class 

ABC is to make using docerator @abstractmethod possible 
so at the regitry later every component must have function build in its module 
so in the factory when build it return class object that require params 

ChatOllama(model=... , base_url=...,temperature=) the params of it defined by BaseComponent schema in base.py

## Components added
embedder -> OllamaEmbedding 
Chatmodels -> ChatOllama
chunker -> RecursiveCharacter text splitter
documentloader -> PyPDFLoader
vectorstore -> Chroma

