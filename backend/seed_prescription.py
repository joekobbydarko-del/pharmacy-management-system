from database import SessionLocal
from models import User
from prescription_models import Prescription


def main():
    db = SessionLocal()

    try:
        print()
        print("=== Dr. Evans Pharmacy Prescription Seeder ===")
        print()

        patient_email = input(
            "Enter the patient email address: "
        ).strip().lower()

        if not patient_email:
            print("No email address entered.")
            return

        user = (
            db.query(User)
            .filter(User.email == patient_email)
            .first()
        )

        if not user:
            print(
                f"No patient account was found for: "
                f"{patient_email}"
            )
            return

        print()
        print(f"Patient found: {user.full_name}")
        print(f"User ID: {user.id}")
        print()

        existing = (
            db.query(Prescription)
            .filter(
                Prescription.user_id == user.id,
                Prescription.medicine_name == "Paracetamol",
                Prescription.status == "active",
            )
            .first()
        )

        if existing:
            print(
                "An active Paracetamol prescription "
                "already exists."
            )
            print(
                f"Prescription ID: {existing.id}"
            )
            return

        prescription = Prescription(
            user_id=user.id,
            medicine_name="Paracetamol",
            dosage="500mg",
            frequency="Twice daily",
            instructions="Take after meals.",
            status="active",
        )

        db.add(prescription)
        db.commit()
        db.refresh(prescription)

        print()
        print("Prescription created successfully.")
        print(f"Prescription ID: {prescription.id}")
        print(f"Patient: {user.full_name}")
        print(f"User ID: {prescription.user_id}")
        print(
            f"Medicine: {prescription.medicine_name}"
        )
        print(f"Dosage: {prescription.dosage}")
        print(
            f"Frequency: {prescription.frequency}"
        )
        print(f"Status: {prescription.status}")

    except Exception as error:
        db.rollback()

        print()
        print("Prescription could not be created.")
        print(f"Error: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    main()