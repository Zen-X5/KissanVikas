from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.vision import router as vision_router

app = FastAPI(
    title="🌿 KissanVikas AI Services",
    description="Spatial Computer Vision, 3D Georeferencing, VARI Chlorophyll Scoring & Polyhouse Digital Twin Reconstruction Engine",
    version="1.1.0",
)

# Enable CORS for NestJS Backend and Next.js / React Native Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vision_router)


@app.get("/health", summary="Health Check")
def health_check():
    return {
        "status": "ok",
        "service": "ai-services",
        "version": "1.1.0",
        "capabilities": [
            "YOLO Multi-Crop Detection",
            "VARI Canopy Health Scoring",
            "3D Ray-Plane Georeferencing",
            "Topological Digital Twin Graph Builder"
        ]
    }