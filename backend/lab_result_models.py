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


class LabResult(Base):
    __tablename__ = "lab_results"

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

    test_name = Column(
        String(180),
        nullable=False,
    )

    result_value = Column(
        String(100),
        nullable=False,
    )

    unit = Column(
        String(50),
        nullable=True,
    )

    reference_range = Column(
        String(120),
        nullable=True,
    )

    status = Column(
        String(50),
        nullable=False,
        default="normal",
    )

    notes = Column(
        Text,
        nullable=True,
    )

    result_date = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )