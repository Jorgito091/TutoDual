-- Core Database Initialization
-- PostgreSQL 14+

-- Indexes (tables are created by SQLModel/SQLAlchemy on startup)
-- These are created after the ORM runs; the trigger is also created by the app.
-- This file seeds initial admin user (password: admin123)

-- Wait for tables to be created by the ORM before running this seed.
-- The app's lifespan handler calls create_db_and_tables() before this runs
-- only when using docker-entrypoint-initdb.d. The seed is in a separate script.
