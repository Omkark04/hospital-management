"""
apps/media/cloudinary_service.py — Cloudinary image upload/delete helpers.
"""
import cloudinary.uploader
import cloudinary


def upload_image(file, folder: str = "hms") -> dict:
    """
    Upload a file to Cloudinary.
    Returns: { public_id, secure_url, width, height }
    """
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
    )
    return {
        "public_id": result["public_id"],
        "secure_url": result["secure_url"],
        "width": result.get("width"),
        "height": result.get("height"),
    }


def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id. Returns True on success."""
    result = cloudinary.uploader.destroy(public_id)
    return result.get("result") == "ok"


def get_image_url(public_id: str, width: int = 400, height: int = 400) -> str:
    """Generate a transformed Cloudinary URL."""
    return cloudinary.CloudinaryImage(public_id).build_url(
        width=width,
        height=height,
        crop="fill",
        quality="auto",
        fetch_format="auto",
    )
