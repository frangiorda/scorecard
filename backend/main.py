from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables

# Importamos routers
from .routers import courses, matches

app = FastAPI(title="Golf Tracker MVP")

# CORS Middleware para que acepte peticiones del frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se pone la URL específica
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Incluimos el router de canchas, matches a la app principal
app.include_router(courses.router)
app.include_router(matches.router)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a Golf Tracker API"}