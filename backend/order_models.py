from sqlalchemy import Column, Integer, String, Text, ForeignKey

from database import Base


class MedicineOrder(Base):
    __tablename__ = "medicine_orders"

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

    quantity = Column(
        Integer,
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