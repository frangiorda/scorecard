from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from sqlalchemy.orm import selectinload
from sqlmodel import desc

from backend.database import get_session
# Asegúrate de que MatchRead esté importado aquí abajo 👇
from backend.models import Match, MatchPlayer, Score, ScoreInput, MatchCreate, Course, Hole, MatchRead

router = APIRouter(prefix="/matches", tags=["matches"])

# ... (Tus otros imports y endpoints arriba) ...

# --- BORRAR PARTIDO (NUEVO) ---
@router.delete("/{match_id}")
def delete_match(match_id: int, session: Session = Depends(get_session)):
    match = session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    # Borrado manual en cascada para asegurar limpieza en SQLite
    # 1. Buscamos los jugadores del partido
    players = session.exec(select(MatchPlayer).where(MatchPlayer.match_id == match_id)).all()
    
    for player in players:
        # 2. Borramos los scores de cada jugador
        scores = session.exec(select(Score).where(Score.match_player_id == player.id)).all()
        for score in scores:
            session.delete(score)
        # 3. Borramos al jugador
        session.delete(player)
    
    # 4. Finalmente borramos el partido
    session.delete(match)
    session.commit()
    
    return {"ok": True}

@router.get("/", response_model=List[MatchRead])
def get_matches(session: Session = Depends(get_session)):
    """Retorna todos los partidos ordenados por fecha descendente"""
    statement = (
        select(Match)
        .options(
            # Cargamos course para mostrar el nombre en la lista
            selectinload(Match.course),
            # Cargamos players para mostrar quienes jugaron
            selectinload(Match.players)
        )
        .order_by(desc(Match.id)) # Los últimos primero
    )
    return session.exec(statement).all()

# --- CREAR PARTIDO ---
@router.post("/", response_model=Match)
def create_match(match_data: MatchCreate, session: Session = Depends(get_session)):
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M")
    new_match = Match(course_id=match_data.course_id, date=current_date)
    session.add(new_match)
    session.commit()
    session.refresh(new_match)

    for p in match_data.players:
        new_player = MatchPlayer(match_id=new_match.id, player_name=p.name, playing_handicap=p.handicap)
        session.add(new_player)
    
    session.commit()
    session.refresh(new_match)
    return new_match

# --- OBTENER PARTIDO (AQUÍ ESTÁ LA CLAVE) ---
# Usamos response_model=MatchRead para limpiar la respuesta
@router.get("/{match_id}", response_model=MatchRead)
def get_match_details(match_id: int, session: Session = Depends(get_session)):
    statement = (
        select(Match)
        .where(Match.id == match_id)
        .options(
            selectinload(Match.players).selectinload(MatchPlayer.scores),
            selectinload(Match.course).selectinload(Course.holes)
        )
    )
    
    match = session.exec(statement).first()
    
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")
    
    return match

# --- GUARDAR SCORE ---
@router.post("/score")
def save_score(score_data: ScoreInput, session: Session = Depends(get_session)):
    statement = select(MatchPlayer).where(
        MatchPlayer.match_id == score_data.match_id,
        MatchPlayer.player_name == score_data.player_name
    )
    player = session.exec(statement).first()
    
    if not player:
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    stmt_score = select(Score).where(
        Score.match_player_id == player.id,
        Score.hole_number == score_data.hole_number
    )
    existing_score = session.exec(stmt_score).first()

    if existing_score:
        existing_score.strokes = score_data.strokes
        existing_score.putts = score_data.putts
        existing_score.fairway_hit = score_data.fairway_hit
        session.add(existing_score)
    else:
        new_score = Score(
            match_player_id=player.id,
            hole_number=score_data.hole_number,
            strokes=score_data.strokes,
            putts=score_data.putts,
            fairway_hit=score_data.fairway_hit
        )
        session.add(new_score)

    session.commit()
    return {"status": "ok", "message": "Score guardado"}