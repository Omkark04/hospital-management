"""
apps/media/dropbox_service.py — Dropbox document upload/fetch helpers.
"""
import dropbox
from django.conf import settings


def _get_client() -> dropbox.Dropbox:
    token = getattr(settings, 'DROPBOX_ACCESS_TOKEN', None)
    if not token:
        raise ValueError("DROPBOX_ACCESS_TOKEN is not configured.")
    return dropbox.Dropbox(token)


def upload_document(file_bytes: bytes, dest_path: str) -> str:
    """
    Upload a document to Dropbox.
    dest_path: e.g. "/patients/HMS-MUM-2025-00001/report.pdf"
    Returns: shareable URL string
    """
    dbx = _get_client()
    dbx.files_upload(file_bytes, dest_path, mode=dropbox.files.WriteMode('overwrite'))
    link_result = dbx.sharing_create_shared_link_with_settings(dest_path)
    return link_result.url


def get_file_link(dropbox_path: str) -> str:
    """Get a temporary direct download link for a Dropbox file."""
    dbx = _get_client()
    result = dbx.files_get_temporary_link(dropbox_path)
    return result.link
