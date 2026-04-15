"""
Cloudinary Storage Service — HMS Backend

Status: STUB — credentials not yet configured.
All methods check for credentials and return None gracefully in dev.

To activate:
1. Add Cloudinary credentials to backend/.env
2. The upload/delete methods will work automatically.

Usage:
    from storage.cloudinary_service import upload_image, delete_image, get_image_url

    # Upload a file (file-like object or file path)
    result = upload_image(file_object, folder='patients', public_id='patient_123')
    # result = {'public_id': '...', 'secure_url': '...', 'width': ..., 'height': ...}

    # Delete an uploaded image by public_id
    delete_image('patients/patient_123')

    # Build a transformed URL
    url = get_image_url('patients/patient_123', width=400, height=400)
"""

from django.conf import settings


def _is_configured():
    cfg = settings.CLOUDINARY_STORAGE
    return bool(cfg.get('CLOUD_NAME') and cfg.get('API_KEY') and cfg.get('API_SECRET'))


def _init_cloudinary():
    import cloudinary
    cfg = settings.CLOUDINARY_STORAGE
    cloudinary.config(
        cloud_name=cfg['CLOUD_NAME'],
        api_key=cfg['API_KEY'],
        api_secret=cfg['API_SECRET'],
        secure=True,
    )


def upload_image(file, folder: str = 'hms', public_id: str = None) -> dict | None:
    """
    Upload an image to Cloudinary.

    Args:
        file: File-like object, file path string, or URL.
        folder: Cloudinary folder to store the image in.
        public_id: Optional public ID (filename without extension).

    Returns:
        dict with 'public_id' and 'secure_url', or None if not configured.
    """
    if not _is_configured():
        print('[Cloudinary] Not configured — skipping upload (dev stub).')
        return None

    _init_cloudinary()
    import cloudinary.uploader

    options = {'folder': folder, 'resource_type': 'image'}
    if public_id:
        options['public_id'] = public_id

    result = cloudinary.uploader.upload(file, **options)
    return {
        'public_id': result.get('public_id'),
        'secure_url': result.get('secure_url'),
        'width': result.get('width'),
        'height': result.get('height'),
        'format': result.get('format'),
        'bytes': result.get('bytes'),
    }


def delete_image(public_id: str) -> bool:
    """
    Delete an image from Cloudinary by public_id.

    Returns:
        True if deleted, False otherwise.
    """
    if not _is_configured():
        print('[Cloudinary] Not configured — skipping delete (dev stub).')
        return False

    _init_cloudinary()
    import cloudinary.uploader

    result = cloudinary.uploader.destroy(public_id)
    return result.get('result') == 'ok'


def get_image_url(public_id: str, width: int = None, height: int = None, crop: str = 'fill') -> str | None:
    """
    Build a Cloudinary transformation URL for an image.

    Returns:
        Transformed image URL string, or None if not configured.
    """
    if not _is_configured():
        return None

    _init_cloudinary()
    import cloudinary
    from cloudinary import CloudinaryImage

    transformations = {}
    if width:
        transformations['width'] = width
    if height:
        transformations['height'] = height
    if transformations:
        transformations['crop'] = crop

    return CloudinaryImage(public_id).build_url(**transformations)
