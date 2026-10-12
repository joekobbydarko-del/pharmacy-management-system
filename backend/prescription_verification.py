
"""
DR. EVANS PHARMACY
REMOTE PHARMACY — PRESCRIPTION VERIFICATION

Scope: Patient Portal -> My Medications

Features:
- Pharmacy staff authentication
- Designated pharmacist authorization
- Existing Admin account compatibility
- Pending prescription review queue
- Original prescription confirmation
- Placeholder medication rejection
- Verified medication record creation
- Duplicate verification protection
- Verification audit preservation
- Controlled cleanup of two synthetic tests

No existing database tables are dropped or recreated.
No legacy Admin routes or roles are renamed.
"""

import json

from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from pydantic import BaseModel, Field

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import Session

from database import Base, SessionLocal
from models import User
from prescription_models import Prescription
from patient_medications import PatientPrescriptionUpload
from security import decode_access_token


# ============================================================
# ROUTER CONFIGURATION
# ============================================================

router = APIRouter(
    prefix="/pharmacy/prescription-review",
    tags=["Prescription Verification"],
)

security = HTTPBearer()


# ============================================================
# SYNTHETIC TEST RECORD IDENTIFIERS
# ============================================================

PLACEHOLDER_TEST = {
    "document_id":
        "d6975223-5cc0-4ca3-bbca-471c4b799e7f",
    "filename":
        "prescription-template_x.png",
    "medication_id": 3,
    "medicine_name": "string",
    "dosage": "string",
    "frequency": "string",
    "instructions": "",
}

DEMO_TEST = {
    "document_id":
        "c101a259-bbb8-4b4e-83bd-978698e205ca",
    "filename":
        "test-prescription.pdf.pdf",
    "medication_id": 4,
    "medicine_name": "DemoMed A",
    "dosage": "Demo dose",
    "frequency": "Demo schedule",
    "instructions":
        "FOR SOFTWARE TESTING ONLY",
}


PLACEHOLDER_VALUES = {
    "string",
    "strings",
    "test",
    "testing",
    "example",
    "sample",
    "placeholder",
    "medicine",
    "medicine name",
    "drug",
    "drug name",
    "dosage",
    "dose",
    "frequency",
    "instruction",
    "instructions",
    "unknown",
    "n/a",
    "na",
    "none",
    "null",
    "undefined",
    "xxx",
    "123",
    "1234",
}


# ============================================================
# EXISTING VERIFICATION AUDIT MODEL
# ============================================================

class PrescriptionVerification(Base):
    __tablename__ = "prescription_verifications"

    id = Column(
        Integer,
        primary_key=True,
    )

    document_id = Column(
        String(36),
        unique=True,
        nullable=False,
        index=True,
    )

    patient_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    pharmacist_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    verified_medications = Column(
        Text,
        nullable=False,
    )

    verification_note = Column(
        Text,
        nullable=True,
    )

    verified_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


# ============================================================
# REQUEST MODELS
# ============================================================

class VerifiedMedicationInput(BaseModel):
    medicine_name: str = Field(
        min_length=2,
        max_length=255,
    )

    dosage: str = Field(
        min_length=1,
        max_length=100,
    )

    frequency: str = Field(
        min_length=1,
        max_length=100,
    )

    instructions: str = Field(
        default="",
        max_length=2000,
    )


class VerifyPrescriptionRequest(BaseModel):
    medications: List[VerifiedMedicationInput] = Field(
        min_length=1,
        max_length=20,
    )

    checked_original_prescription: bool = Field(
        default=False,
        description=(
            "The pharmacist confirms that the "
            "original prescription was checked."
        ),
    )

    verification_note: str = Field(
        default="",
        max_length=2000,
    )


# ============================================================
# UTILITIES
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def normalize_value(value):
    return str(value or "").strip()


def is_placeholder(value):
    return normalize_value(value).lower() in (
        PLACEHOLDER_VALUES
    )


def required_medication_field(value, field_name):
    cleaned = normalize_value(value)

    if not cleaned or is_placeholder(cleaned):
        raise HTTPException(
            status_code=422,
            detail=(
                f"{field_name} is missing or "
                "contains a placeholder. Enter "
                "information confirmed against "
                "the original prescription."
            ),
        )

    return cleaned


