from io import BytesIO
from pathlib import Path
import re
import warnings

from PIL import Image, UnidentifiedImageError

ALLOWED_IMAGE_FORMATS = {
	"JPEG": ("image/jpeg", ".jpg"),
	"PNG": ("image/png", ".png"),
	"WEBP": ("image/webp", ".webp"),
}


def validate_image_content(content: bytes, declared_type: str) -> tuple[str, str]:
	try:
		with warnings.catch_warnings():
			warnings.simplefilter("error", Image.DecompressionBombWarning)
			with Image.open(BytesIO(content)) as image:
				image.verify()
				image_format = image.format
	except (
		UnidentifiedImageError,
		OSError,
		SyntaxError,
		Image.DecompressionBombWarning,
		Image.DecompressionBombError,
	) as error:
		raise ValueError("The uploaded file is not a valid image.") from error
	if image_format not in ALLOWED_IMAGE_FORMATS:
		raise ValueError("Only JPG, PNG or WebP images are supported.")
	content_type, suffix = ALLOWED_IMAGE_FORMATS[image_format]
	if declared_type != content_type:
		raise ValueError("The image content does not match its declared file type.")
	return content_type, suffix


def safe_original_filename(filename: str | None, fallback: str) -> str:
	name = Path(filename or fallback).name
	name = re.sub(r"[\x00-\x1f\x7f]", "", name).strip()
	return (name or fallback)[:255]
