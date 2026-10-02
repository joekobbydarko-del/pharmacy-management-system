from sqlalchemy import Column, Integer, String, Text, ForeignKey

from database import Base


class Prescription(Base):
    __tablename__ = "prescriptions"

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

    medicine_name = Column(
        String(255),
        nullable=False
    )

    dosage = Column(
        String(100),
        nullable=False
    )

    frequency = Column(
        String(100),
        nullable=False
    )

    instructions = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        nullable=False,
        default="active"
    )