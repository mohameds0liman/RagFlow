from langchain_ollama.chat_models import ChatOllama
from app.components.base import BaseComponent , InputParam

class ChatModelOllama(BaseComponent):

    category="chat_model"
    name="ChatOllama"
    
    inputs=[
        InputParam(name="base_url" , type="str" ,default="http://localhost:11434" ,required=True ,description="Model Base URL"),
        InputParam(name="model" , type="str" ,default="llama3.1:8b" , required=True , description="Model Name"),
        InputParam(name="temperature " , type="float" ,default=0),
    ]

    def build(self, config :dict):
        return ChatOllama(
            base_url=config["base_url"],
            model=config["model"],
            temperature=config["temperature"],
        )