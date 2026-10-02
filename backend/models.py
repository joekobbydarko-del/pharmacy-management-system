from sqlalchemy import Boolean, Column, Integer, String
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    full_name = Column(String(150), nullable=False)

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(50),
        nullable=False,
        default="patient"
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )