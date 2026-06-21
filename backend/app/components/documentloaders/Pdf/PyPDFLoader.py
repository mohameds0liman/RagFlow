from app.components.base import BaseComponent, InputParam
from langchain_community.document_loaders import PyPDFLoader

from langchain_community.document_loaders import WebBaseLoader

class PDFLoaderComponent(BaseComponent):
    name = "PyPDFLoader"
    category="loader"
    icon = "pdf.svg"
    inputs = [
        InputParam(name="file_path", type="str", required=True,
                   description="Absolute path to the PDF file"),
    ]

    def build(self, config: dict):
        return PyPDFLoader(file_path=config["file_path"])