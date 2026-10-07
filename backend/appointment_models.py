from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
)

from database import Base


class Appointment(Base):
    __tablename__ = "appointments"

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

    appointment_type = Column(
        String(150),
        nullable=False,
    )

    appointment_date = Column(
        String(50),
        nullable=False,
    )

    appointment_time = Column(
        String(50),
        nullable=False,
    )

    note = Column(
        Text,
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="pending",
    )