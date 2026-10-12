"""
Automated tests for the Patient Portal "Current Medications" endpoint
(GET /patient/medications/current -> get_current_medications).

Clinical-safety coverage:
  - verified medication        -> approved, marked verified
  - unverified active record   -> NOT promoted to approved
  - inactive / discontinued    -> excluded
  - blank/missing status       -> NOT treated as active
  - cross-patient isolation    -> records never leak between patients
  - pending OCR draft          -> never appears as a medication

Isolation:
  - Uses a throwaway temporary SQLite database. NO production
    PostgreSQL data is read, written, or modified.
  - Standard library only (no pytest/httpx dependency required).

Run with:
    python -m unittest test_current_medications -v
"""

import json
import os
import tempfile
import unittest

# database.py raises if DATABASE_URL is missing. Provide a throwaway
# value so the import succeeds. This engine is NEVER used by the tests;
# each test uses its own isolated SQLite session.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://user:pass@localhost:5432/unused_test_db",
)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import User
from prescription_models import Prescription
from prescription_verification import PrescriptionVerification
from patient_medications import (
    get_current_medications,
    PatientPrescriptionUpload,
)


def _audit(document_id, patient_id, pharmacist_id, prescription_ids, note=""):
    return PrescriptionVerification(
        document_id=document_id,
        patient_id=patient_id,
        pharmacist_id=pharmacist_id,
        verified_medications=json.dumps({
            "medications": [],
            "prescription_ids": prescription_ids,
            "checked_original_prescription": True,
        }),
        verification_note=note,
    )


class CurrentMedicationsTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # Isolated SQLite DB (temp file so all sessions share it).
        cls._tmp = tempfile.NamedTemporaryFile(
            suffix=".sqlite", delete=False
        )
        cls._tmp.close()
        cls.engine = create_engine(
            "sqlite:///" + cls._tmp.name
        )
        User.__table__.create(bind=cls.engine, checkfirst=True)
        Prescription.__table__.create(
            bind=cls.engine, checkfirst=True
        )
        PrescriptionVerification.__table__.create(
            bind=cls.engine, checkfirst=True
        )
        PatientPrescriptionUpload.__table__.create(
            bind=cls.engine, checkfirst=True
        )
        cls.Session = sessionmaker(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()
        try:
            os.unlink(cls._tmp.name)
        except OSError:
            pass

    def setUp(self):
        self.db = self.Session()
        self.pharmacist = User(
            id=9001, full_name="Dr Pharmacist",
            email="pharm@test.local", password_hash="x",
            role="pharmacist", is_active=True,
        )
        self.patient_a = User(
            id=101, full_name="Patient A",
            email="a@test.local", password_hash="x",
            role="patient", is_active=True,
        )
        self.patient_b = User(
            id=202, full_name="Patient B",
            email="b@test.local", password_hash="x",
            role="patient", is_active=True,
        )
        self.db.add_all(
            [self.pharmacist, self.patient_a, self.patient_b]
        )
        self.db.commit()

    def tearDown(self):
        self.db.query(Prescription).delete()
        self.db.query(PrescriptionVerification).delete()
        self.db.query(PatientPrescriptionUpload).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def _call(self, patient):
        return get_current_medications(
            patient=patient, db=self.db
        )

    # ----------------------------------------------------------
    def test_verified_medication_is_approved_and_marked_verified(self):
        rx = Prescription(
            user_id=self.patient_a.id, medicine_name="Amoxicillin",
            dosage="500mg", frequency="Three times daily",
            instructions="After meals", status="active",
        )
        self.db.add(rx)
        self.db.flush()
        self.db.add(_audit(
            "doc-verified-1", self.patient_a.id,
            self.pharmacist.id, [rx.id], "Checked original",
        ))
        self.db.commit()

        result = self._call(self.patient_a)

        self.assertEqual(result["active_count"], 1)
        self.assertEqual(result["unverified_count"], 0)
        med = result["active_medications"][0]
        self.assertTrue(med["verified"])
        self.assertEqual(med["source"], "pharmacist_verified")
        self.assertEqual(med["verified_by"], self.pharmacist.id)
        self.assertEqual(med["verification_note"], "Checked original")
        self.assertEqual(med["medicine_name"], "Amoxicillin")

    # ----------------------------------------------------------
    def test_unverified_active_record_is_not_promoted(self):
        self.db.add(Prescription(
            user_id=self.patient_a.id, medicine_name="ManualMed",
            dosage="10mg", frequency="Once daily", status="active",
        ))
        self.db.commit()

        result = self._call(self.patient_a)

        # NOT clinically approved -> must not be in active list.
        self.assertEqual(result["active_count"], 0)
        self.assertEqual(result["unverified_count"], 1)
        med = result["unverified_medications"][0]
        self.assertFalse(med["verified"])
        self.assertEqual(med["source"], "patient_record")
        self.assertIsNone(med["verified_by"])
        self.assertIsNone(med["verified_at"])

    # ----------------------------------------------------------
    def test_status_helper_never_treats_missing_as_active(self):
        # Direct unit test of the status guard: missing, NULL, empty,
        # inactive, discontinued are all NOT active. Only "active" and
        # "verified" (case-insensitive) count as active.
        from patient_medications import (
            _is_active_medication_status,
        )

        self.assertTrue(_is_active_medication_status("active"))
        self.assertTrue(_is_active_medication_status("verified"))
        self.assertTrue(_is_active_medication_status("  ACTIVE "))

        self.assertFalse(_is_active_medication_status(None))
        self.assertFalse(_is_active_medication_status(""))
        self.assertFalse(_is_active_medication_status("   "))
        self.assertFalse(_is_active_medication_status("inactive"))
        self.assertFalse(_is_active_medication_status("discontinued"))

    # ----------------------------------------------------------
    def test_inactive_and_blank_status_records_are_excluded(self):
        # Inactive and blank-string statuses are excluded. (Note: the
        # prescriptions.status column default is "active", so a NULL is
        # stored as "active"; the missing-status guard is unit-tested
        # separately above.)
        self.db.add_all([
            Prescription(
                user_id=self.patient_a.id, medicine_name="OldMed",
                dosage="5mg", frequency="Once daily", status="inactive",
            ),
            Prescription(
                user_id=self.patient_a.id, medicine_name="StoppedMed",
                dosage="5mg", frequency="Once daily",
                status="discontinued",
            ),
            Prescription(
                user_id=self.patient_a.id, medicine_name="BlankStatus",
                dosage="5mg", frequency="Once daily", status="",
            ),
        ])
        self.db.commit()

        result = self._call(self.patient_a)

        self.assertEqual(result["active_count"], 0)
        self.assertEqual(result["unverified_count"], 0)
        self.assertEqual(result["count"], 0)

    # ----------------------------------------------------------
    def test_cross_patient_records_are_isolated(self):
        # Patient A has a verified medication.
        rx_a = Prescription(
            user_id=self.patient_a.id, medicine_name="MedA",
            dosage="1mg", frequency="Once daily", status="active",
        )
        self.db.add(rx_a)
        self.db.flush()
        self.db.add(_audit(
            "doc-a", self.patient_a.id,
            self.pharmacist.id, [rx_a.id],
        ))

        # Patient B has their own verified medication.
        rx_b = Prescription(
            user_id=self.patient_b.id, medicine_name="MedB",
            dosage="2mg", frequency="Twice daily", status="active",
        )
        self.db.add(rx_b)
        self.db.flush()
        self.db.add(_audit(
            "doc-b", self.patient_b.id,
            self.pharmacist.id, [rx_b.id],
        ))
        self.db.commit()

        result_a = self._call(self.patient_a)
        result_b = self._call(self.patient_b)

        # Patient A sees only MedA.
        self.assertEqual(result_a["active_count"], 1)
        self.assertEqual(
            result_a["active_medications"][0]["medicine_name"],
            "MedA",
        )

        # Patient B sees only MedB.
        self.assertEqual(result_b["active_count"], 1)
        self.assertEqual(
            result_b["active_medications"][0]["medicine_name"],
            "MedB",
        )

        # No leakage: MedB is never present in patient A's response.
        names_a = [
            m["medicine_name"]
            for m in result_a["medications"]
        ]
        self.assertNotIn("MedB", names_a)

    # ----------------------------------------------------------
    def test_pending_ocr_draft_is_not_a_medication(self):
        # A pending OCR prescription upload (draft) must never appear
        # as a current medication; it lives only in the uploads flow.
        self.db.add(PatientPrescriptionUpload(
            document_id="draft-doc-1",
            user_id=self.patient_a.id,
            filename="rx.png",
            content_type="image/png",
            file_content=b"fake-bytes",
            extraction_status="completed",
            extracted_text="Paracetamol 500mg",
            verification_status="pending",
        ))
        self.db.commit()

        result = self._call(self.patient_a)

        self.assertEqual(result["active_count"], 0)
        self.assertEqual(result["unverified_count"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
