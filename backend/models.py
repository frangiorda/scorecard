from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

# --- MODELOS DE BASE DE DATOS (TABLAS) ---

class Course(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    holes: List["Hole"] = Relationship(back_populates="course")
    matches: List["Match"] = Relationship(back_populates="course")

class Hole(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course_id: int = Field(foreign_key="course.id")
    number: int
    par: int
    handicap_index: int 
    course: Optional[Course] = Relationship(back_populates="holes")

class Match(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date: str 
    course_id: int = Field(foreign_key="course.id")
    course: Optional[Course] = Relationship(back_populates="matches")
    players: List["MatchPlayer"] = Relationship(back_populates="match")

class MatchPlayer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    player_name: str
    playing_handicap: int
    match: Optional[Match] = Relationship(back_populates="players")
    scores: List["Score"] = Relationship(back_populates="player")

class Score(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_player_id: int = Field(foreign_key="matchplayer.id")
    hole_number: int
    strokes: int        
    putts: int = 0      
    fairway_hit: Optional[bool] = None 
    player: Optional[MatchPlayer] = Relationship(back_populates="scores")

# --- SCHEMAS DE ENTRADA (INPUTS) ---

class PlayerCreate(SQLModel):
    name: str
    handicap: int

class MatchCreate(SQLModel):
    course_id: int
    players: List[PlayerCreate]

class ScoreInput(SQLModel):
    match_id: int
    player_name: str 
    hole_number: int
    strokes: int
    putts: int
    fairway_hit: Optional[bool] = None

# --- SCHEMAS DE SALIDA (READ MODELS) - ESTO ES LO NUEVO ---
# Estos modelos evitan el bucle infinito al enviar datos al frontend

class HoleRead(SQLModel):
    number: int
    par: int
    handicap_index: int

class CourseRead(SQLModel):
    id: int
    name: str
    holes: List[HoleRead] = [] # Incluye hoyos, pero NO matches

class ScoreRead(SQLModel):
    hole_number: int
    strokes: int
    putts: int
    fairway_hit: Optional[bool]

class MatchPlayerRead(SQLModel):
    id: int
    player_name: str
    playing_handicap: int
    scores: List[ScoreRead] = []

class MatchRead(SQLModel):
    id: int
    date: str
    course: Optional[CourseRead] = None 
    players: List[MatchPlayerRead] = [] 