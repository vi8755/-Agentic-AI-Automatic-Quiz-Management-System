import re


def clean_text(text: str) -> str:
    """
    Clean extracted PDF text.
    """

    text = re.sub(r"\n+", "\n", text)

    text = re.sub(r"[ \t]+", " ", text)

    text = text.strip()

    return text

def chunk_text(
    text: str,
    chunk_size: int = 4000,
):
    """
    Split text into fixed-size chunks.
    """

    chunks = []

    start = 0

    while start < len(text):

        end = start + chunk_size

        chunks.append(
            text[start:end]
        )

        start = end

    return chunks
