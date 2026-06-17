import os
import uuid
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from backend.core.config import OUTPUTS_DIR, HF_TOKEN

import mediapipe as mp


class VirtualTryOnError(Exception):
    pass


class MaskGenerator:
    """
    Genera máscaras inteligentes usando MediaPipe Pose (API Tasks).
    Detecta puntos clave del cuerpo y crea máscaras precisas
    según el tipo de prenda seleccionado.
    """

    def __init__(self):
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        import urllib.request
        import tempfile

        # Descargar modelo de pose si no existe
        model_path = os.path.join("models", "pose_landmarker.task")
        model_path = os.path.abspath(model_path)

        if not os.path.exists(model_path):
            print("[MediaPipe] Descargando modelo de pose...")
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"
            urllib.request.urlretrieve(url, model_path)
            print("[MediaPipe] Modelo descargado.")
        print(f"[MediaPipe] Usando modelo en: {model_path}")

        base_options = mp_python.BaseOptions(model_asset_path=model_path)
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            output_segmentation_masks=False,
        )
        self._detector = mp_vision.PoseLandmarker.create_from_options(options)

    def _get_keypoints(self, image: Image.Image) -> dict:
        """Detecta puntos clave del cuerpo con MediaPipe Tasks."""
        import mediapipe as mp
        from mediapipe.tasks.python import vision as mp_vision

        img_np = np.array(image)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_np)
        result = self._detector.detect(mp_image)

        if not result.pose_landmarks or len(result.pose_landmarks) == 0:
            return None

        h, w = img_np.shape[:2]
        landmarks = result.pose_landmarks[0]

        # Índices según MediaPipe Pose Landmarker
        indices = {
            "left_shoulder": 11,
            "right_shoulder": 12,
            "left_hip": 23,
            "right_hip": 24,
            "left_knee": 25,
            "right_knee": 26,
            "left_ankle": 27,
            "right_ankle": 28,
        }

        keypoints = {}
        for name, idx in indices.items():
            lm = landmarks[idx]
            keypoints[name] = (int(lm.x * w), int(lm.y * h))

        return keypoints

    def generate(self, image: Image.Image, garment_type: str) -> Image.Image:
        w, h = image.size
        keypoints = self._get_keypoints(image)

        mask = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(mask)

        if keypoints is None:
            print("[Mask] No se detectó pose, usando máscara por defecto.")
            if garment_type == "top":
                draw.rectangle([int(w*0.1), int(h*0.15), int(w*0.9), int(h*0.55)], fill=255)
            elif garment_type == "bottom":
                draw.rectangle([int(w*0.1), int(h*0.5), int(w*0.9), int(h*0.95)], fill=255)
            else:
                draw.rectangle([int(w*0.1), int(h*0.15), int(w*0.9), int(h*0.95)], fill=255)
            return mask

        ls = keypoints["left_shoulder"]
        rs = keypoints["right_shoulder"]
        lh = keypoints["left_hip"]
        rh = keypoints["right_hip"]
        lk = keypoints["left_knee"]
        rk = keypoints["right_knee"]
        la = keypoints["left_ankle"]
        ra = keypoints["right_ankle"]

        padding_x = int(w * 0.06)
        padding_y_top = int(h * 0.04)
        padding_y_bottom = int(h * 0.03)

        if garment_type == "top":
            x0 = min(ls[0], rs[0]) - padding_x
            y0 = min(ls[1], rs[1]) - padding_y_top
            x1 = max(ls[0], rs[0]) + padding_x
            y1 = max(lh[1], rh[1]) + padding_y_bottom
            draw.rectangle([x0, y0, x1, y1], fill=255)
        elif garment_type == "bottom":
            x0 = min(lh[0], rh[0]) - padding_x
            y0 = min(lh[1], rh[1]) - padding_y_top
            x1 = max(lh[0], rh[0]) + padding_x
            y1 = max(la[1], ra[1]) + padding_y_bottom
            draw.rectangle([x0, y0, x1, y1], fill=255)
        else:
            x0 = min(ls[0], rs[0]) - padding_x
            y0 = min(ls[1], rs[1]) - padding_y_top
            x1 = max(ls[0], rs[0]) + padding_x
            y1 = max(la[1], ra[1]) + padding_y_bottom
            draw.rectangle([x0, y0, x1, y1], fill=255)

        mask = mask.filter(ImageFilter.GaussianBlur(radius=8))
        mask = mask.point(lambda x: 255 if x > 127 else 0)
        print(f"[Mask] Máscara generada para tipo '{garment_type}' con pose detectada.")
        return mask

