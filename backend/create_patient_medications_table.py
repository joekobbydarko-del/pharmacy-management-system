
from database import engine
from patient_medications import PatientPrescriptionUpload


def create_patient_medications_table():
    print(
        "Dr. Evans Pharmacy — "
        "Checking prescription upload table..."
    )

    PatientPrescriptionUpload.__table__.create(
        bind=engine,
        checkfirst=True,
    )

    print(
        "Prescription upload table is ready."
    )

    print(
        "Existing patient and prescription "
        "records have been preserved."
    )


if __name__ == "__main__":
    create_patient_medications_table()
