import httpx
from app.config import settings


async def verify_student_enrollment(
    student_id: int,
    materia: str,
    periodo: str,
    bearer_token: str,
) -> bool:
    """Verify with Core that student has the subject enrolled via API REST."""
    url = f"{settings.core_api_url}/academic-load/student/{student_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                url,
                headers={"Authorization": f"Bearer {bearer_token}"},
            )
        if resp.status_code != 200:
            return False
        loads = resp.json()
        for load in loads:
            if load.get("materia") == materia and load.get("periodo") == periodo:
                return True
        return False
    except Exception:
        return False


async def sync_grade_to_core(
    academic_load_id: int,
    final_grade: float,
    bearer_token: str,
) -> bool:
    """Send PATCH to Core to update the official grade in academic_load."""
    url = f"{settings.core_api_url}/academic-load/{academic_load_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.patch(
                url,
                json={"calificacion_final": final_grade},
                headers={"Authorization": f"Bearer {bearer_token}"},
            )
        return resp.status_code == 200
    except Exception:
        return False
