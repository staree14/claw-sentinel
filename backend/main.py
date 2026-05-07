"""
ClawSentinel — FastAPI Application Entry Point
================================================
Multi-agent smart home safety system.
Initializes all agents on startup and exposes the pipeline API.
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env before anything else
load_dotenv()

from api.routes import router
from core.orchestrator import Orchestrator
from core.telegram_bot import init_telegram_bot

# ──────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Lifespan — startup & shutdown
# ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Runs startup logic (model loading, memory init) before serving requests.
    """
    logger.info("=" * 60)
    logger.info("  ClawSentinel — Booting multi-agent pipeline")
    logger.info("=" * 60)

    # 1. Initialize Orchestrator
    orchestrator = Orchestrator()
    await orchestrator.startup()
    app.state.orchestrator = orchestrator

    # 2. Start Telegram Bot Listener (Polling)
    # This removes the need for a separate telegram_runner.py script
    bot_app = await init_telegram_bot(orchestrator)
    app.state.bot_app = bot_app

    logger.info("🛡️  ClawSentinel is online and ready to protect")
    logger.info("=" * 60)

    yield  # App is running

    # ───────────────── SHUTDOWN ─────────────────
    logger.info("[ClawSentinel] Shutting down gracefully")
    
    if bot_app:
        logger.info("[ClawSentinel] Stopping Telegram bot...")
        await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()


# ──────────────────────────────────────────────────────────────
# FastAPI App
# ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="ClawSentinel",
    description=(
        "A distributed multi-agent AI safety system for smart homes. "
        "Transforms reactive sensors into a proactive guardian with persistent behavioral memory."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ──────────────────────────────────────────────────────────────
# CORS — allow frontend dev server and production
# ──────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*",                       # Remove in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────────────────────

app.include_router(router, prefix="", tags=["ClawSentinel Pipeline"])


# ──────────────────────────────────────────────────────────────
# Root
# ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "system": "ClawSentinel",
        "tagline": "Giving smart environments a behavioral soul",
        "version": "1.0.0",
        "pipeline": "SensorAgent → ContextAgent → RiskAgent → DecisionAgent → ActionAgent",
        "endpoints": {
            "POST /event": "Submit sensor event to pipeline",
            "GET  /state": "Retrieve memory snapshot",
            "GET  /trace": "Retrieve last N decision traces",
            "GET  /health": "System health check",
            "GET  /docs":  "Interactive API documentation",
        },
    }


# ──────────────────────────────────────────────────────────────
# Run directly
# ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        reload_excludes=["venv", "memory", "__pycache__"],
        log_level="info",
    )