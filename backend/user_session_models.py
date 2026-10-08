from datetime import (
    datetime,
    timezone,
)

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from database import Base


def utc_now():
    return datetime.now(
        timezone.utc
    )


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    session_id = Column(
        String(80),
        unique=True,
        nullable=False,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id"
        ),
        nullable=False,
        index=True,
    )

    browser = Column(
        String(120),
        nullable=True,
    )

    device_type = Column(
        String(80),
        nullable=True,
    )

    platform = Column(
        String(120),
        nullable=True,
    )

    user_agent = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime(
            timezone=True
        ),
        nullable=False,
        default=utc_now,
    )

    last_seen_at = Column(
        DateTime(
            timezone=True
        ),
        nullable=False,
        default=utc_now,
    )

    revoked_at = Column(
        DateTime(
            timezone=True
        ),
        nullable=True,
    )