
"""
DR. EVANS PHARMACY
ONE-TIME SYNTHETIC DEMOMED TEST CLEANUP

Invalidates only the known synthetic test.
Preserves original prescription and audit.
"""

import json

from database import SessionLocal
from models import User
from prescription_models import Prescription
from patient_medications import PatientPrescriptionUpload
from prescription_verification import PrescriptionVerification

DOCUMENT_ID = "c101a259-bbb8-4b4e-83bd-978698e205ca"
EXPECTED_FILENAME = "test-prescription.pdf..pdf"
MEDICATION_ID = 4

db = SessionLocal()

try:
    document = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.document_id
            == DOCUMENT_ID
        )
        .with_for_update()
        .first()
    )

    audit = (
        db.query(PrescriptionVerification)
        .filter(
            PrescriptionVerification.document_id
            == DOCUMENT_ID
        )
        .first()
    )

    medication = (
        db.query(Prescription)
        .filter(
            Prescription.id == MEDICATION_ID
        )
        .with_for_update()
        .first()
    )

    if not document or not audit or not medication:
        raise ValueError(
            "Required test records were not found."
        )

    if document.filename != EXPECTED_FILENAME:
        raise ValueError(
            "Unexpected filename. No changes made."
        )

    if document.user_id != medication.user_id:
        raise ValueError(
            "Patient ownership mismatch."
        )

    if audit.patient_id != document.user_id:
        raise ValueError(
            "Audit ownership mismatch."
        )

    data = json.loads(audit.verified_medications)

    if data.get("prescription_ids") != [MEDICATION_ID]:
        raise ValueError(
            "Audit medication ID mismatch."
        )

    verified_items = data.get("medications", [])

    expected = {
        "medicine_name": "DemoMed A",
        "dosage": "Demo dose",
        "frequency": "Demo schedule",
        "instructions": "FOR SOFTWARE TESTING ONLY",
    }

    if len(verified_items) != 1:
        raise ValueError(
            "Unexpected number of verified medications."
        )

    for field, value in expected.items():
        if verified_items[0].get(field) != value:
            raise ValueError(
                f"Audit mismatch: {field}"
            )

        if getattr(medication, field) != value:
            raise ValueError(
                f"Medication mismatch: {field}"
            )

    if document.verification_status not in (
        "verified",
        "invalidated",
    ):
        raise ValueError(
            "Unexpected document status."
        )

    if medication.status not in (
        "active",
        "invalid_test",
    ):
        raise ValueError(
            "Unexpected medication status."
        )

    medication.status = "invalid_test"
    document.verification_status = "invalidated"

    db.commit()

    print("DemoMed test cleanup successful")
    print("Document status: invalidated")
    print("Medication status: invalid_test")
    print("Verification audit: preserved")

except Exception as error:
    db.rollback()
    print("Cleanup stopped:", error)

finally:
    db.close()
