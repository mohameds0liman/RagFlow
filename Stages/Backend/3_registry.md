## overview

Make registry.py file with most main functions

at running this file it make a _store instance that will register all components of the system 
with the register() function 
it save it as the Following Schema

```json
{ "embedder" :  { "OllamaEmbedding": OllamaEmbeddingComponent } }
```
with Category `embedder` so i can use it to list with category
and its name  `OllamaEmbedding`
and class object `OllamaEmbeddingComponent` that have the build function that will return `OllamaEmbedding(model=.....)` later in the `factory.py` file to build a pipeline and excute it

## summary 

Registry module that stores component classes by category and name, so a factory can later look them up and instantiate them To excute Specific Pipeline.