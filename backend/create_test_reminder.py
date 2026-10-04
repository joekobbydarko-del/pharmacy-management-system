from datetime import datetime, timedelta

from database import SessionLocal
from reminder_models import Reminder
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
        reminder = Reminder(
            user_id=user_id,
            title="Medicine Refill Reminder",
            message=(
                "Your medication refill is due soon."
            ),
            reminder_date=(
                datetime.utcnow()
                + timedelta(days=2)
            ),
            is_completed=False,
            created_at=datetime.utcnow(),
        )

        db.add(reminder)
        db.commit()
        db.refresh(reminder)

        print(
            "Reminder created successfully."
        )

        print(
            f"Reminder ID: {reminder.id}"
        )

        print(
            f"Patient: {user.full_name}"
        )

        print(
            f"Title: {reminder.title}"
        )

        print(
            f"Reminder Date: {reminder.reminder_date}"
        )

        print(
            f"Completed: {reminder.is_completed}"
        )

finally:
    db.close()