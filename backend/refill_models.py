from sqlalchemy import Column, Integer, String, Text, ForeignKey

from database import Base


class RefillRequest(Base):
    __tablename__ = "refill_requests"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    prescription_id = Column(
        Integer,
        ForeignKey("prescriptions.id"),
        nullable=False
    )

    notes = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="pending"
    )