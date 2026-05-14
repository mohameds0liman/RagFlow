## overview

add the Next Endpoint for the Admin side in admin.py

```bash
admin//components/categories
list_component_categories
```
> List all categories with components 
```json
{
  "categories": [
    "loader",
    "chunker",
    "embedder",
    "vector_store"
  ]
}
```



___

```bash
admin/components
list_components(category)
```
> Takes category name (embedder , loader ....) and list all components with this category name 
> i will use loader

```json
{
  "PyPDFLoader": [
    {
      "name": "file_path",
      "type": "str",
      "default": null,
      "required": true,
      "description": "Absolute path to the PDF file"
    }
  ]
}
```

___


```bash
admin/components/{name}/schema
get_component_schema(name , category)
```
> takes name + category to return the Component Input Field Schema
```json
{
  "name": "PyPDFLoader",
  "category": "loader",
  "inputs": [
    {
      "name": "file_path",
      "type": "str",
      "default": null,
      "required": true,
      "description": "Absolute path to the PDF file"
    }
  ]
}
```

___

call the APIRouter in main.py and run the server with run.py in the project root

this will be the entry point for running the Backend server 

`uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)`


open the SWAGAR UI
`http://127.0.0.1:8000/docs`