def same_text(first, second):
    return normalize_value(first) == normalize_value(second)


# ============================================================
# AUTHENTICATION
# ============================================================

def get_pharmacy_staff(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(
            credentials.credentials
        )

        user_id = int(payload["sub"])

    except (ValueError, TypeError, KeyError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session.",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="Staff account unavailable.",
        )

    role = normalize_value(user.role).lower()

    if role not in ("admin", "pharmacist"):
        raise HTTPException(
            status_code=403,
            detail="Pharmacy staff access required.",
        )

    return user


def require_pharmacist(
    staff: User = Depends(get_pharmacy_staff),
    db: Session = Depends(get_db),
):
    """
    Preserve the existing designated pharmacist
    account currently stored with role 'admin'.

    The compatibility permission is limited to
    the sole active Admin account.

    Patient and technician accounts cannot
    approve or invalidate prescriptions.
    """

    role = normalize_value(staff.role).lower()

    if role == "pharmacist":
        return staff

    if role == "admin":
        active_admins = (
            db.query(User)
            .filter(
                User.role == "admin",
                User.is_active.is_(True),
            )
            .limit(2)
            .all()
        )

        if (
            len(active_admins) == 1
            and active_admins[0].id == staff.id
        ):
            return staff

    raise HTTPException(
        status_code=403,
        detail=(
            "Clinical prescription verification "
            "requires the designated pharmacist."
        ),
    )


# ============================================================
# PENDING PRESCRIPTION QUEUE
# ============================================================

@router.get("/pending")
def pending_prescriptions(
    staff: User = Depends(get_pharmacy_staff),
    db: Session = Depends(get_db),
):
    documents = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.verification_status
            == "pending"
        )
        .order_by(
            PatientPrescriptionUpload.id.desc()
        )
        .limit(100)
        .all()
    )

    results = []

    for document in documents:
        patient = (
            db.query(User)
            .filter(User.id == document.user_id)
            .first()
        )

        results.append({
            "document_id": document.document_id,
            "patient_id": document.user_id,
            "patient_name": (
                patient.full_name
                if patient
                else "Unknown"
            ),
            "filename": document.filename,
            "extraction_status":
                document.extraction_status,
            "verification_status":
                document.verification_status,
            "extracted_text":
                document.extracted_text,
            "uploaded_at": (
                document.uploaded_at.isoformat()
                if document.uploaded_at
                else None
            ),
        })

    return results


# ============================================================
# CONTROLLED SYNTHETIC TEST INVALIDATION
# ============================================================

