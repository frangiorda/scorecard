from sqlmodel import Session, select
from backend.database import engine, create_db_and_tables
from backend.models import Course, Hole

def create_course_data():
    with Session(engine) as session:
        print("⛳ Verificando y cargando canchas...")

        # Definimos las canchas y sus hoyos en una lista para no repetir código
        courses_to_seed = [
            {
                "name": "El Terrón Golf Club",
                "holes": [
                    (1, 4, 7), (2, 3, 15), (3, 5, 13), (4, 4, 5), (5, 3, 11), (6, 4, 3), (7, 4, 1), (8, 4, 9), (9, 5, 17),
                    (10, 4, 8), (11, 5, 12), (12, 4, 2), (13, 4, 6), (14, 4, 14), (15, 3, 18), (16, 5, 4), (17, 3, 16), (18, 4, 10)
                ]
            },
            {
                "name": "Lomas de La Carolina",
                "holes": [
                    (1, 3, 7), (2, 4, 3), (3, 4, 9), (4, 5, 5), (5, 3, 15), (6, 4, 11), (7, 5, 17), (8, 4, 1), (9, 4, 13),
                    (10, 3, 8), (11, 4, 4), (12, 4, 10), (13, 5, 6), (14, 3, 16), (15, 4, 12), (16, 5, 18), (17, 4, 2), (18, 4, 14)
                ]
            },
            {
                "name": "Río Cuarto Golf Club",
                "holes": [
                    (1, 4, 7),  (2, 4, 13), (3, 4, 1), (4, 4, 9),  (5, 5, 3),  (6, 3, 17), (7, 4, 15), (8, 3, 11), (9, 4, 5),
                    (10, 4, 2), (11, 3, 18), (12, 4, 16), (13, 4, 8), (14, 5, 14), (15, 5, 4), (16, 3, 12), (17, 4, 6), (18, 5, 10)
                ]
            }
        ]

        for data in courses_to_seed:
            # 1. PREGUNTAR: ¿Existe ya esta cancha?
            statement = select(Course).where(Course.name == data["name"])
            existing_course = session.exec(statement).first()

            if existing_course:
                print(f"⚠️  {data['name']} ya existe. Saltando...")
            else:
                # 2. Si no existe, la creamos
                print(f"✅ Creando {data['name']}...")
                new_course = Course(name=data["name"])
                session.add(new_course)
                session.commit()
                session.refresh(new_course)

                # Agregamos sus hoyos
                for h_num, h_par, h_hc in data["holes"]:
                    hole = Hole(course_id=new_course.id, number=h_num, par=h_par, handicap_index=h_hc)
                    session.add(hole)
                
                session.commit()

        print("🚀 Proceso de carga finalizado.")

if __name__ == "__main__":
    create_db_and_tables()
    create_course_data()