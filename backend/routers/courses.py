from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

# Importamos la sesión de DB y los Modelos
from backend.database import get_session
from backend.models import Course, Hole

# Creamos el router (es como una mini-app para esta sección)
router = APIRouter(prefix="/courses", tags=["courses"])


# ruta GET de todas las canchas disponibles
@router.get("/", response_model=List[Course])
def read_courses(session: Session = Depends(get_session)):
    courses = session.exec(select(Course)).all()
    return courses

# Obtiene una cancha específica por su ID y trae sus hoyos relacionados
@router.get("/{course_id}", response_model=Course)
def read_course(course_id: int, session: Session = Depends(get_session)):
    
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return course

# Devuelve solo los hoyos de una cancha específica
@router.get("/{course_id}/holes", response_model=List[Hole])
def read_course_holes(course_id: int, session: Session = Depends(get_session)):
    statement = select(Hole).where(Hole.course_id == course_id).order_by(Hole.number)
    holes = session.exec(statement).all()
    return holes