from langchain_core.tools import tool

from .rag import search_knowledge



@tool
def knowledge_search(question:str):
    """
    Search information from documents.
    """

    return search_knowledge(question)