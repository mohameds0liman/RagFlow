### Overview

the System made of 2 Layers (Backend -  Frontend)

I plan to use Singletone Design pattern to register The System Components in the Bootloader of the Backend Server

and use Factory to build the Pipeline using Json Configs In the API Requestes


### the project initialization structure

Rag_Flow/
├── .env
├── .env.example
├── .gitignore
├── requirements.txt
├── env/                          # Python virtual environment
├── Frontend/                     # (empty / TBD)
├── Stages/
│   ├── Backend/
│   │   └── Init.md
│   └── Frontend/
└── backend/
    ├── __init__.py
    └── app/
        ├── __init__.py
        ├── bootstrap.py
        ├── main.py
        ├── api/
        │   ├── Admin/
        │   └── User/
        ├── components/
        │   ├── Chatmodels/
        │   │   ├── ChatGroq/
        │   │   ├── ChatOllama/
        │   │   ├── ChatOpenAI/
        │   │   └── ChatOpenRouter/
        │   ├── chain/
        │   │   ├── ConversationalRetrievalQAChain/
        │   │   ├── ConversationChain/
        │   │   └── RetrievalQAChain/
        │   ├── chunker/
        │   │   ├── Recursive/
        │   │   └── Semantic/
        │   ├── documentloaders/
        │   │   ├── Pdf/
        │   │   └── Web/
        │   ├── embedder/
        │   │   ├── OllamaEmbedding/
        │   │   └── OpenAIEmbedding/
        │   ├── memory/
        │   │   ├── BufferMemory/
        │   │   ├── BufferWindowMemory/
        │   │   ├── ConversationSummaryBufferMemory/
        │   │   └── ConversationSummaryMemory/
        │   ├── record_manager/
        │   │   └── PostgresRecordManager/
        │   └── vectorstores/
        │       ├── Chroma/
        │       ├── Faiss/
        │       ├── Pinecone/
        │       ├── Qdrant/
        │       └── Supabase/
        ├── core/
        └── db/