from app.components.base import BaseComponent, InputParam
from langchain_community.document_loaders import WebBaseLoader

class WebLoaderComponent(BaseComponent):
    name = "WebBaseLoader"
    category="loader"
    icon = "web.svg"
    inputs = [
        InputParam(name="web_path", type="str", required=True,
                   description="web path"),
    ]

    def build(self, config: dict):
        return WebBaseLoader(web_path=config["web_path"])
    

    