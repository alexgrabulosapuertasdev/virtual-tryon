import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from backend.core.config import UPLOADS_DIR, OUTPUTS_DIR
from backend.core.pipeline import pipeline, VirtualTryOnError
from backend.utils.image_utils import validate_image, preprocess_image, ImageValidationError

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok"}


@router.post("/tryon")
async def virtual_tryon(
    person_image: UploadFile = File(...),
    garment_image: UploadFile = File(...),
    garment_type: str = Form(default="top"),
):
    person_path = None
    garment_path = None

    try:
        # Guardar imagen persona
        person_ext = os.path.splitext(person_image.filename)[1].lower() or ".jpg"
        person_path = os.path.join(UPLOADS_DIR, f"person_{uuid.uuid4().hex}{person_ext}")
        person_content = await person_image.read()
        async with aiofiles.open(person_path, "wb") as f:
            await f.write(person_content)

        try:
            validate_image(person_path, len(person_content))
        except ImageValidationError as e:
            raise HTTPException(status_code=400, detail=f"Imagen de persona inválida: {str(e)}")

        # Guardar imagen prenda
        garment_ext = os.path.splitext(garment_image.filename)[1].lower() or ".jpg"
        garment_path = os.path.join(UPLOADS_DIR, f"garment_{uuid.uuid4().hex}{garment_ext}")
        garment_content = await garment_image.read()
        async with aiofiles.open(garment_path, "wb") as f:
            await f.write(garment_content)

        try:
            validate_image(garment_path, len(garment_content))
        except ImageValidationError as e:
            raise HTTPException(status_code=400, detail=f"Imagen de prenda inválida: {str(e)}")

        # Preprocesar
        person_path = preprocess_image(person_path)
        garment_path = preprocess_image(garment_path)

        # Validar tipo de prenda
        if garment_type not in ("top", "bottom", "dress"):
            garment_type = "top"

        # Ejecutar pipeline
        try:
            result_path = pipeline.run(person_path, garment_path, garment_type)
        except VirtualTryOnError as e:
            raise HTTPException(status_code=502, detail=f"Error en el modelo de IA: {str(e)}")

        result_filename = os.path.basename(result_path)
        return JSONResponse(content={
            "status": "success",
            "result_url": f"/api/result/{result_filename}"
        })

    finally:
        for path in [person_path, garment_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass


@router.get("/result/{filename}")
async def get_result(filename: str):
    filename = os.path.basename(filename)
    file_path = os.path.join(OUTPUTS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resultado no encontrado.")
    return FileResponse(file_path, media_type="image/jpeg")
