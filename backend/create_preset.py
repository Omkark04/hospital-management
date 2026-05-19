import os
from dotenv import load_dotenv
import cloudinary
import cloudinary.api

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

try:
    # Try to create the unsigned upload preset
    res = cloudinary.api.create_upload_preset(
        name="hms_unsigned_preset",
        unsigned=True,
        folder="products"
    )
    print("Successfully created upload preset:", res)
except Exception as e:
    # If it already exists, Cloudinary returns an error saying the preset name is already taken
    print("Notice/Error creating preset:", e)
