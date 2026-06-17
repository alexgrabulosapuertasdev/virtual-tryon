# Sistema de Virtual Try-On — TFG UNIR 2025/2026

Sistema de Virtual Try-On basado en visión por computador. Permite visualizar cómo quedaría una prenda sobre una persona mediante el modelo IDM-VTON de Hugging Face.

## Estructura del proyecto

```
virtual-tryon/
├── backend/
│   ├── api/
│   │   └── routes.py          # Endpoints de la API REST
│   ├── core/
│   │   ├── config.py          # Configuración centralizada
│   │   └── pipeline.py        # Pipeline de IA (IDM-VTON)
│   └── utils/
│       └── image_utils.py     # Validación y preprocesado de imágenes
├── frontend/
│   ├── static/
│   │   ├── css/style.css      # Estilos
│   │   └── js/app.js          # Lógica del frontend
│   └── templates/
│       └── index.html         # Interfaz web
├── temp/
│   ├── uploads/               # Imágenes de entrada (temporales)
│   └── outputs/               # Imágenes resultado
├── main.py                    # Aplicación FastAPI
├── run.py                     # Script de arranque
├── requirements.txt
└── .env.example
```

## Instalación

### 1. Clonar o descargar el proyecto

```bash
cd virtual-tryon
```

### 2. Crear entorno virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y añade tu token de Hugging Face:

```
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

> Puedes obtener un token gratuito en: https://huggingface.co/settings/tokens

### 5. Arrancar el servidor

```bash
python run.py
```

Abre el navegador en: **http://127.0.0.1:8000**

## Uso

1. Carga una imagen de una persona (foto de cuerpo entero, fondo claro preferiblemente)
2. Carga una imagen de una prenda (foto del catálogo, fondo blanco ideal)
3. Pulsa **Generar Virtual Try-On**
4. Espera el resultado (puede tardar entre 20 y 60 segundos)
5. Descarga la imagen generada

## Notas técnicas

- El modelo IDM-VTON se ejecuta en la infraestructura de Hugging Face (no requiere GPU local)
- Formatos de imagen aceptados: JPG, PNG, WEBP
- Tamaño máximo por imagen: 10 MB
- Las imágenes se procesan y eliminan tras cada sesión

## Tecnologías utilizadas

| Componente | Tecnología |
|---|---|
| Backend | Python + FastAPI |
| Modelo IA | IDM-VTON (Hugging Face) |
| Cliente IA | gradio-client |
| Frontend | HTML + CSS + JavaScript |
| Servidor | Uvicorn |
