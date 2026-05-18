## Overview 

this one to make most of the Admin API and Endpoints 

make the Basics of the Document store and Implementing Database query to CRUD

1. admin.py

 use `extras` if `counting` is needed
 to_dict(store, extras=store_counts(store, db))
 to_dict(store)

 `store` (knowledge base) — needs store_counts(store, db) anywhere you return a store with `db`

 and `loader` — needs loader_counts(loader, db) anywhere you return a `loader`

 `store`
create_knowledge_base   → to_dict(store, extras=store_counts(store, db))
 list_knowledge_bases    → to_dict(store, extras=store_counts(store, db))
 get_knowledge_base      → to_dict(store, extras=store_counts(store, db))
 update_knowledge_base   → to_dict(store, extras=store_counts(store, db))
 set_vector_store        → to_dict(store, extras=store_counts(store, db))
 update_upsertion_config → to_dict(store, extras=store_counts(store, db))
 ingest_document         → to_dict(store, extras=store_counts(store, db))

`loader`

create_document_loader  → to_dict(loader, extras=loader_counts(loader, db))
list_document_loaders   → to_dict(loader, extras=loader_counts(loader, db))
load_document           → to_dict(loader, extras=loader_counts(loader, db))

Everything else — `doc, chunk, splitter, chatbot` — just to_dict(obj), no extras needed.

### endpoints added

Knowledge Bases
- `@router.post("/knowledge-bases")` Create Knowledge base
- `@router.get("/knowledge-bases")`  list all Knowledge bases + with filtter for the document store status `active , inactive ...`
- `@router.get("/knowledge_bases/{knowledge_base_id}")` list Knowledge base with id
- `@router.put("/knowledge_bases/{knowledge_base_id}")` Update basic knowledge base fields name description and updated_date is handeld automatic in models.py with _now
- `@router.delete("/knowledge_bases/{knowledge_base_id}")` Delete one knowledge base and all related rows by cascade.
- `@router.get("/knowledge_bases/{knowledge_base_id}/status")` Get Knowledge base status by id

knowledge bases endpoints almost done may add later