def invalidate_known_test(
    test_record,
    db: Session,
):
    """
    Only invalidate a known synthetic test.

    Validate:
    - Exact document ID
    - Exact filename
    - Existing verification audit
    - Exact medication record ID
    - Exact medication details
    - Ownership relationship
    - Medication status

    The original audit is preserved unchanged.

    The operation does not allow arbitrary
    prescription invalidation.
    """

    document_id = test_record["document_id"]
    medication_id = test_record["medication_id"]

    document = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.document_id
            == document_id
        )
        .with_for_update()
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Synthetic test document not found.",
        )

    if document.filename != test_record["filename"]:
        raise HTTPException(
            status_code=409,
            detail="Synthetic test filename mismatch.",
        )

    audit = (
        db.query(PrescriptionVerification)
        .filter(
            PrescriptionVerification.document_id
            == document_id,
            PrescriptionVerification.patient_id
            == document.user_id,
        )
        .first()
    )

    if not audit:
        raise HTTPException(
            status_code=409,
            detail="Verification audit record not found.",
        )

    try:
        audit_data = json.loads(
            audit.verified_medications
        )
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=409,
            detail="Verification audit is unreadable.",
        )

    if not isinstance(audit_data, dict):
        raise HTTPException(
            status_code=409,
            detail="Unexpected audit data structure.",
        )

    audit_ids = audit_data.get(
        "prescription_ids",
        []
    )

    audited_medications = audit_data.get(
        "medications",
        []
    )

    if (
        audit_ids != [medication_id]
        or not isinstance(audited_medications, list)
        or len(audited_medications) != 1
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Verification audit does not match "
                "the expected synthetic test."
            ),
        )

    audited_item = audited_medications[0]

    if not isinstance(audited_item, dict):
        raise HTTPException(
            status_code=409,
            detail="Unexpected audit medication data.",
        )

    fields = (
        "medicine_name",
        "dosage",
        "frequency",
        "instructions",
    )

    for field in fields:
        if not same_text(
            audited_item.get(field),
            test_record[field],
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Audit contents do not match the "
                    "known synthetic medication."
                ),
            )

    medication = (
        db.query(Prescription)
        .filter(
            Prescription.id == medication_id,
            Prescription.user_id == document.user_id,
        )
        .with_for_update()
        .first()
    )

    if not medication:
        raise HTTPException(
            status_code=409,
            detail="Synthetic medication not found.",
        )

    for field in fields:
        if not same_text(
            getattr(medication, field),
            test_record[field],
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Medication details no longer "
                    "match the synthetic test."
                ),
            )

    if document.verification_status == "invalidated":
        if medication.status != "invalid_test":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Document is invalidated, but "
                    "medication status is inconsistent."
                ),
            )

        return {
            "message": (
                "Synthetic test approval was "
                "already invalidated."
            ),
            "document_id": document_id,
            "verification_status": "invalidated",
            "medication_id": medication_id,
            "medication_status": "invalid_test",
            "audit_id": audit.id,
            "audit_preserved": True,
        }

    if document.verification_status != "verified":
        raise HTTPException(
            status_code=409,
            detail=(
                "Document is not in the expected "
                "verified state."
            ),
        )

    if medication.status not in (
        "active",
        "invalid_test",
    ):
        raise HTTPException(
            status_code=409,
            detail="Unexpected medication status.",
        )

    medication.status = "invalid_test"
    document.verification_status = "invalidated"

    # Do not alter or delete the original audit.
    db.commit()

    return {
        "message": (
            "Synthetic test approval invalidated. "
            "Original verification audit preserved."
        ),
        "document_id": document_id,
        "verification_status": "invalidated",
        "medication_id": medication_id,
        "medication_status": "invalid_test",
        "audit_id": audit.id,
        "audit_preserved": True,
    }


# ============================================================
# PREVIOUS PLACEHOLDER TEST CORRECTION
# ============================================================

@router.post(
    "/maintenance/invalidate-placeholder-test"
)
def invalidate_placeholder_test(
    pharmacist: User = Depends(require_pharmacist),
    db: Session = Depends(get_db),
):
    try:
        return invalidate_known_test(
            PLACEHOLDER_TEST,
            db,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Placeholder test invalidation failed. "
                "No changes committed."
            ),
        )


# ============================================================
# DEMOMED A SYNTHETIC TEST CORRECTION
# ============================================================

@router.post(
    "/maintenance/invalidate-demo-test"
)
def invalidate_demo_test(
    pharmacist: User = Depends(require_pharmacist),
    db: Session = Depends(get_db),
):
    """
    Invalidate only the already-created
    DemoMed A synthetic software test.

    Keep the PDF and original audit.
    """

    try:
        return invalidate_known_test(
            DEMO_TEST,
            db,
        )

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Demo test invalidation failed. "
                "No changes committed."
            ),
        )


# ============================================================
# VERIFY A PRESCRIPTION
# ============================================================

