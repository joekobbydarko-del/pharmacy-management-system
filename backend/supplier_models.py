from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Integer,
    String,
)

from database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    supplier_code = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    supplier_name = Column(
        String(150),
        nullable=False,
        index=True,
    )

    contact_person = Column(
        String(150),
        nullable=True,
    )

    phone = Column(
        String(50),
        nullable=True,
    )

    email = Column(
        String(255),
        nullable=True,
    )

    address = Column(
        String(255),
        nullable=True,
    )

    notes = Column(
        String(500),
        nullable=True,
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )