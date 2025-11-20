from sqlmodel import SQLModel, create_engine, Session

# Nombre del archivo de la base de datos
SQLITE_FILE_NAME = "golf.db"
sqlite_url = f"sqlite:///{SQLITE_FILE_NAME}"

# connect_args={"check_same_thread": False} es necesario para SQLite con FastAPI
engine = create_engine(sqlite_url, echo=True, connect_args={"check_same_thread": False})

#Crea la base de datos y las tablas
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session