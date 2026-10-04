from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from database import Base


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(
        String(180),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    reminder_type = Column(
        String(80),
        nullable=False,
        default="general",
    )

    reminder_date = Column(
        DateTime,
        nullable=False,
    )

    is_completed = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )