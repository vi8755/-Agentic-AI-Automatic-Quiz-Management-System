import uuid

from supabase import create_client, Client

from ..config import settings


SUPABASE_BUCKET = "quizgenai-pdfs"


def get_supabase_client() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY,
    )


def upload_pdf(
    file_content: bytes,
    original_filename: str,
    folder: str,
) -> str:
    """
    Upload a PDF to Supabase Storage
    and return its public URL.
    """

    supabase = get_supabase_client()

    extension = ".pdf"

    unique_filename = (
        f"{uuid.uuid4().hex}_{original_filename}"
    )

    storage_path = (
        f"{folder}/{unique_filename}"
    )

    supabase.storage.from_(
        SUPABASE_BUCKET
    ).upload(
        storage_path,
        file_content,
        {
            "content-type": "application/pdf",
            "upsert": "false",
        },
    )

    public_url = (
        supabase.storage
        .from_(SUPABASE_BUCKET)
        .get_public_url(storage_path)
    )

    return public_url