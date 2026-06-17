# Sistema de Virtual Try-On — TFG UNIR 2025/2026

Sistema de Virtual Try-On basado en visión por computador que permite visualizar cómo quedaría una prenda de vestir sobre una persona antes de realizar una compra. El sistema combina detección de pose con MediaPipe, generación de imágenes con IDM-VTON y postprocesado propio con OpenCV.

## ¿Qué hace el sistema?

1. El usuario sube una foto de una persona y una foto de una prenda
2. **MediaPipe Pose** analiza la postura de la persona y genera una máscara inteligente adaptada al tipo de prenda
3. La máscara y las imágenes se envían al modelo **IDM-VTON** via Hugging Face API
4. El resultado pasa por un **postprocesado propio** (fusión de bordes + mejora de nitidez con OpenCV)
5. El usuario recibe la imagen final con la prenda colocada sobre su cuerpo

## Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Microservicio IA   │
│   Angular       │     │   NestJS        │     │   FastAPI (Python)   │
└─────────────────┘     └─────────────────┘     └──────────────────────┘
                                                          │
                                              ┌───────────┴───────────┐
                                              │                       │
                                    ┌─────────────────┐   ┌─────────────────┐
                                    │   MediaPipe     │   │   IDM-VTON      │
                                    │   (local)       │   │   (HF API)      │
                                    └─────────────────┘   └─────────────────┘
```

## Estructura del proyecto

```
/
├── app/                          # Angular
│   ├── src/
│   │   ├── app/
│   │   │   └── components/
│   │   │       └── product-result/    # Componente principal de resultado
│   │   └── environments/
│   │       └── environment.ts         # Variables de entorno (API URL, etc.)
│   ├── angular.json
│   └── package.json
│
├── backend-api/                       # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   └── tryon/
│   │   │       ├── tryon.controller.ts   # Endpoints REST
│   │   │       └── tryon.service.ts      # Lógica de negocio
│   │   └── clients/
│   │       └── python-ai.client.ts       # Cliente HTTP hacia el microservicio IA
│   ├── test/                             # Tests unitarios (Jest)
│   └── package.json
│
├── backend-ia/                        # Microservicio IA — FastAPI (Python)
│   ├── backend/
│   │   ├── api/
│   │   │   └── routes.py              # Endpoints REST (tryon, result, health)
│   │   ├── core/
│   │   │   ├── config.py              # Configuración centralizada
│   │   │   └── pipeline.py            # Pipeline completo de IA
│   │   └── utils/
│   │       └── image_utils.py         # Validación y preprocesado de imágenes
│   ├── models/
│   │   └── pose_landmarker.task       # Modelo MediaPipe (local)
│   ├── temp/
│   │   ├── uploads/                   # Imágenes de entrada (temporales)
│   │   └── outputs/                   # Imágenes resultado
└── frontend                        # Landing page FastAPI
│   ├── static/
│   │   └── css/
│   │   │   └── style.css
│   │   └── js/
│   │   │   └── app.js
│   ├── templates/
│   │   └── index.html
└── main.py                        # Aplicación FastAPI
└── run.py                         # Script de arranque
└── requirements.txt
└── docker-compose.yml                 # Orquestación de los tres servicios
```

## Pipeline de IA

### Etapa 1 — Máscara inteligente con MediaPipe

Se utiliza **MediaPipe Pose Landmarker** para detectar los puntos clave del cuerpo (hombros, caderas, rodillas, tobillos) y generar una máscara adaptada al tipo de prenda:

- **Camiseta / chaqueta:** máscara entre hombros y caderas
- **Pantalón:** máscara entre caderas y tobillos
- **Vestido:** máscara entre hombros y tobillos

Los bordes se suavizan con un filtro gaussiano. Si no se detecta pose, se aplica una máscara por defecto basada en proporciones fijas.

### Etapa 2 — Generación con IDM-VTON

El modelo **IDM-VTON** recibe la imagen de la persona, la imagen de la prenda y la máscara generada. Utiliza modelos de difusión para generar una imagen realista de la persona vistiendo la prenda, preservando texturas, arrugas y detalles visuales.

Se accede al modelo via **Hugging Face API** con `gradio-client`. Esta decisión se tomó tras evaluar la ejecución local, descartada por incompatibilidad de la GPU AMD con CUDA y tiempos de inferencia inviables en CPU (30-45 min por imagen).

### Etapa 3 — Postprocesado propio con OpenCV

- **Fusión de bordes:** interpolación ponderada entre imagen generada e imagen original en los límites de la máscara, evitando transiciones abruptas
- **Mejora de nitidez:** filtro unsharp mask para realzar detalles de la prenda

## Instalación (microservicio IA)

### Requisitos

- Python 3.12
- Token de Hugging Face (gratuito): https://huggingface.co/settings/tokens
- Sin necesidad de GPU (la inferencia se delega en Hugging Face)

### Pasos

**1. Crear entorno virtual**

```bash
python -m venv venv_new

# Windows
venv_new\Scripts\activate

# macOS / Linux
source venv_new/bin/activate
```

**2. Instalar dependencias**

```bash
pip install -r requirements.txt
```

**3. Configurar variables de entorno**

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edita `.env` y añade tu token:

```
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

**4. Arrancar el microservicio**

```bash
python run.py
```

El microservicio queda disponible en: **http://127.0.0.1:8000**

### Con Docker

```bash
docker-compose up --build
```

## Uso de la API

### POST /api/tryon

Genera una imagen de virtual try-on.

**Body (multipart/form-data):**

| Campo           | Tipo   | Descripción                                  |
| --------------- | ------ | -------------------------------------------- |
| `person_image`  | File   | Foto de la persona (JPG/PNG/WEBP, máx. 10MB) |
| `garment_image` | File   | Foto de la prenda (JPG/PNG/WEBP, máx. 10MB)  |
| `garment_type`  | String | `top` / `bottom` / `dress`                   |

**Respuesta:**

```json
{
  "status": "success",
  "result_url": "/api/result/result_abc123.jpg"
}
```

### GET /api/result/{filename}

Descarga la imagen resultado generada.

### GET /api/health

Comprueba que el servicio está activo.

## Tecnologías utilizadas

| Componente            | Tecnología                  |
| --------------------- | --------------------------- |
| Frontend              | Angular                     |
| Backend principal     | NestJS + TypeScript         |
| Microservicio IA      | Python + FastAPI            |
| Detección de pose     | MediaPipe Pose Landmarker   |
| Modelo Virtual Try-On | IDM-VTON (Hugging Face API) |
| Postprocesado         | OpenCV                      |
| Cliente API           | gradio-client               |
| Containerización      | Docker + Docker Compose     |
| Tests unitarios       | Jest (NestJS)               |
| Servidor ASGI         | Uvicorn                     |

## Limitaciones conocidas

- **Prendas inferiores:** IDM-VTON está entrenado principalmente con prendas superiores, por lo que el rendimiento en pantalones es inferior. Se evaluó OOTDiffusion como alternativa pero el Space presentaba errores en el momento del desarrollo.
- **Latencia:** el tiempo de respuesta depende de la disponibilidad de la API de Hugging Face (20-60 segundos por solicitud).
- **Artefactos visuales:** pueden aparecer artefactos en zonas como brazos o cabello, limitación conocida de los modelos de virtual try-on actuales.

## Notas de desarrollo

- Las rutas del proyecto no deben contener caracteres especiales (tildes, acentos) para garantizar compatibilidad con MediaPipe en Windows.
- El token de Hugging Face debe tener permisos de lectura (`read`).
- Las imágenes se eliminan automáticamente tras el procesamiento.
