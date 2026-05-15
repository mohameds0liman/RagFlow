from pydantic import BaseModel
from abc import ABC , abstractmethod
from typing import Any


class InputParam(BaseModel):

    name:str
    type:str
    default:Any =None
    required:bool =False
    description: str = ""


class BaseComponent(ABC):

    category:str = ""
    name :str =""
    icon:Any = ""
    inputs: list[InputParam] = []

    @abstractmethod
    def build(self,config:dict):
        """
        """
        ...
