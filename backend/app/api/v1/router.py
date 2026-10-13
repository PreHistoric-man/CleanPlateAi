from fastapi import APIRouter
from app.api.v1.endpoints import health, inspections

api_v1_router = APIRouter()

# Register sub-routers
api_v1_router.include_router(health.router, prefix="/health", tags=["Health"])
api_v1_router.include_router(inspections.router, prefix="/inspections", tags=["Inspections"])
