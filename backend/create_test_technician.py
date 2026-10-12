"""
Dr. Evans Pharmacy — create ONE test Pharmacy Technician account.

Safe by design:
  - No hardcoded credentials; all values are entered interactively.
  - Password is read with getpass (never echoed / never in history).
  - Password is stored only as a hash via the existing hash_password().
  - Insert-only: never updates or deletes existing users, so Admin,
    Patient and Pharmacist accounts and all existing data are preserved.
  - Refuses to run if the email already exists.
  - Connects only to the configured development database (DATABASE_URL
    from .env, via database.SessionLocal).

Development-only helper. Run manually, once, by a developer.
Not wired into any endpoint and never executed automatically.
"""

import getpass

from database import SessionLocal
from models import User
from security import hash_password


def main():
    db = SessionLocal()

    try:
        print()
        print("=== Dr. Evans Pharmacy — Create Test Technician ===")
        print()

        full_name = input("Full name: ").strip()
        email = input("Email: ").strip().lower()
        password = getpass.getpass("Password: ")
        confirm = getpass.getpass("Confirm password: ")

        if not full_name or not email:
            print("Full name and email are required.")
            return

        if password != confirm:
            print("Passwords do not match. No account was created.")
            return

        if len(password) < 8:
            print("Password must be at least 8 characters.")
            return

        existing = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if existing:
            print(
                "An account already exists for "
                f"{email}. No changes were made."
            )
            return

        new_user = User(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="technician",
            is_active=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        print()
        print("Technician account created successfully.")
        print(f"User ID: {new_user.id}")
        print(f"Name:    {new_user.full_name}")
        print(f"Email:   {new_user.email}")
        print(f"Role:    {new_user.role}")

    except Exception as error:
        db.rollback()
        print()
        print("Technician account could not be created.")
        print(f"Error: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
