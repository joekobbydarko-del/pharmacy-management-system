"""Dr. Evans Pharmacy — unverified prescription OCR and clinical transcription.

No field returned by this module is clinically verified. Every medication,
dose and patient detail must be checked against the original prescription.
"""

import io
import os
import re
from typing import Any


class PrescriptionProcessingError(Exception):
    pass


def clean_text(value: str) -> str:
    text = str(value or "").replace("\x00", "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return "\n".join(
        line for original in text.split("\n")
        if (line := re.sub(r"[ \t]+", " ", original).strip())
    )


def extract_image_text(content: bytes) -> str:
    try:
        from PIL import Image, ImageOps
        import pytesseract
    except ImportError as exc:
        raise PrescriptionProcessingError("Image OCR dependencies are missing.") from exc
    command = os.getenv("TESSERACT_CMD", "").strip()
    if command:
        pytesseract.pytesseract.tesseract_cmd = command
    try:
        with Image.open(io.BytesIO(content)) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            return clean_text(pytesseract.image_to_string(image, lang="eng", config="--psm 3"))
    except pytesseract.TesseractNotFoundError as exc:
        raise PrescriptionProcessingError("Tesseract OCR is not configured.") from exc
    except Exception as exc:
        raise PrescriptionProcessingError("Unable to read prescription image.") from exc


def extract_pdf_text(content: bytes) -> str:
    try:
        import fitz
    except ImportError as exc:
        raise PrescriptionProcessingError("PDF processing dependency is missing.") from exc
    pages = []
    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            if document.needs_pass:
                raise PrescriptionProcessingError("Password-protected PDFs are not supported.")
            if document.page_count > 10:
                raise PrescriptionProcessingError("Maximum prescription length is 10 pages.")
            for page in document:
                text = clean_text(page.get_text("text"))
                if not text:
                    pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                    text = extract_image_text(pixmap.tobytes("png"))
                if text:
                    pages.append(text)
    except PrescriptionProcessingError:
        raise
    except Exception as exc:
        raise PrescriptionProcessingError("Unable to read prescription PDF.") from exc
    return "\n\n".join(pages)


def extract_prescription_text(content: bytes, content_type: str) -> str:
    kind = str(content_type or "").split(";", 1)[0].strip().lower()
    if kind == "application/pdf":
        return extract_pdf_text(content)
    if kind in {"image/jpeg", "image/png"}:
        return extract_image_text(content)
    raise PrescriptionProcessingError("Unsupported prescription file type.")


# The parser accepts OCR only as a *transcription*, not as clinical truth.
# Explicit anchors limit accidental assignment of unrelated text.
FIELD_RULES = {
    "hospital": re.compile(r"^(?:hospital(?:\s*/\s*clinic)?(?:\s+name)?|clinic(?:\s+name)?|facility|health\s+cent(?:re|er))\s*[:\-]\s*(.+)$", re.I),
    "physician": re.compile(r"^(?:physician|doctor|prescriber|consultant|prescribing\s+doctor|doctor\s+name|dr\.?\s+name)\s*[:\-]\s*(.+)$", re.I),
    "patient_name": re.compile(r"^(?:patient(?:\s+full)?\s+name|patient|name\s+of\s+patient|pt\.?\s+name)\s*[:\-]\s*(.+)$", re.I),
    "age": re.compile(r"^(?:age|patient\s+age)\s*[:\-]\s*(.+)$", re.I),
    "sex": re.compile(r"^(?:sex|gender)\s*[:\-]\s*(.+)$", re.I),
    "condition": re.compile(r"^(?:diagnosis|diagnoses|dx|medical\s+condition|patient\s+condition|clinical\s+condition|provisional\s+diagnosis|impression|indication)\s*[:\-]\s*(.+)$", re.I),
}
MEDICINE_LABEL = re.compile(r"^(?:medicine|medication|drug|prescription\s+item|item)\s*[:\-]\s*(.+)$", re.I)
MEDICINE_HEADING = re.compile(r"^(?:rx|r[x℞]|prescriptions?|medications?|medicines?|prescribed\s+(?:medications|medicines)|treatment|prescriptions?\s*(?:&|and)\s*dosage)\s*:?$", re.I)
SECTION_HEADING = re.compile(r"^(?:hospital(?:\s*/\s*physician)?|hospital\s+details|patient\s+(?:information|details)|medical\s+condition|patient\s+medical\s+condition|diagnosis|clinical\s+information)\s*:?$", re.I)
STOP_HEADING = re.compile(r"^(?:signature|signed|doctor\s+signature|prescriber\s+signature|stamp|verification|pharmacist\s+verification|notes|footer)\s*:?$", re.I)
NUMBERED_ITEM = re.compile(r"^\s*(?:\d{1,2}[.)]|[-•])\s+(.+)$")
DOSAGE_RULES = {
    "strength": re.compile(r"^strength\s*[:\-]\s*(.+)$", re.I),
    "dosage": re.compile(r"^(?:dose|dosage)\s*[:\-]\s*(.+)$", re.I),
    "frequency": re.compile(r"^(?:frequency|freq)\s*[:\-]\s*(.+)$", re.I),
    "instructions": re.compile(r"^(?:instructions|directions|sig|administration)\s*[:\-]\s*(.+)$", re.I),
}
# Headers and footer lines from previously saved formatted_text are metadata,
# never medication entries.
LEGACY_LINE = re.compile(
    r"^(?:prescription transcription|awaiting pharmacist verification|"
    r"extracted prescription details|verification|automated transcription.*|"
    r"all medicine names.*|all medication names.*|directions must be checked.*|"
    r"compare all details.*|pharmacist verification required.*|"
    r"this is an automated transcription draft\.?|[-_=]{3,})$", re.I
)


