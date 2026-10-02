from database import SessionLocal
from models import User
from prescription_models import Prescription


db = SessionLocal()

try:
    user = (
        db.query(User)
        .filter(User.id == 6)
        .first()
    )

    if not user:
        print("User 6 was not found.")
    else:
        existing = (
            db.query(Prescription)
            .filter(
                Prescription.user_id == 6,
                Prescription.medicine_name == "Paracetamol"
            )
            .first()
        )

        if existing:
            print(f"Prescription already exists. ID: {existing.id}")
        else:
            prescription = Prescription(
                user_id=6,
                medicine_name="Paracetamol",
                dosage="500mg",
                frequency="Twice daily",
                instructions="Take after meals.",
                status="active"
            )

            db.add(prescription)
            db.commit()
            db.refresh(prescription)

            print("Prescription created successfully.")
            print(f"Prescription ID: {prescription.id}")
            print(f"User ID: {prescription.user_id}")
            print(f"Medicine: {prescription.medicine_name}")
            print(f"Status: {prescription.status}")

finally:
    db.close()