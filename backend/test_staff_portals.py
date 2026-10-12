"""
Automated tests for the Staff Portals authentication
(Pharmacist & Pharmacy Technician identity endpoints).

Coverage:
  - pharmacist token  -> pharmacist guard passes
  - technician token  -> technician guard passes
  - wrong role        -> 403 (cross-role isolation)
  - inactive account  -> 403
  - invalid token     -> 401
  - role constants    -> centralized and correct

Isolation:
  - Uses a throwaway temporary SQLite database. NO production
    PostgreSQL data is read, written, or modified.
  - Standard library only (no pytest/httpx dependency).

Run with:
    python -m unittest test_staff_portals -v
"""

import os
import tempfile
import unittest

# database.py raises if DATABASE_URL is missing. Provide a
# throwaway value so the import succeeds. The real engine is
# never used; each test uses its own isolated SQLite session.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://user:pass@localhost:5432/unused_test_db",
)

from datetime import datetime, timedelta, timezone
from unittest import mock

import jwt as pyjwt
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from models import User
from security import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
)
from staff_portals import (
    ROLE_ADMIN,
    ROLE_PATIENT,
    ROLE_PHARMACIST,
    ROLE_TECHNICIAN,
    get_current_pharmacist,
    get_current_technician,
    serialize_staff_identity,
)


class _Creds:
    """Minimal stand-in for HTTPAuthorizationCredentials."""

    def __init__(self, token):
        self.credentials = token


def _decode_without_session(token):
    """
    Decode a JWT directly (real signature + expiry checks) WITHOUT
    the production database session lookup that the app's
    decode_access_token performs. This keeps the staff role-guard
    tests fully isolated from PostgreSQL while still validating
    the real token structure.

    Mirrors the real decode_access_token contract: invalid or
    expired tokens raise ValueError so callers return 401.
    """
    try:
        return pyjwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except pyjwt.exceptions.InvalidTokenError as exc:
        raise ValueError("Invalid or expired authentication token") from exc


def _make_token(user_id, role):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=60),
    }
    return pyjwt.encode(
        payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM
    )


# Patch decode_access_token for the whole test module so the guard
# tests never touch the production database session machinery.
_patcher = mock.patch(
    "staff_portals.decode_access_token",
    side_effect=_decode_without_session,
)


def setUpModule():
    _patcher.start()


def tearDownModule():
    _patcher.stop()



class StaffPortalAuthTests(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.NamedTemporaryFile(
            suffix=".sqlite", delete=False
        )
        cls._tmp.close()
        cls.engine = create_engine(
            "sqlite:///" + cls._tmp.name
        )
        User.__table__.create(bind=cls.engine, checkfirst=True)
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
            id=5001, full_name="Dr Pharmacist",
            email="pharm@test.local", password_hash="x",
            role=ROLE_PHARMACIST, is_active=True,
        )
        self.technician = User(
            id=5002, full_name="Tech Two",
            email="tech@test.local", password_hash="x",
            role=ROLE_TECHNICIAN, is_active=True,
        )
        self.patient = User(
            id=5003, full_name="Pat Three",
            email="pat@test.local", password_hash="x",
            role=ROLE_PATIENT, is_active=True,
        )
        self.inactive_pharmacist = User(
            id=5004, full_name="Dr Inactive",
            email="inactive@test.local", password_hash="x",
            role=ROLE_PHARMACIST, is_active=False,
        )
        self.db.add_all([
            self.pharmacist,
            self.technician,
            self.patient,
            self.inactive_pharmacist,
        ])
        self.db.commit()

    def tearDown(self):
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    # ----------------------------------------------------------
    def _assert_forbidden(self, func, creds):
        with self.assertRaises(HTTPException) as ctx:
            func(creds, self.db)
        self.assertEqual(ctx.exception.status_code, 403)

    def _assert_unauthorized(self, func, creds):
        with self.assertRaises(HTTPException) as ctx:
            func(creds, self.db)
        self.assertEqual(ctx.exception.status_code, 401)

    # ----------------------------------------------------------
    def test_role_constants(self):
        self.assertEqual(ROLE_PHARMACIST, "pharmacist")
        self.assertEqual(ROLE_TECHNICIAN, "technician")
        self.assertEqual(ROLE_PATIENT, "patient")
        self.assertEqual(ROLE_ADMIN, "admin")

    # ----------------------------------------------------------
    def test_pharmacist_can_access_pharmacist_endpoint(self):
        creds = _Creds(_make_token(self.pharmacist.id, ROLE_PHARMACIST))
        user = get_current_pharmacist(creds, self.db)
        self.assertEqual(user.id, self.pharmacist.id)

        identity = serialize_staff_identity(user, "pharmacist")
        self.assertEqual(identity["portal"], "pharmacist")
        self.assertEqual(identity["role"], "pharmacist")
        self.assertTrue(identity["is_active"])

    # ----------------------------------------------------------
    def test_technician_can_access_technician_endpoint(self):
        creds = _Creds(_make_token(self.technician.id, ROLE_TECHNICIAN))
        user = get_current_technician(creds, self.db)
        self.assertEqual(user.id, self.technician.id)

        identity = serialize_staff_identity(user, "technician")
        self.assertEqual(identity["portal"], "technician")
        self.assertEqual(identity["role"], "technician")

    # ----------------------------------------------------------
    def test_cross_role_isolation(self):
        # A technician must NOT pass the pharmacist guard.
        self._assert_forbidden(
            get_current_pharmacist,
            _Creds(_make_token(self.technician.id, ROLE_TECHNICIAN)),
        )
        # A pharmacist must NOT pass the technician guard.
        self._assert_forbidden(
            get_current_technician,
            _Creds(_make_token(self.pharmacist.id, ROLE_PHARMACIST)),
        )
        # A patient must NOT pass either staff guard.
        self._assert_forbidden(
            get_current_pharmacist,
            _Creds(_make_token(self.patient.id, ROLE_PATIENT)),
        )
        self._assert_forbidden(
            get_current_technician,
            _Creds(_make_token(self.patient.id, ROLE_PATIENT)),
        )

    # ----------------------------------------------------------
    def test_inactive_staff_is_forbidden(self):
        self._assert_forbidden(
            get_current_pharmacist,
            _Creds(_make_token(self.inactive_pharmacist.id, ROLE_PHARMACIST)),
        )

    # ----------------------------------------------------------
    def test_invalid_token_is_unauthorized(self):
        self._assert_unauthorized(
            get_current_pharmacist,
            _Creds("not-a-real-token"),
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)

