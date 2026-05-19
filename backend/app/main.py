# backend/app/main.py
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import router as v1_router
from app.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import configure_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    configure_logging(debug=s.debug)
    yield


app = FastAPI(
    title=get_settings().app_name,
    version="0.1.0",
    description="AI-powered job application platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app.include_router(v1_router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": get_settings().app_name}
