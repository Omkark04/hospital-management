"""
Dropbox Storage Service — HMS Backend

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
    is_ok = bool(
        cfg.get('APP_KEY') and
        cfg.get('APP_SECRET') and
        cfg.get('REFRESH_TOKEN')
    )
    if not is_ok:
        print(f"[Dropbox Debug] Config keys found: {list(cfg.keys())}")
        print(f"[Dropbox Debug] APP_KEY present: {bool(cfg.get('APP_KEY'))}")
        print(f"[Dropbox Debug] APP_SECRET present: {bool(cfg.get('APP_SECRET'))}")
        print(f"[Dropbox Debug] REFRESH_TOKEN present: {bool(cfg.get('REFRESH_TOKEN'))}")
    return is_ok


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
        # The debug info is already printed in _is_configured() if missing
        return None

    try:
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
    except Exception as e:
        print(f'[Dropbox Error] Upload failed: {e}')
        return None


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
    Get a shareable link for a Dropbox file.
    Attempts to find an existing link first, then creates one if missing.
    """
    if not _is_configured():
        return None

    dbx = _get_client()
    try:
        import dropbox
        
        # 1. First, check if a link already exists (often works with 'sharing.read' scope)
        try:
            links = dbx.sharing_list_shared_links(path=dropbox_path)
            if links.links:
                return links.links[0].url
        except Exception as e:
            print(f'[Dropbox Debug] list_shared_links failed: {e}')

        # 2. Try to create a new link (requires 'sharing.write' scope)
        settings_obj = dropbox.sharing.SharedLinkSettings(
            requested_visibility=dropbox.sharing.RequestedVisibility.public
        )
        link_metadata = dbx.sharing_create_shared_link_with_settings(dropbox_path, settings_obj)
        return link_metadata.url

    except Exception as e:
        error_msg = str(e)
        if "sharing.write" in error_msg:
            print("────────────────────────────────────────────────────────────────────────")
            print("[Dropbox Critical] MISSING PERMISSIONS (SCOPES)")
            print("Your Dropbox App is missing the 'sharing.write' scope.")
            print("Please go to: https://www.dropbox.com/developers/apps")
            print("1. Select your app (ID: 6906771)")
            print("2. Go to 'Permissions' tab")
            print("3. Check 'sharing.write' (and 'files.content.write')")
            print("4. Click 'Submit' at the bottom")
            print("5. IMPORTANT: You MUST generate a NEW refresh token after changing scopes.")
            print("────────────────────────────────────────────────────────────────────────")
        else:
            print(f'[Dropbox] Shared link error: {e}')
        return None