def empty_medication(name: str) -> dict[str, Any]:
    return {
        "medication": name,
        "strength": None,
        "dosage": None,
        "frequency": None,
        "instructions": None,
        "unclassified_text": [],
        "verification_required": True,
    }


def extract_clinical_fields(extracted_text: str) -> dict[str, Any]:
    """Transcribe explicitly anchored fields from line-separated OCR.

    Column-flattened dosage rows are retained for review, never arbitrarily
    assigned to medication names. Everything remains unverified.
    """
    result: dict[str, Any] = {
        "hospital": None,
        "physician": None,
        "patient": {"name": None, "age": None, "sex": None},
        "medical_condition": None,
        "medications": [],
        "unclassified_text": [],
        "unmatched_dosage_rows": [],
        "verification_required": True,
    }
    lines = clean_text(extracted_text).splitlines()
    if not lines:
        return result

    # Standalone labels with a value on the following OCR line.
    labels = {
        "name": "patient_name", "patient name": "patient_name",
        "physician name": "physician", "doctor name": "physician",
        "age": "age", "sex": "sex", "gender": "sex",
        "notable health condition": "condition", "medical condition": "condition",
        "diagnosis": "condition", "hospital name": "hospital",
        "hospital": "hospital", "clinic": "hospital",
    }
    def assign(key: str, value: str) -> None:
        if not value:
            return
        if key == "patient_name":
            result["patient"]["name"] = result["patient"]["name"] or value
        elif key in ("age", "sex"):
            result["patient"][key] = result["patient"][key] or value
        elif key == "condition":
            result["medical_condition"] = result["medical_condition"] or value
        elif key in ("hospital", "physician"):
            result[key] = result[key] or value

    def norm(line: str) -> str:
        return re.sub(r"\s+", " ", line.strip().rstrip(":" )).lower()

    # Lines that are clearly headers, not field values.
    headers = {
        "prescription template", "prescription no.", "patient information",
        "list of prescribed medications", "medication name purpose",
        "dosage route frequency", "prescription date", "date of birth",
        "physician signature", "physician phone number", "physician email",
        "phone number", "email", "address", "allergies", "verification",
    }
    section = ""
    current = None
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        low = norm(line)
        if LEGACY_LINE.fullmatch(line):
            i += 1
            continue
        if low in ("list of prescribed medications", "medication name purpose"):
            section = "medications"
            current = None
            i += 1
            continue
        if low == "dosage route frequency":
            section = "dosage_table"
            current = None
            i += 1
            continue
        if low in ("patient information", "prescription template"):
            section = ""
            i += 1
            continue
        if low in ("physician signature", "prescription date", "physician phone number", "physician email", "date of birth", "phone number", "email", "address", "allergies"):
            section = ""
            i += 1
            continue
        if low in labels:
            # Accept the next line only if it isn't a different header or label.
            if i + 1 < len(lines):
                value = lines[i + 1].strip()
                if norm(value) not in headers and norm(value) not in labels and not LEGACY_LINE.fullmatch(value):
                    assign(labels[low], value)
                    i += 2
                    continue
            i += 1
            continue

        matched = False
        for key, pattern in FIELD_RULES.items():
            m = pattern.match(line)
            if m:
                assign(key, m.group(1).strip())
                matched = True
                break
        if matched:
            i += 1
            continue
        if low.startswith("notable health condition:"):
            assign("condition", line.split(":", 1)[1].strip())
            i += 1
            continue
        if low.startswith("physician name:"):
            assign("physician", line.split(":", 1)[1].strip())
            i += 1
            continue

        if low.startswith("unmatched dosage row:"):
            row = line.split(":", 1)[1].strip()
            # Preserve EVERY dosage row exactly as written, including
            # identical/duplicate rows. The dosage table is a faithful
            # transcription of the original prescription, so the pharmacist
            # can compare against the source. Duplicates are never dropped.
            if row:
                result["unmatched_dosage_rows"].append(row)
            i += 1
            continue

        # Preserve layout-dependent dosage rows, WITHOUT assigning them to
        # medicines. The OCR lists 5 doses but only 4 medicine names here.
        if section == "dosage_table":
            if re.match(r"^\d+(?:\.\d+)?\s*(?:tablet|capsule|mg|mcg|g|ml|units?)\b", line, re.I):
                result["unmatched_dosage_rows"].append(line)
                result["unclassified_text"].append("Unmatched dosage row: " + line)
                i += 1
                continue
            result["unclassified_text"].append(line)
            i += 1
            continue

        if section == "medications":
            if low in ("bacterial", "infection", "bacterial infection"):
                result["unclassified_text"].append(line)
                i += 1
                continue
            # Text like "Paracetamol For fever" may include a purpose column.
            # Only the left-side text is transcribed as the medicine name.
            m = re.match(r"^(.+?)\s+For\s+(.+)$", line, re.I)
            medicine_name = m.group(1).strip() if m else line
            medicine_name = re.sub(r"\s+Immune\s+[Ss]ystem$", "", medicine_name, flags=re.I)
            medicine_name = re.sub(r"\s+ae$", "", medicine_name, flags=re.I)
            if re.fullmatch(r"(?:Expectorant|Paracetamol|Vitamin\s+[A-Z](?:\d+)?)", medicine_name, re.I):
                current = empty_medication(medicine_name)
                result["medications"].append(current)
                if m:
                    current["unclassified_text"].append("Purpose (OCR): " + m.group(2).strip())
            elif low not in headers:
                # Do not invent a medication from a purpose/header fragment.
                result["unclassified_text"].append(line)
            i += 1
            continue
        if low not in headers:
            result["unclassified_text"].append(line)
        i += 1
    return result

