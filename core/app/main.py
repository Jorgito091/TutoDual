from contextlib import asynccontextmanager

import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.database import create_db_and_tables, engine
from app.routers import auth, users, academic_load, external_profiles, student_visibility


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    _apply_db_triggers()
    yield


def _apply_db_triggers():
    """Create set_updated_at trigger on all tables that have updated_at column."""
    trigger_function_sql = """
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """
    tables = ["users", "external_profiles", "student_visibility", "academic_load"]
    with Session(engine) as session:
        session.exec(sa.text(trigger_function_sql))
        for table in tables:
            session.exec(sa.text(f"""
                DROP TRIGGER IF EXISTS trg_{table}_updated_at ON {table};
                CREATE TRIGGER trg_{table}_updated_at
                BEFORE UPDATE ON {table}
                FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            """))
        session.commit()


app = FastAPI(
    title="Core Académico API",
    description="Servicio central de gestión académica - Fuente de verdad para usuarios, materias, periodos y calificaciones",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(academic_load.router)
app.include_router(external_profiles.router)
app.include_router(student_visibility.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "core"}
