"""
Dropbox Storage Service — HMS Backend

Status: STUB — credentials not yet configured.
All methods check for credentials and return None gracefully in dev.

To activate:
1. Add Dropbox credentials to backend/.env
2. The upload/download/delete methods will work automatically.

Usage:
    from storage.dropbox_service import upload_file, download_file, delete_file, get_shared_link

    # Upload a file
    result = upload_file(file_bytes, '/hms/patients/patient_123_report.pdf')
    # result = {'path': '/hms/...', 'size': ..., 'name': '...'}

    # Get a temporary shareable link
    link = get_shared_link('/hms/patients/patient_123_report.pdf')

    # Delete a file
    delete_file('/hms/patients/patient_123_report.pdf')
"""

from django.conf import settings


def _is_configured():
    cfg = settings.DROPBOX_CONFIG
    return bool(
        cfg.get('APP_KEY') and
        cfg.get('APP_SECRET') and
        cfg.get('REFRESH_TOKEN')
    )


def _get_client():
    cfg = settings.DROPBOX_CONFIG
    import dropbox
    return dropbox.Dropbox(
        app_key=cfg['APP_KEY'],
        app_secret=cfg['APP_SECRET'],
        oauth2_refresh_token=cfg['REFRESH_TOKEN'],
    )


def upload_file(file_bytes: bytes, dropbox_path: str) -> dict | None:
    """
    Upload a file to Dropbox.

    Args:
        file_bytes: Raw bytes of the file to upload.
        dropbox_path: Full Dropbox path, e.g. '/hms/reports/lab_report.pdf'.

    Returns:
        dict with 'path', 'name', 'size', or None if not configured.
    """
    if not _is_configured():
        print('[Dropbox] Not configured — skipping upload (dev stub).')
        return None

    dbx = _get_client()
    import dropbox

    result = dbx.files_upload(
        file_bytes,
        dropbox_path,
        mode=dropbox.files.WriteMode.overwrite,
    )
    return {
        'path': result.path_display,
        'name': result.name,
        'size': result.size,
        'id': result.id,
    }


def download_file(dropbox_path: str) -> bytes | None:
    """
    Download a file from Dropbox.

    Args:
        dropbox_path: Full Dropbox path of the file.

    Returns:
        File bytes, or None if not configured or file not found.
    """
    if not _is_configured():
        print('[Dropbox] Not configured — skipping download (dev stub).')
        return None

    dbx = _get_client()
    try:
        _, response = dbx.files_download(dropbox_path)
        return response.content
    except Exception as e:
        print(f'[Dropbox] Download failed: {e}')
        return None


def delete_file(dropbox_path: str) -> bool:
    """
    Delete a file from Dropbox.

    Returns:
        True if deleted successfully, False otherwise.
    """
    if not _is_configured():
        print('[Dropbox] Not configured — skipping delete (dev stub).')
        return False

    dbx = _get_client()
    try:
        dbx.files_delete_v2(dropbox_path)
        return True
    except Exception as e:
        print(f'[Dropbox] Delete failed: {e}')
        return False


def get_shared_link(dropbox_path: str, expires_in_hours: int = 4) -> str | None:
    """
    Get a temporary shared link for a Dropbox file.

    Args:
        dropbox_path: Full Dropbox path of the file.
        expires_in_hours: Link expiry (note: Dropbox free tier links don't expire).

    Returns:
        Shared link URL string, or None if not configured.
    """
    if not _is_configured():
        return None

    dbx = _get_client()
    try:
        import dropbox
        settings_obj = dropbox.sharing.SharedLinkSettings(
            requested_visibility=dropbox.sharing.RequestedVisibility.public
        )
        link_metadata = dbx.sharing_create_shared_link_with_settings(dropbox_path, settings_obj)
        return link_metadata.url
    except dropbox.exceptions.ApiError as e:
        # Link already exists — get existing one
        try:
            links = dbx.sharing_list_shared_links(path=dropbox_path)
            if links.links:
                return links.links[0].url
        except Exception:
            pass
        print(f'[Dropbox] Shared link error: {e}')
        return None
