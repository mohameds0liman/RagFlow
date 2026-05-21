from app.components.base import BaseComponent, InputParam
from langchain_text_splitters import RecursiveCharacterTextSplitter


class RecursiveTextSplitter(BaseComponent):

    category="chunker"
    name="RecursiveCharacterTextSplitter"
    inputs=[
        InputParam(name="chunk_size",type="int" , default=1200 , required=True ),
        InputParam(name="chunk_overlap",type="int" , default=200 , required=True ),
    ]

    def build(self, config):
        return RecursiveCharacterTextSplitter(
            chunk_size=config["chunk_size"],
            chunk_overlap=config["chunk_overlap"],
        )