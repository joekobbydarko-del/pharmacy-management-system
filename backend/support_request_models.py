from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from database import Base


class SupportRequest(Base):
    __tablename__ = "support_requests"

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

    subject = Column(
        String(120),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    status = Column(
        String(50),
        nullable=False,
        default="pending",
    )

    support_response = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )