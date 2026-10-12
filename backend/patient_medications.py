
"""
DR. EVANS PHARMACY
REMOTE PHARMACY — PATIENT MEDICATIONS API

Features:
- Authenticated patient prescription uploads
- Original PDF/image storage
- OCR text extraction
- Structured clinical transcription fields
- Patient-specific document access
- Safe deletion of failed, unverified uploads

No automatic prescription approval or clinical decisions.
"""

import os
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.responses import Response
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
)
from sqlalchemy.orm import Session

from database import Base, SessionLocal
from models import User
from security import decode_access_token

from prescription_processing import (
    PrescriptionProcessingError,
    extract_clinical_fields,
    process_prescription,
)


# ============================================================
# CONFIGURATION
# ============================================================

router = APIRouter(
    prefix="/patient/medications",
    tags=["Patient Medications"],
)

security = HTTPBearer()

MAX_UPLOAD_BYTES = 5 * 1024 * 1024

DEFAULT_TESSERACT_PATH = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

if (
    not os.environ.get("TESSERACT_CMD")
    and os.path.isfile(DEFAULT_TESSERACT_PATH)
):
    os.environ["TESSERACT_CMD"] = DEFAULT_TESSERACT_PATH


# ============================================================
# DATABASE MODEL
# KEEP THE EXISTING DATABASE STRUCTURE
# ============================================================

class PatientPrescriptionUpload(Base):
    __tablename__ = "patient_prescription_uploads"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_id = Column(
        String(36),
        unique=True,
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    filename = Column(
        String(255),
        nullable=False,
    )

    content_type = Column(
        String(100),
        nullable=False,
    )

    file_content = Column(
        LargeBinary,
        nullable=False,
    )

    extraction_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    extracted_text = Column(
        Text,
        nullable=True,
    )

    verification_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ============================================================
# PATIENT AUTHENTICATION
# ============================================================

def get_current_patient(
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

    except (
        ValueError,
        TypeError,
        KeyError,
        AttributeError,
    ):
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
            detail="Patient account unavailable.",
        )

    if str(user.role or "").strip().lower() != "patient":
        raise HTTPException(
            status_code=403,
            detail="Patient access required.",
        )

    return user


# ============================================================
# FILE VALIDATION
# ============================================================

def determine_file_type(content: bytes) -> str:
    if content.startswith(b"%PDF-"):
        return "application/pdf"

    if content.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    raise HTTPException(
        status_code=400,
        detail=(
            "Only PDF, PNG and JPEG prescription "
            "documents are supported."
        ),
    )


def sanitize_filename(filename: str | None) -> str:
    value = str(filename or "prescription")

    value = (
        value.replace("\\", "/")
        .split("/")[-1]
        .strip()
    )

    return value[:255] or "prescription"


# ============================================================
# DOCUMENT SERIALIZATION
# ============================================================

def serialize_document(document):
    """
    Return the saved document together with structured
    clinical fields derived from the saved OCR text.

    The saved text is never changed by this function.

    Existing documents remain available without a
    database migration.
    """

    saved_text = document.extracted_text or ""

    if saved_text:
        clinical_fields = extract_clinical_fields(
            saved_text
        )
    else:
        clinical_fields = extract_clinical_fields("")

    return {
        "document_id": document.document_id,
        "filename": document.filename,
        "content_type": document.content_type,
        "extraction_status": document.extraction_status,

        # Existing field, preserved for compatibility
        "extracted_text": document.extracted_text,

        # New structured data for the Professional Draft
        "clinical_fields": clinical_fields,

        # Pharmacist verification remains authoritative
        "verification_status": document.verification_status,

        "uploaded_at": (
            document.uploaded_at.isoformat()
            if document.uploaded_at
            else None
        ),

        "can_delete": (
            document.extraction_status == "failed"
            and document.verification_status == "pending"
        ),
    }


# ============================================================
# PATIENT DOCUMENT ACCESS
# ============================================================

def find_patient_document(
    document_id: str,
    patient: User,
    db: Session,
):
    document = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.document_id
            == document_id,
            PatientPrescriptionUpload.user_id
            == patient.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Prescription document not found.",
        )

    return document


# ============================================================
# OCR PROCESSING
# ============================================================

def process_saved_document(
    document: PatientPrescriptionUpload,
    db: Session,
):
    """
    Process an uploaded prescription.

    Save original OCR text instead of a decorative
    formatted document. Structured data is derived
    from that text when the API returns the document.

    Do not automatically authorize the prescription.
    """

    try:
        result = process_prescription(
            bytes(document.file_content),
            document.content_type,
        )

        # Preserve all readable OCR lines so the
        # pharmacist can compare the transcription
        # with the original uploaded document.

        document.extracted_text = (
            result.get("raw_text") or None
        )

        document.extraction_status = (
            result.get("status")
            or "review_required"
        )

    except PrescriptionProcessingError:
        document.extraction_status = "failed"
        document.extracted_text = None

    except Exception:
        document.extraction_status = "failed"
        document.extracted_text = None

    # This function is used for newly uploaded
    # documents only. Verification must never be
    # assigned automatically based on OCR results.

    document.verification_status = "pending"

    try:
        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Prescription was saved, but its "
                "processing status could not be updated."
            ),
        )

    return document


# ============================================================
# UPLOAD PRESCRIPTION
# ============================================================

@router.post("/upload", status_code=201)
async def upload_prescription(
    file: UploadFile = File(...),
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    content = await file.read(
        MAX_UPLOAD_BYTES + 1
    )

    await file.close()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Maximum file size is 5 MB.",
        )

    content_type = determine_file_type(content)

    document = PatientPrescriptionUpload(
        document_id=str(uuid4()),
        user_id=patient.id,
        filename=sanitize_filename(file.filename),
        content_type=content_type,
        file_content=content,
        extraction_status="pending",
        verification_status="pending",
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to save prescription.",
        )

    document = process_saved_document(
        document,
        db,
    )

    if document.extraction_status == "failed":
        message = (
            "Prescription saved, but automatic "
            "transcription failed. You may remove "
            "this unsuccessful upload or retain "
            "it for manual review."
        )

    else:
        message = (
            "Prescription uploaded and processed. "
            "The transcription awaits pharmacist "
            "verification."
        )

    return {
        "message": message,
        "document": serialize_document(document),
    }


# ============================================================
# LIST UPLOADED PRESCRIPTIONS
# ============================================================

