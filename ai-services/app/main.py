from fastapi import FastAPI
from app.api.routes.vision import router as vision_router

app = FastAPI(
    title="KissanVikas AI Services",
    description="AI, Computer Vision and Spatial Intelligence Service",
    version="1.0",
)

app.include_router(vision_router)

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-services"
    }