class ImagePostProcessor:
    """
    Postprocesado de la imagen resultante para mejorar calidad.
    Implementación propia basada en OpenCV.
    """

    @staticmethod
    def enhance(image: Image.Image, original_person: Image.Image, mask: Image.Image) -> Image.Image:
        """
        Mejora la imagen generada:
        - Ajuste de nitidez
        - Fusión suave de bordes con la imagen original
        - Corrección de brillo/contraste
        """
        # Convertir a numpy
        result_np = np.array(image).astype(np.float32)
        original_np = np.array(original_person.resize(image.size)).astype(np.float32)
        mask_np = np.array(mask.resize(image.size)).astype(np.float32) / 255.0
        mask_np = np.stack([mask_np] * 3, axis=-1)

        # Fusión suave en los bordes: mezclar original y resultado
        blended = result_np * mask_np + original_np * (1 - mask_np)

        # Nitidez con unsharp mask
        blended_uint8 = np.clip(blended, 0, 255).astype(np.uint8)
        blurred = cv2.GaussianBlur(blended_uint8, (0, 0), 3)
        sharpened = cv2.addWeighted(blended_uint8, 1.5, blurred, -0.5, 0)

        return Image.fromarray(sharpened)


class VirtualTryOnPipeline:
    """
    Pipeline principal de Virtual Try-On.
    - Generación de máscara inteligente con MediaPipe (implementación propia)
    - Generación de imagen con IDM-VTON via Hugging Face API
    - Postprocesado propio para mejora de calidad
    """

    def __init__(self):
        self._mask_generator = MaskGenerator()
        self._post_processor = ImagePostProcessor()
        self._client = None

    def _get_client(self):
        if self._client is None:
            from gradio_client import Client
            self._client = Client(
                "yisol/IDM-VTON",
                token=HF_TOKEN if HF_TOKEN else None
            )
        return self._client

    def run(self, person_image_path: str, garment_image_path: str, garment_type: str = "top") -> str:
        """
        Ejecuta el pipeline completo de Virtual Try-On.

        Args:
            person_image_path: Ruta imagen persona
            garment_image_path: Ruta imagen prenda
            garment_type: Tipo de prenda ("top", "bottom", "dress")

        Returns:
            Ruta a la imagen resultado
        """
        try:
            # 1. Cargar imágenes
            print(f"[Pipeline] Cargando imágenes (tipo prenda: {garment_type})...")
            person_image = Image.open(person_image_path).convert("RGB")
            garment_image = Image.open(garment_image_path).convert("RGB")

            # 2. Generar máscara inteligente con MediaPipe
            print("[Pipeline] Generando máscara con MediaPipe...")
            mask = self._mask_generator.generate(person_image, garment_type)

            # Guardar máscara temporalmente para enviarla al modelo
            mask_path = os.path.join(OUTPUTS_DIR, f"mask_{uuid.uuid4().hex}.png")
            mask.save(mask_path)

            # 3. Llamar a IDM-VTON
            print("[Pipeline] Enviando a IDM-VTON...")
            from gradio_client import Client, handle_file
            client = self._get_client()

            result = client.predict(
                dict={
                    "background": handle_file(person_image_path),
                    "layers": [handle_file(mask_path)],
                    "composite": None
                },
                garm_img=handle_file(garment_image_path),
                garment_des="lower body" if garment_type == "bottom" else "upper body",
                is_checked=True,
                is_checked_crop=False,
                denoise_steps=30,
                seed=42,
                api_name="/tryon"
            )
            result_image = Image.open(result[0]).convert("RGB")

            # 4. Cargar resultado
            result_image = Image.open(result[0]).convert("RGB")

            # 5. Postprocesado propio
            print("[Pipeline] Aplicando postprocesado...")
            enhanced = self._post_processor.enhance(result_image, person_image, mask)

            # 6. Guardar resultado final
            output_filename = f"result_{uuid.uuid4().hex}.jpg"
            output_path = os.path.join(OUTPUTS_DIR, output_filename)
            enhanced.save(output_path, "JPEG", quality=95)

            # Limpiar máscara temporal
            if os.path.exists(mask_path):
                os.remove(mask_path)

            print(f"[Pipeline] Resultado guardado: {output_path}")
            return output_path

        except Exception as e:
            raise VirtualTryOnError(f"Error en el pipeline: {str(e)}")


pipeline = VirtualTryOnPipeline()
