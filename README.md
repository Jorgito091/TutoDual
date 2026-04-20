# TutoDual — Sistema de Gestión Académica

Sistema de gestión para el **Modelo Dual** y **Tutorías** universitarias, implementado como **microservicios con núcleo compartido (Shared Kernel)**.

---

## 📐 Arquitectura

```
┌─────────────────────────────────────────────┐
│              Frontend (React + Vite)         │
│        TailwindCSS · TypeScript · Vite       │
│                  :5173                       │
└──────────┬───────────────────┬───────────────┘
           │ REST              │ REST
           ▼                   ▼
┌──────────────────┐  ┌──────────────────────┐
│   Core Service   │  │   Dual Microservice  │
│  FastAPI :8000   │  │   FastAPI :8001      │
│  SQLModel        │  │   SQLModel           │
│  JWT Auth        │◄─┤   JWT (validado      │
│                  │  │   localmente)        │
└────────┬─────────┘  └──────────┬───────────┘
         │                       │
         ▼                       ▼
  ┌─────────────┐        ┌─────────────┐
  │  core_db    │        │   dual_db   │
  │ PostgreSQL  │        │ PostgreSQL  │
  │    :5432    │        │    :5433    │
  └─────────────┘        └─────────────┘
```

**Regla clave:** Los microservicios nunca hacen joins entre bases de datos. La comunicación es siempre vía **API REST**.

---

## 🛠 Stack Tecnológico

| Componente       | Tecnología                                    |
|:-----------------|:----------------------------------------------|
| **Backend**      | Python 3.11+, FastAPI, SQLModel (SQLAlchemy + Pydantic) |
| **Base de Datos**| PostgreSQL 14+ (JSONB, ENUMs, Triggers)       |
| **Frontend**     | React 19, TypeScript, TailwindCSS 3, Vite     |
| **Autenticación**| JWT (generados por Core, validados localmente)|
| **Orquestación** | Docker Compose (monorepo híbrido)             |

---

## 🗄 Modelo de Datos

### Core (Shared Kernel) — `core_db`

| Tabla                | Descripción                                                      |
|:---------------------|:-----------------------------------------------------------------|
| `users`              | Tabla unificada: ALUMNO, DOCENTE, ADMINISTRADOR, EXTERNO         |
| `external_profiles`  | Perfil profesional (LinkedIn-like) para usuarios EXTERNO         |
| `student_visibility` | Control granular: qué externo puede ver las notas de qué alumno |
| `academic_load`      | Carga académica (alumno + docente + materia + periodo + nota)    |

**Índices:** `users.email`, `users.role`, `academic_load.student_id`  
**Trigger:** `set_updated_at()` en todas las tablas

### Dual Microservice — `dual_db`

| Tabla               | Descripción                                                  |
|:--------------------|:-------------------------------------------------------------|
| `companies`         | Empresas aliadas (RFC único)                                 |
| `dual_projects`     | Vincula alumno ↔ asesor académico ↔ mentor ↔ empresa        |
| `evaluations_70_30` | Evaluación dual: 70% empresa + 30% docente = nota final      |

**Nota:** `dual_projects` usa **FK lógicas** (IDs) hacia el Core, nunca FK físicas.

---

## 🔄 Flujo Crítico: Calificación Dual

1. **Mentor externo** asigna su 70% (`nota_empresa`) en `/evaluations/`
2. **Validación automática:** el servicio Dual consulta al Core que el alumno tiene la materia inscrita
3. **Asesor académico** asigna su 30% (`nota_docente`)
4. **Cálculo:** `final_grade_calculated = nota_empresa × 0.7 + nota_docente × 0.3`
5. **Sincronización:** PATCH automático al Core en `PATCH /academic-load/{id}`

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker 20+
- Docker Compose v2+

### Levantar todos los servicios

```bash
docker compose up --build
```

| Servicio         | URL                          |
|:-----------------|:-----------------------------|
| Frontend         | http://localhost:5173        |
| Core API Docs    | http://localhost:8000/docs   |
| Dual API Docs    | http://localhost:8001/docs   |
| Core DB          | localhost:5432               |
| Dual DB          | localhost:5433               |

### Variables de entorno

Copia los archivos de ejemplo:

```bash
cp core/.env.example core/.env
cp dual/.env.example dual/.env
cp frontend/.env.example frontend/.env
```

---

## 📡 API Endpoints

### Core (`http://localhost:8000`)

| Método | Endpoint                         | Descripción                        |
|:-------|:---------------------------------|:-----------------------------------|
| POST   | `/auth/token`                    | Login → JWT                        |
| GET    | `/users/`                        | Listar usuarios                    |
| POST   | `/users/`                        | Crear usuario (ADMINISTRADOR)      |
| PATCH  | `/users/{id}`                    | Actualizar usuario                 |
| GET    | `/academic-load/`                | Listar carga académica             |
| POST   | `/academic-load/`                | Crear registro de carga            |
| PATCH  | `/academic-load/{id}`            | Actualizar calificación            |
| GET    | `/academic-load/student/{id}`    | Carga de un alumno                 |
| POST   | `/external-profiles/`            | Crear perfil externo               |
| GET    | `/student-visibility/student/{id}` | Ver permisos de visibilidad      |

### Dual (`http://localhost:8001`)

| Método | Endpoint                         | Descripción                         |
|:-------|:---------------------------------|:------------------------------------|
| GET    | `/companies/`                    | Listar empresas                     |
| POST   | `/companies/`                    | Crear empresa (ADMINISTRADOR)       |
| GET    | `/dual-projects/`                | Listar proyectos duales             |
| POST   | `/dual-projects/`                | Crear proyecto (valida con Core)    |
| GET    | `/evaluations/`                  | Listar evaluaciones                 |
| POST   | `/evaluations/`                  | Crear evaluación                    |
| PATCH  | `/evaluations/{id}`              | Actualizar notas (recalcula y sincroniza) |
| POST   | `/evaluations/{id}/sync-core`    | Forzar sincronización al Core       |

---

## 🏗 Estructura del Proyecto

```
TutoDual/
├── docker-compose.yml
├── core/                        # Core Académico (Shared Kernel)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── db/
│   │   └── init.sql
│   └── app/
│       ├── main.py
│       ├── auth.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       │   ├── users.py
│       │   ├── external_profiles.py
│       │   ├── student_visibility.py
│       │   └── academic_load.py
│       └── routers/
│           ├── auth.py
│           ├── users.py
│           ├── academic_load.py
│           ├── external_profiles.py
│           └── student_visibility.py
├── dual/                        # Microservicio Modelo Dual
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── db/
│   │   └── init.sql
│   └── app/
│       ├── main.py
│       ├── auth.py
│       ├── config.py
│       ├── database.py
│       ├── models/
│       │   ├── companies.py
│       │   ├── dual_projects.py
│       │   └── evaluations.py
│       ├── routers/
│       │   ├── companies.py
│       │   ├── dual_projects.py
│       │   └── evaluations.py
│       └── services/
│           └── core_client.py
└── frontend/                    # React + TypeScript + TailwindCSS
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── types/
        ├── services/
        ├── hooks/
        ├── pages/
        └── components/
```

---

## 🔐 Roles y Permisos

| Rol            | Permisos                                                         |
|:---------------|:-----------------------------------------------------------------|
| ADMINISTRADOR  | CRUD completo en todos los recursos                              |
| DOCENTE        | Crear/ver usuarios, carga académica, proyectos, evaluaciones     |
| ALUMNO         | Ver su propio kardex y proyectos                                 |
| EXTERNO        | Asignar nota empresa (70%) en evaluaciones de sus proyectos      |

---

*Repositorio: TutoDual — Proyecto Integrador Universidad*
