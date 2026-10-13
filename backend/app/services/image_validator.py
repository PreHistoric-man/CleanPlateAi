import io
import math
from typing import Tuple, List, Optional
from PIL import Image, ImageFilter, ImageStat, UnidentifiedImageError
from app.models.inspection import ImageValidationResult

# Configurable Thresholds
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MIN_WIDTH = 200
MIN_HEIGHT = 200
MAX_DIMENSION = 6000
MIN_BRIGHTNESS_THRESHOLD = 30.0  # Mean luminance (0-255)
MAX_BRIGHTNESS_THRESHOLD = 240.0
BLUR_THRESHOLD = 25.0  # Variance of edges
ALLOWED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}


class ImageValidator:
    def __init__(
        self,
        max_file_size: int = MAX_FILE_SIZE_BYTES,
        min_width: int = MIN_WIDTH,
        min_height: int = MIN_HEIGHT,
        blur_threshold: float = BLUR_THRESHOLD,
        min_brightness: float = MIN_BRIGHTNESS_THRESHOLD,
        max_brightness: float = MAX_BRIGHTNESS_THRESHOLD,
    ):
        self.max_file_size = max_file_size
        self.min_width = min_width
        self.min_height = min_height
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness

    def validate_image_bytes(self, image_bytes: bytes) -> ImageValidationResult:
        feedback: List[str] = []
        file_size = len(image_bytes)

        if file_size == 0:
            return ImageValidationResult(
                is_valid=False,
                feedback=["Empty image file received. Please capture or select a valid kitchen photograph."],
                file_size_bytes=0,
            )

        if file_size > self.max_file_size:
            feedback.append(
                f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed size of {self.max_file_size / (1024*1024):.0f} MB."
            )

        try:
            with Image.open(io.BytesIO(image_bytes)) as img:
                img_format = (img.format or "").upper()
                width, height = img.size

                # Format check
                if img_format not in ALLOWED_FORMATS:
                    feedback.append(
                        f"Unsupported image format '{img_format}'. Supported formats: JPEG, PNG, WEBP."
                    )

                # Resolution check
                if width < self.min_width or height < self.min_height:
                    feedback.append(
                        f"Resolution too low ({width}x{height}px). Minimum required is {self.min_width}x{self.min_height}px for reliable visual assessment."
                    )

                if width > MAX_DIMENSION or height > MAX_DIMENSION:
                    feedback.append(
                        f"Dimensions exceed supported maximum of {MAX_DIMENSION}px."
                    )

                # Convert to grayscale for optical quality metrics
                gray_img = img.convert("L")
                stat = ImageStat.Stat(gray_img)
                brightness = stat.mean[0]

                # Brightness check
                if brightness < self.min_brightness:
                    feedback.append(
                        f"Insufficient lighting (luminance: {brightness:.1f}/255). The kitchen area is too dark for visible hygiene inspection. Please turn on lights or use flash."
                    )
                elif brightness > self.max_brightness:
                    feedback.append(
                        f"Overexposed photograph (luminance: {brightness:.1f}/255). Glare obscures kitchen surfaces. Adjust lighting angle."
                    )

                # Blur check: apply 3x3 Laplacian kernel to measure high-frequency edge variance
                # We crop a 10px margin to eliminate any JPEG compression border artifacts
                margin = min(10, width // 10, height // 10)
                crop_box = (margin, margin, width - margin, height - margin)
                interior_img = gray_img.crop(crop_box)

                # Laplacian kernel [0, 1, 0, 1, -4, 1, 0, 1, 0]
                laplacian = interior_img.filter(
                    ImageFilter.Kernel((3, 3), [0, 1, 0, 1, -4, 1, 0, 1, 0], scale=1, offset=128)
                )
                lap_stat = ImageStat.Stat(laplacian)
                blur_score = lap_stat.var[0] if lap_stat.var else 0.0

                if blur_score < self.blur_threshold:
                    feedback.append(
                        f"Image appears blurry or out-of-focus (sharpness index: {blur_score:.1f}, minimum required: {self.blur_threshold:.1f}). Please retake with a steady camera."
                    )

                is_valid = len(feedback) == 0

                return ImageValidationResult(
                    is_valid=is_valid,
                    feedback=feedback,
                    width=width,
                    height=height,
                    format=img_format,
                    file_size_bytes=file_size,
                    blur_score=round(blur_score, 2),
                    brightness_score=round(brightness, 2),
                )

        except UnidentifiedImageError:
            return ImageValidationResult(
                is_valid=False,
                feedback=["Invalid or corrupted image file. The file could not be recognized as a valid image."],
                file_size_bytes=file_size,
            )
        except Exception as e:
            return ImageValidationResult(
                is_valid=False,
                feedback=[f"Corrupted image stream: {str(e)}"],
                file_size_bytes=file_size,
            )


default_validator = ImageValidator()
