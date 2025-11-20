from sqlmodel import Session
from backend.database import engine, create_db_and_tables
from backend.models import Course, Hole

def create_course_data():
    with Session(engine) as session:
        print("Iniciando carga de canchas")

        # ==========================================
        # 1. EL TERRÓN GOLF CLUB
        # ==========================================
        terron = Course(name="El Terrón Golf Club")
        session.add(terron)
        session.commit() 
        session.refresh(terron)

        terron_holes_data = [
            (1, 4, 7), (2, 3, 15), (3, 5, 13), (4, 4, 5), (5, 3, 11), (6, 4, 3), (7, 4, 1), (8, 4, 9), (9, 5, 17),
            (10, 4, 8), (11, 5, 12), (12, 4, 2), (13, 4, 6), (14, 4, 14), (15, 3, 18), (16, 5, 4), (17, 3, 16), (18, 4, 10)
        ]

        for h_num, h_par, h_hc in terron_holes_data:
            hole = Hole(course_id=terron.id, number=h_num, par=h_par, handicap_index=h_hc)
            session.add(hole)

        # ==========================================
        # 2. LOMAS DE LA CAROLINA
        # ==========================================
        lomas = Course(name="Lomas de La Carolina")
        session.add(lomas)
        session.commit()
        session.refresh(lomas)

        lomas_holes_data = [
            (1, 3, 7), (2, 4, 3), (3, 4, 9), (4, 5, 5), (5, 3, 15), (6, 4, 11), (7, 5, 17), (8, 4, 1), (9, 4, 13),
            (10, 3, 8), (11, 4, 4), (12, 4, 10), (13, 5, 6), (14, 3, 16), (15, 4, 12), (16, 5, 18), (17, 4, 2), (18, 4, 14)
        ]

        for h_num, h_par, h_hc in lomas_holes_data:
            hole = Hole(course_id=lomas.id, number=h_num, par=h_par, handicap_index=h_hc)
            session.add(hole)

        # ==========================================
        # 3. RÍO CUARTO GOLF CLUB
        # ==========================================
        rio_cuarto = Course(name="Río Cuarto Golf Club")
        session.add(rio_cuarto)
        session.commit()
        session.refresh(rio_cuarto)

        rio_cuarto_holes_data = [
            # IDA (1-9)
            (1, 4, 7),  (2, 4, 13), (3, 4, 1), 
            (4, 4, 9),  (5, 5, 3),  (6, 3, 17), 
            (7, 4, 15), (8, 3, 11), (9, 4, 5),
            
            # VUELTA (10-18)
            (10, 4, 2), (11, 3, 18), (12, 4, 16), 
            (13, 4, 8), (14, 5, 14), (15, 5, 4), 
            (16, 3, 12), (17, 4, 6), (18, 5, 10)
        ]

        for h_num, h_par, h_hc in rio_cuarto_holes_data:
            hole = Hole(course_id=rio_cuarto.id, number=h_num, par=h_par, handicap_index=h_hc)
            session.add(hole)

        session.commit()
        print("¡Canchas cargadas exitosamente!")

if __name__ == "__main__":
    create_db_and_tables()
    create_course_data()