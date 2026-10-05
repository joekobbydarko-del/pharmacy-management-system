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


class POSSale(Base):
    __tablename__ = "pos_sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sale_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    customer_name = Column(
        String(150),
        nullable=True,
    )

    customer_type = Column(
        String(50),
        nullable=False,
        default="walk_in",
    )

    patient_id = Column(
        Integer,
        nullable=True,
        index=True,
    )

    payment_method = Column(
        String(50),
        nullable=False,
        default="cash",
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

    amount_paid = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    change_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    status = Column(
        String(50),
        nullable=False,
        default="completed",
    )

    sold_by = Column(
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
        "POSSaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
    )


class POSSaleItem(Base):
    __tablename__ = "pos_sale_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    sale_id = Column(
        Integer,
        ForeignKey(
            "pos_sales.id",
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

    unit_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    total_price = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    sale = relationship(
        "POSSale",
        back_populates="items",
    )