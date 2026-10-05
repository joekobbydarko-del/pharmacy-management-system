from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
)

from database import Base


class Drug(Base):
    __tablename__ = "drugs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    drug_id = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    drug_name = Column(
        String(150),
        nullable=False,
    )

    category = Column(
        String(100),
        nullable=True,
    )

    cost_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    monthly_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    one_time_price = Column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    stock_quantity = Column(
        Integer,
        nullable=False,
        default=0,
    )

    reorder_level = Column(
        Integer,
        nullable=False,
        default=0,
    )


class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    inventory_id = Column(
        String(50),
        unique=True,
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

    stock_quantity = Column(
        Integer,
        nullable=False,
        default=0,
    )

    reorder_level = Column(
        Integer,
        nullable=False,
        default=0,
    )

    stock_status = Column(
        String(50),
        nullable=True,
    )

    last_updated = Column(
        DateTime,
        nullable=True,
    )