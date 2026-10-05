from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
)

from sqlalchemy.orm import relationship

from database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    purchase_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    supplier_name = Column(
        String(150),
        nullable=False,
    )

    reference_number = Column(
        String(100),
        nullable=True,
    )

    payment_status = Column(
        String(50),
        nullable=False,
        default="pending",
    )

    status = Column(
        String(50),
        nullable=False,
        default="received",
    )

    subtotal = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    created_by = Column(
        Integer,
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    items = relationship(
        "PurchaseItem",
        back_populates="purchase",
        cascade="all, delete-orphan",
    )


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    purchase_id = Column(
        Integer,
        ForeignKey(
            "purchases.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    drug_id = Column(
        String(50),
        nullable=False,
        index=True,
    )

    drug_name = Column(
        String(150),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
        default=1,
    )

    unit_cost = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    total_cost = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    purchase = relationship(
        "Purchase",
        back_populates="items",
    )