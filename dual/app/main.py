from contextlib import asynccontextmanager

import sqlalchemy as sa
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.database import create_db_and_tables, engine
from app.routers import companies, dual_projects, evaluations


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
    tables = ["companies", "dual_projects", "evaluations_70_30"]
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
    title="Dual Model API",
    description="Microservicio de Modelo Dual - Gestión de vinculación con la industria",
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

app.include_router(companies.router)
app.include_router(dual_projects.router)
app.include_router(evaluations.router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "service": "dual"}