@router.get("/uploads")
def list_uploaded_prescriptions(
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    documents = (
        db.query(PatientPrescriptionUpload)
        .filter(
            PatientPrescriptionUpload.user_id
            == patient.id
        )
        .order_by(
            PatientPrescriptionUpload.id.desc()
        )
        .all()
    )

    return [
        serialize_document(document)
        for document in documents
    ]


# ============================================================
# GET ONE PRESCRIPTION
# ============================================================

@router.get("/uploads/{document_id}")
def get_uploaded_prescription(
    document_id: str,
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    document = find_patient_document(
        document_id,
        patient,
        db,
    )

    return serialize_document(document)


# ============================================================
# VIEW ORIGINAL PRESCRIPTION FILE
# ============================================================

@router.get("/uploads/{document_id}/file")
def get_uploaded_prescription_file(
    document_id: str,
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    document = find_patient_document(
        document_id,
        patient,
        db,
    )

    return Response(
        content=bytes(document.file_content),
        media_type=document.content_type,
        headers={
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "sandbox",
            "Content-Disposition": "inline",
        },
    )


# ============================================================
# DELETE FAILED, UNVERIFIED UPLOAD ONLY
# ============================================================

@router.delete("/uploads/{document_id}")
def delete_failed_prescription(
    document_id: str,
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    document = find_patient_document(
        document_id,
        patient,
        db,
    )

    if (
        document.extraction_status != "failed"
        or document.verification_status != "pending"
    ):
        raise HTTPException(
            status_code=409,
            detail=(
                "Only failed, unverified prescription "
                "uploads can be deleted from this page."
            ),
        )

    filename = document.filename

    try:
        db.delete(document)
        db.commit()

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to delete the failed upload. "
                "Please try again."
            ),
        )

    return {
        "message": (
            "Failed prescription upload "
            "deleted successfully."
        ),
        "deleted_document_id": document_id,
        "filename": filename,
    }


# ============================================================
# CURRENT MEDICATIONS
#
# The patient's ACTIVE, PHARMACIST-VERIFIED medication list.
#
# Clinical safety rules enforced here:
#   - A record is "pharmacist-verified" ONLY when a matching
#     pharmacist verification audit exists. Missing status is
#     never treated as active.
#   - Only records whose status is explicitly "active" (or the
#     legacy equivalent "verified") appear in the active list.
#   - Inactive / discontinued / any other status is excluded.
#   - Unverified active records are returned separately and are
#     NEVER promoted to approved medications.
#   - Pending OCR prescription drafts (uploads) are NOT part of
#     this endpoint; they remain in the uploads endpoints.
#   - Every record is scoped to the authenticated patient.
#   - All values are read dynamically from the database.
#
# Prescription and PrescriptionVerification are imported lazily
# to avoid a circular import with prescription_verification.
# ============================================================

ACTIVE_MEDICATION_STATUSES = {"active", "verified"}


def _is_active_medication_status(status) -> bool:
    """
    A medication is considered active ONLY when its stored status
    is explicitly "active" or the legacy equivalent "verified".

    Missing, NULL, empty, inactive, discontinued and any other
    status are NOT active. Missing status is never treated as
    active.
    """
    return (
        str(status or "").strip().lower()
        in ACTIVE_MEDICATION_STATUSES
    )


def _build_verification_index(db, user_id):
    """
    Map each verified prescription record id to its pharmacist
    verification metadata for the given patient. Only records
    that a pharmacist actually verified are included.
    """
    import json

    # Lazy import avoids the circular dependency:
    # prescription_verification imports patient_medications.
    from prescription_verification import (
        PrescriptionVerification,
    )

    index = {}

    audits = (
        db.query(PrescriptionVerification)
        .filter(
            PrescriptionVerification.patient_id
            == user_id
        )
        .order_by(
            PrescriptionVerification.verified_at.desc()
        )
        .all()
    )

    for audit in audits:
        try:
            payload = json.loads(
                audit.verified_medications
            )
        except (ValueError, TypeError):
            payload = {}

        prescription_ids = payload.get(
            "prescription_ids"
        ) or []

        metadata = {
            "document_id": audit.document_id,
            "pharmacist_id": audit.pharmacist_id,
            "verification_note": audit.verification_note,
            "verified_at": (
                audit.verified_at.isoformat()
                if audit.verified_at
                else None
            ),
        }

        for record_id in prescription_ids:
            # Keep the earliest (most recent-by-time) verification.
            index.setdefault(record_id, metadata)

    return index


def _serialize_medication(record, verification):
    return {
        "id": record.id,
        "medicine_name": record.medicine_name,
        "dosage": record.dosage,
        "frequency": record.frequency,
        "instructions": record.instructions,

        # Explicit status from the database, never defaulted.
        "status": str(record.status or "").strip().lower(),

        # True ONLY when a pharmacist verification audit exists.
        "verified": verification is not None,
        "source": (
            "pharmacist_verified"
            if verification
            else "patient_record"
        ),

        # Verification metadata (None for unverified records).
        "verified_by": (
            verification["pharmacist_id"]
            if verification else None
        ),
        "verified_at": (
            verification["verified_at"]
            if verification else None
        ),
        "verification_note": (
            verification["verification_note"]
            if verification else None
        ),
        "document_id": (
            verification["document_id"]
            if verification else None
        ),
    }


@router.get("/current")
def get_current_medications(
    patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Return the patient's medications, split by clinical safety.

    active_medications    -> status active/verified AND a pharmacist
                             verification audit present. These are
                             the only clinically approved medications.

    unverified_medications -> status active/verified but WITHOUT a
                             pharmacist verification audit. Reported
                             for transparency, NEVER promoted to
                             approved. Inactive/discontinued records
                             are excluded entirely.
    """
    from prescription_models import Prescription

    records = (
        db.query(Prescription)
        .filter(
            Prescription.user_id == patient.id
        )
        .order_by(
            Prescription.id.desc()
        )
        .all()
    )

    verification_index = _build_verification_index(
        db,
        patient.id,
    )

    active_medications = []
    unverified_medications = []

    for record in records:
        # Exclude inactive, discontinued and any non-active status.
        if not _is_active_medication_status(record.status):
            continue

        verification = verification_index.get(record.id)
        serialized = _serialize_medication(record, verification)

        if verification is not None:
            active_medications.append(serialized)
        else:
            unverified_medications.append(serialized)

    return {
        "user_id": patient.id,

        # Clinically approved, pharmacist-verified medications.
        "active_medications": active_medications,
        "active_count": len(active_medications),

        # Active but NOT pharmacist-verified (never approved).
        "unverified_medications": unverified_medications,
        "unverified_count": len(unverified_medications),

        # Backwards-compatible flat list of approved medications.
        "count": len(active_medications),
        "medications": active_medications,
    }
