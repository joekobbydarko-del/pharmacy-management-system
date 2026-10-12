
"""
DR. EVANS PHARMACY
REMOTE PHARMACY APPLICATION

Preserves the existing FastAPI application,
all original routes and the new remote-pharmacy
medication services.
"""

from main import app

from patient_medications import (
    router as patient_medications_router,
)

from prescription_verification import (
    router as prescription_verification_router,
)

from staff_portals import (
    router as staff_portals_router,
)


# ============================================================
# PATIENT MEDICATION SERVICES
# ============================================================

app.include_router(
    patient_medications_router
)


# ============================================================
# PHARMACIST VERIFICATION SERVICES
# ============================================================

app.include_router(
    prescription_verification_router
)


# ============================================================
# STAFF PORTALS (PHARMACIST & PHARMACY TECHNICIAN)
#
# Authentication and empty landing pages only. Operational
# features are added later once the doctors provide their
# requirements.
# ============================================================

app.include_router(
    staff_portals_router
)


# ============================================================
# SYSTEM STATUS
# ============================================================

@app.get(
    "/system/remote-pharmacy-status",
    tags=["System"],
)
def remote_pharmacy_status():
    return {
        "application": "Dr. Evans Pharmacy",
        "model": "Remote Pharmacy",
        "patient_medications": "registered",
        "prescription_uploads": "enabled",
        "prescription_text_extraction": "enabled",
        "prescription_verification": "registered",
        "electronic_payments": "not yet implemented",
    }
