from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from .config import settings


embedding_model = None


def get_embedding_model():
    """
    Load the embedding model only once.
    """

    global embedding_model

    if embedding_model is None:
       

        embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

    return embedding_model


def search_knowledge(query: str):
    """
    Search the Chroma vector database.
    """

    embeddings = get_embedding_model()

    vectorstore = Chroma(
        persist_directory=settings.CHROMA_DB,
        embedding_function=embeddings
    )

    return vectorstore.similarity_search(query)