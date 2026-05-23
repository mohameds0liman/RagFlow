from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from app.components.base import BaseComponent, InputParam


class ConversationChainComponent(BaseComponent):
    name = "ConversationChain"
    category = "chain"
    inputs = [
        InputParam(name="llm", type="chat_model", required=True, description="Language model to use"),
        InputParam(name="memory", type="memory", default="ConversationBufferMemory", description="Memory component"),
        InputParam(name="verbose", type="bool", default=False),
    ]
    def build(self, config: dict):
        llm = config["llm"]
        memory = config.get("memory")
        verbose = config.get("verbose", False)
        if memory is None:
            memory = ConversationBufferMemory()
        return ConversationChain(llm=llm, memory=memory, verbose=verbose)