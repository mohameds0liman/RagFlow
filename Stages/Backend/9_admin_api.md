## Overview 
this one to make most of the Admin API and Endpoints 
make the Basics of the Document store and Implementing Database query to CRUD
## admin.py
 use `extras` if `counting` is needed
 to_dict(store, extras=store_counts(store, db))
 to_dict(store)
 `store` (knowledge base) — needs store_counts(store, db) anywhere you return a store with `db`
 and `loader` — needs loader_counts(loader, db) anywhere you return a `loader`
 `store`
 create_knowledge_base   → to_dict(store, extras=store_counts(store, db))
 list_knowledge_bases    → to_dict(store, extras=store_counts(store, db))
 update_knowledge_base   → to_dict(store, extras=store_counts(store, db))
 set_vector_store        → to_dict(store, extras=store_counts(store, db))
 update_upsertion_config → to_dict(store, extras=store_counts(store, db))
 ingest_document         → to_dict(store, extras=store_counts(store, db))
`loader`
create_document_loader  → to_dict(loader, extras=loader_counts(loader, db))
list_document_loaders   → to_dict(loader, extras=loader_counts(loader, db))
load_document           → to_dict(loader, extras=loader_counts(loader, db))
Everything else — `doc, chunk, splitter, chatbot` — just to_dict(obj), no extras needed.
---
## Component Registry Endpoints
these are for the frontend to discover available components (loaders, chunkers, embedders, vector stores)
`GET /components/categories`
list_component_categories → return all categories
`GET /components?category=loader`
list_components(category) → return all components of that category
`GET /components/{name}/schema?category=loader`
get_component_schema(name, category) → return the input schema of the component
---
## Knowledge Bases (Document Store CRUD)
all prefixed with `/admin`
`POST /knowledge-bases`
create_knowledge_base(name, description, created_by) → create a new KB
extras: store_counts
`GET /knowledge-bases?status=active`
list_knowledge_bases(status) → list all KBs, optional filter by status
extras: store_counts
`PUT /knowledge_bases/{knowledge_base_id}`
update_knowledge_base(id, payload) → update name, description, status
extras: store_counts
`DELETE /knowledge_bases/{knowledge_base_id}`
delete_knowledge_base(id) → delete KB and cascade all related rows
---
## Upsertion Configuration
`POST /knowledge_bases/{knowledge_base_id}/config`
save_upsertion_config(id, config) → save embedder + vector store + record manager config
stores in upsert_config_snapshot + individual columns
extras: store_counts
`POST /knowledge_bases/{knowledge_base_id}/upsert`
trigger_upsert(id, doc_id) → embed pending chunks of that doc into vector store
marks chunks as embedded

`PUT /knowledge_bases/{knowledge_base_id}/config`
update_upsertion_config(id, body) → update existing upsertion config
same request body as POST
extras: store_counts

---
## Uploaded Documents
`POST /knowledge_bases/{knowledge_base_id}/upload`
upload_document(id, file) → upload file to disk, create UploadedDocument row
extras: none
`GET /knowledge_bases/{knowledge_base_id}/documents`
list_uploaded_documents(id) → list all uploaded docs in this KB
extras: none
`DELETE /knowledge_bases/{knowledge_base_id}/documents/{doc_id}`
delete_uploaded_document(kb_id, doc_id) → delete file from disk + row
---
## Ingestion (Load + Chunk)
`POST /knowledge_bases/{knowledge_base_id}/ingest_document`
ingest_document(id, doc_id, loader_name, chunker_name, configs) →
creates DocumentLoader + DocumentSplitter rows,
runs factory pipeline to produce chunks, saves them
extras: none
---
## Chunks CRUD
`GET /knowledge_bases/{knowledge_base_id}/chunks?doc_id={doc_id}`
list_chunks(kb_id, doc_id) → list all chunks of a document ordered by chunk_no
`GET /knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}`
get_chunk(kb_id, chunk_id) → get a single chunk by id
`PUT /knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}`
update_chunk(kb_id, chunk_id, content, meta_data) → edit the page_content and meta_data
`DELETE /knowledge_bases/{knowledge_base_id}/chunks/{chunk_id}`
delete_chunk(kb_id, chunk_id) → delete a single chunk
`POST /knowledge_bases/{knowledge_base_id}/chunks?doc_id={doc_id}`
add_chunk(kb_id, doc_id, content, meta_data) → add a new chunk at the end of the doc's chunk list


## db shema 

made some changes for it -> delete what is not neccessary and add some columns and change some names and relations

## factory 

add Pipelines
`build_loader_pipeline`  - `build_upsert_pipeline`
and Neglect the Factories and use the registry directlly

## bootstrap
add new component record manager

## fix some bugs in the components 

## the Full flow is working from the Uploading to the upserting



#### add put endpoint to update the Upsertion config  `@router.put("/knowledge_bases/{knowledge_base_id}/config")`
#### add get endpoint to get some information of the Knowledge base `@router.get("/knowledge_bases/{knowledge_base_id}/status")`
#### add get endpoint as a `Dashboard` and will updated later `@router.get("/dashboard/stats")`
