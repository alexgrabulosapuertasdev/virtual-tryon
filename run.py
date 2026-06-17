import uvicorn
from backend.core.config import HOST, PORT

if __name__ == "__main__":
    print(f"\n🚀 Servidor iniciado en http://{HOST}:{PORT}\n")
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=True,
        timeout_keep_alive=300,
    )
