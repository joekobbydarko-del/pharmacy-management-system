
"""
Dr. Evans Pharmacy

One-time correction of the accidental
placeholder medication record.

Only medication ID 3 is eligible, and only
when its medicine name, dosage and frequency
are all exactly "string".

No other medication record is changed.
"""

from database import SessionLocal
from prescription_models import Prescription


TARGET_ID = 3


def main():
    db = SessionLocal()

    try:
        medication = (
            db.query(Prescription)
            .filter(Prescription.id == TARGET_ID)
            .first()
        )

        if medication is None:
            print("Record 3 not found. No changes made.")
            return

        values = (
            str(medication.medicine_name or "").strip().lower(),
            str(medication.dosage or "").strip().lower(),
            str(medication.frequency or "").strip().lower(),
        )

        if values != ("string", "string", "string"):
            print(
                "Record does not match the placeholder "
                "test data. No changes made."
            )
            return

        if medication.status == "inactive":
            print("Placeholder medication already inactive.")
            return

        medication.status = "inactive"
        db.commit()

        print(
            "Success: placeholder medication ID 3 "
            "marked inactive."
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
