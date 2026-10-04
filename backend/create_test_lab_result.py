from datetime import datetime

from database import SessionLocal
from lab_result_models import LabResult
from models import User


db = SessionLocal()

try:
    user_id = int(
        input("Enter patient user ID: ")
    )

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        print(
            f"User {user_id} was not found."
        )

    else:
        result = LabResult(
            user_id=user_id,
            test_name="Blood Glucose",
            result_value="92",
            unit="mg/dL",
            reference_range="70 - 99 mg/dL",
            status="normal",
            notes=(
                "Result is within the "
                "reference range."
            ),
            result_date=datetime.utcnow(),
        )

        db.add(result)
        db.commit()
        db.refresh(result)

        print(
            "Lab result created successfully."
        )

        print(
            f"Lab Result ID: {result.id}"
        )

        print(
            f"Patient: {user.full_name}"
        )

        print(
            f"Test: {result.test_name}"
        )

        print(
            f"Result: {result.result_value} "
            f"{result.unit}"
        )

        print(
            f"Status: {result.status}"
        )

finally:
    db.close()