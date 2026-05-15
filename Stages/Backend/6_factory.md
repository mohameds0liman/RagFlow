## Overview

From the fctory.py + admin.py
i make one component Process to later relate with Frontend it will be 

pipeline_factory - >loader_factory() + build_loader_pipeline()

admin.py API -> load_document(factory.build_loader_pipeline(config) + return)

1. Frontend: user selects "PyPDFLoader"
2. Frontend: GET /components/PyPDFLoader/schema?category=loader
3. Backend:  returns inputs schema
4. Frontend: renders fields dynamically from schema
5. User:     fills fields, clicks "Process"
6. Frontend: POST /kb_process/load_document  { loader_name, build_config }
7. Backend:  builds config → PipelineFactory → .load() → returns documents


Frontend Side (how it works)

1. GET schema  →  render a form field per input dynamically
2. User fills  →  store as dict  { field_name: value }
3. Press Process → POST with:
   {
     "loader_name": "PyPDFLoader",
     "build_config": { "file_path": "/uploads/doc.pdf" }
   }
4. Show response (document count, preview)