import os
from PIL import Image
from backend.core.config import MAX_IMAGE_SIZE_BYTES, ALLOWED_EXTENSIONS


class ImageValidationError(Exception):
    pass


def validate_image(file_path: str, file_size: int) -> None:
    """
    Valida que un archivo sea una imagen válida y compatible.
    Lanza ImageValidationError si no cumple los requisitos.
    """
    # Validar tamaño
    if file_size > MAX_IMAGE_SIZE_BYTES:
        max_mb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
        raise ImageValidationError(
            f"La imagen supera el tamaño máximo permitido ({max_mb:.0f} MB)."
        )

    # Validar extensión
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ImageValidationError(
            f"Formato de imagen no compatible. Formatos permitidos: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validar que sea una imagen real con Pillow
    try:
        with Image.open(file_path) as img:
            img.verify()
    except Exception:
        raise ImageValidationError("El archivo no es una imagen válida o está corrupto.")


def preprocess_image(file_path: str, target_size: tuple = (768, 1024)) -> str:
    """
    Preprocesa la imagen: redimensiona manteniendo proporciones y convierte a RGB.
    Devuelve la ruta del archivo preprocesado (sobreescribe el original).
    """
    with Image.open(file_path) as img:
        # Convertir a RGB si es necesario (elimina canal alpha, etc.)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Redimensionar manteniendo proporción (fit dentro de target_size)
        img.thumbnail(target_size, Image.LANCZOS)

        # Guardar como JPEG optimizado
        output_path = os.path.splitext(file_path)[0] + ".jpg"
        img.save(output_path, "JPEG", quality=95)

    return output_path
