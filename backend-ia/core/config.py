import os
from dotenv import load_dotenv

load_dotenv()

# Hugging Face
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_MODEL_ID = "yisol/IDM-VTON"  # Modelo IDM-VTON en Hugging Face

# Servidor
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))

# Imágenes
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", 10))
MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Rutas temporales
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMP_DIR = os.path.join(BASE_DIR, "temp")
UPLOADS_DIR = os.path.join(TEMP_DIR, "uploads")
OUTPUTS_DIR = os.path.join(TEMP_DIR, "outputs")

# Crear directorios si no existen
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Procesamiento
PROCESSING_TIMEOUT = int(os.getenv("PROCESSING_TIMEOUT", 120))
