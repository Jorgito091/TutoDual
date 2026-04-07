-- Dual Database Initialization
-- PostgreSQL 14+

-- Tables are created by SQLModel/SQLAlchemy on startup.
-- Triggers are applied by the app's lifespan handler.

-- The evaluations_70_30 table uses a Python-calculated field for final_grade_calculated.
-- Equivalent PostgreSQL GENERATED column DDL for reference:
--
-- ALTER TABLE evaluations_70_30
--   ADD COLUMN IF NOT EXISTS final_grade_calculated_gen NUMERIC(5,2)
--   GENERATED ALWAYS AS (
--     CASE
--       WHEN nota_empresa IS NOT NULL AND nota_docente IS NOT NULL
--       THEN ROUND((nota_empresa * 0.7 + nota_docente * 0.3)::numeric, 2)
--       ELSE NULL
--     END
--   ) STORED;
