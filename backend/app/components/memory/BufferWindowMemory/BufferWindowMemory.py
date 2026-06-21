from app.components.base import BaseComponent, InputParam
from langchain.memory import ConversationBufferWindowMemory


class BufferWindowMemoryComponent(BaseComponent):
    name = "ConversationBufferWindowMemory"
    category = "memory"
    icon = "memory.svg"
    inputs = [
        InputParam(name="k", type="int", default=10, description="Number of past exchanges to remember"),
        InputParam(name="return_messages", type="bool", default=True, description="Return as list of messages"),
        InputParam(name="human_prefix", type="str", default="Human", description="Prefix for human messages"),
        InputParam(name="ai_prefix", type="str", default="AI", description="Prefix for AI messages"),
    ]

    def build(self, config: dict):
        return ConversationBufferWindowMemory(
            k=config.get("k", 10),
            return_messages=config.get("return_messages", True),
            human_prefix=config.get("human_prefix", "Human"),
            ai_prefix=config.get("ai_prefix", "AI"),
        )