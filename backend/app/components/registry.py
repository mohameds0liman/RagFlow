from app.components.base import BaseComponent

class ComponentRegistry:
    """
    A singleton phonebook of all available components.
    used later in the factory.py to build the pipeline and excute it 
    """

    _instance = None  # holds the one and only instance

    def __new__(cls):
        # First call → create the instance
        # Every call after → return the same one
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._store = {}  # { "embedder" :  { "OllamaEmbedding": OllamaEmbeddingComponent } }
        return cls._instance

    # ------------------------------------------------------------------
    # Called at startup (bootstrap.py) to register a Component
    # ------------------------------------------------------------------

    def register(self, component: type[BaseComponent]) -> None:

        category=component.category
        if category not in self._store:
            self._store[category] = {}

        self._store[category][component.name] = component #--> { "embedder" :  { "OllamaEmbedding": OllamaEmbeddingComponent } }





    def build(self, category: str, name: str, config: dict):
        return self._store[category][name]().build(config)       

    # ------------------------------------------------------------------
    # Called by admin API → GET /components
    # ------------------------------------------------------------------

    def list_by_category(self, category: str) -> dict:
        if category not in self._store:
            raise KeyError(f"Unknown category: {category}")
        return {
            name: [p.model_dump() for p in component.inputs]
            for name, component in self._store[category].items()
        }

    def get_component_schema(self, category: str, name: str) -> dict:
        if category not in self._store:
            raise KeyError(f"Unknown category: {category}")
        if name not in self._store[category]:
            raise KeyError(f"Unknown component: {name}")
        component = self._store[category][name]
        return {
            "name": component.name,
            "category": component.category,
            "inputs": [p.model_dump() for p in component.inputs],
        }

    def list_all_categories(self) -> list[str]:
        return list(self._store.keys())
    
    
    ## For Test
    def list_all_components(self) -> dict:
        return {
            category: list(self._store[category].keys())
            for category in self._store
        }


# ------------------------------------------------------------------
# Global singleton
# ------------------------------------------------------------------
registry = ComponentRegistry()