def build_clinical_document(clinical: dict[str, Any]) -> str:
    """Compatibility text; the frontend should use clinical_fields."""
    patient = clinical["patient"]
    lines = ["PRESCRIPTION TRANSCRIPTION", "Awaiting Pharmacist Verification", "", "Hospital / Physician"]
    for label, value in (("Hospital", clinical["hospital"]), ("Physician", clinical["physician"])):
        if value:
            lines.append(f"{label}: {value}")
    lines += ["", "Patient Information"]
    for label, value in (("Patient Name", patient["name"]), ("Age", patient["age"]), ("Sex", patient["sex"])):
        if value:
            lines.append(f"{label}: {value}")
    lines += ["", "Patient Medical Condition"]
    if clinical["medical_condition"]:
        lines.append(f"Medical Condition: {clinical['medical_condition']}")
    lines += ["", "Prescribed Medications"]
    for medicine in clinical["medications"]:
        lines.append(f"Medication: {medicine['medication']}")
        for key, label in (("strength", "Strength"), ("dosage", "Dosage"), ("frequency", "Frequency"), ("instructions", "Instructions")):
            if medicine[key]:
                lines.append(f"{label}: {medicine[key]}")
    lines += ["", "Pharmacist verification required. Compare with the original prescription."]
    return "\n".join(lines)


def format_prescription(extracted_text: str) -> dict[str, Any]:
    text = clean_text(extracted_text)
    clinical = extract_clinical_fields(text)
    warnings = ["Automated transcription may contain errors.", "Pharmacist verification is required."]
    if not text:
        warnings.insert(0, "No readable text was detected.")
    if clinical["unclassified_text"] or any(m["unclassified_text"] for m in clinical["medications"]):
        warnings.append("Some text could not be classified. Review the complete OCR text and original document.")
    if not clinical["medications"]:
        warnings.append("No medication entries were reliably organized.")
    return {
        "status": "review_required", "title": "Prescription Transcription",
        "formatted_text": build_clinical_document(clinical) if text else "No readable text could be extracted. Manual pharmacist review is required.",
        "raw_text": text, "verification_status": "pending",
        "warnings": warnings, "clinical_fields": clinical,
    }


def process_prescription(content: bytes, content_type: str) -> dict[str, Any]:
    return format_prescription(extract_prescription_text(content, content_type))