@router.post("/{document_id}/verify")
def verify_prescription(
    document_id: UUID,
    request: VerifyPrescriptionRequest,
    pharmacist: User = Depends(require_pharmacist),
    db: Session = Depends(get_db),
):
    document_key = str(document_id)

    if not request.checked_original_prescription:
        raise HTTPException(
            status_code=422,
            detail=(
                "The pharmacist must confirm that "
                "the original prescription has "
                "been checked."
            ),
        )

    cleaned_medications = []

    for item in request.medications:
        name = required_medication_field(
            item.medicine_name,
            "Medicine name",
        )

        dosage = required_medication_field(
            item.dosage,
            "Dosage",
        )

        frequency = required_medication_field(
            item.frequency,
            "Frequency",
        )

        instructions = normalize_value(
            item.instructions
        )

        if instructions and is_placeholder(
            instructions
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Instructions contain a "
                    "placeholder value."
                ),
            )

        cleaned_medications.append({
            "medicine_name": name,
            "dosage": dosage,
            "frequency": frequency,
            "instructions": instructions,
        })

    if not cleaned_medications:
        raise HTTPException(
            status_code=422,
            detail="No medications supplied.",
        )

    try:
        document = (
            db.query(PatientPrescriptionUpload)
            .filter(
                PatientPrescriptionUpload.document_id
                == document_key
            )
            .with_for_update()
            .first()
        )

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Prescription upload not found.",
            )

        if document.verification_status != "pending":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Prescription is already reviewed, "
                    "verified or invalidated."
                ),
            )

        if (
            normalize_value(
                document.extraction_status
            ).lower() == "failed"
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "Failed transcription cannot "
                    "be verified in this workflow."
                ),
            )

        if not document.file_content:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Original prescription "
                    "is unavailable."
                ),
            )

        existing_audit = (
            db.query(PrescriptionVerification)
            .filter(
                PrescriptionVerification.document_id
                == document_key
            )
            .first()
        )

        if existing_audit:
            raise HTTPException(
                status_code=409,
                detail=(
                    "A verification audit already "
                    "exists for this document."
                ),
            )

        record_ids = []

        for medication in cleaned_medications:
            record = Prescription(
                user_id=document.user_id,
                medicine_name=(
                    medication["medicine_name"]
                ),
                dosage=medication["dosage"],
                frequency=medication["frequency"],
                instructions=(
                    medication["instructions"]
                ),
                status="active",
            )

            db.add(record)
            db.flush()

            record_ids.append(record.id)

        verification_data = {
            "medications": cleaned_medications,
            "prescription_ids": record_ids,
            "checked_original_prescription": True,
        }

        audit = PrescriptionVerification(
            document_id=document_key,
            patient_id=document.user_id,
            pharmacist_id=pharmacist.id,
            verified_medications=json.dumps(
                verification_data
            ),
            verification_note=(
                request.verification_note.strip()
            ),
        )

        db.add(audit)

        document.verification_status = "verified"

        db.commit()

        return {
            "message": (
                "Prescription verified. Approved "
                "medications are available in "
                "Current Medications."
            ),
            "document_id": document_key,
            "verification_status": "verified",
            "verified_by": pharmacist.id,
            "medication_record_ids": record_ids,
            "medication_count": len(record_ids),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=(
                "Prescription verification failed. "
                "No medication changes committed."
            ),
        )


# ============================================================
# VERIFICATION STATUS
# ============================================================

@router.get("/{document_id}/status")
def prescription_verification_status(
    document_id: UUID,
    staff: User = Depends(get_pharmacy_staff),
    db: Session = Depends(get_db),
):
    document_key = str(document_id)

    document = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.document_id
            == document_key
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Prescription upload not found.",
        )

    audit = (
        db.query(PrescriptionVerification)
        .filter(
            PrescriptionVerification.document_id
            == document_key
        )
        .first()
    )

    current_status = normalize_value(
        document.verification_status
    ).lower()

    if current_status == "invalidated":
        return {
            "document_id": document_key,
            "status": "invalidated",
            "verified": False,
            "historical_audit_exists": bool(audit),
        }

    if not audit:
        return {
            "document_id": document_key,
            "status": current_status,
            "verified": False,
        }

    if current_status != "verified":
        return {
            "document_id": document_key,
            "status": current_status,
            "verified": False,
            "historical_audit_exists": True,
        }

    return {
        "document_id": document_key,
        "status": "verified",
        "verified": True,
        "patient_id": audit.patient_id,
        "pharmacist_id": audit.pharmacist_id,
        "verified_at": (
            audit.verified_at.isoformat()
            if audit.verified_at
            else None
        ),
    }
