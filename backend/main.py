from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth_router, ports_router, ddf_router, ofc_router, dashboard_router, search_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created/verified")
    except Exception as e:
        print(f"⚠ Database connection failed: {e}")
        print("  Make sure PostgreSQL is running and the database exists.")
    yield


app = FastAPI(
    title="Fiber Management System",
    description="Enterprise-grade Fiber Management System for Telecom Network Operations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router.router)
app.include_router(ports_router.router)
app.include_router(ddf_router.router)
app.include_router(ofc_router.router)
app.include_router(dashboard_router.router)
app.include_router(search_router.router)


@app.get("/")
def root():
    return {
        "message": "Fiber Management System API",
        "version": "1.0.0",
        "docs": "/docs"
    }
