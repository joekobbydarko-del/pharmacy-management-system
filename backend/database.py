import os

from dotenv import load_dotenv

from sqlalchemy import (
    create_engine,
    inspect,
    text,
)

from sqlalchemy.orm import (
    declarative_base,
    sessionmaker,
)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not configured."
    )


# ============================================================
# ENGINE
# ============================================================

engine = create_engine(
    DATABASE_URL
)


# ============================================================
# SESSION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# BASE
# ============================================================

Base = declarative_base()


# ============================================================
# SMALL DATABASE MIGRATION
#
# Keeps existing appointment records and adds the new
# appointment-management columns when they do not yet exist.
# ============================================================

def ensure_appointment_columns():
    inspector = inspect(
        engine
    )

    table_names = (
        inspector.get_table_names()
    )

    if "appointments" not in table_names:
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns(
            "appointments"
        )
    }

    dialect = (
        engine.dialect.name
        .strip()
        .lower()
    )

    if dialect == "postgresql":
        datetime_type = "TIMESTAMP"

    elif dialect == "mysql":
        datetime_type = "DATETIME"

    else:
        datetime_type = "DATETIME"

    migrations = []

    if (
        "doctor_note"
        not in existing_columns
    ):
        migrations.append(
            (
                "doctor_note",
                "ALTER TABLE appointments "
                "ADD COLUMN doctor_note TEXT"
            )
        )

    if (
        "approved_by"
        not in existing_columns
    ):
        migrations.append(
            (
                "approved_by",
                "ALTER TABLE appointments "
                "ADD COLUMN approved_by INTEGER"
            )
        )

    if (
        "approved_at"
        not in existing_columns
    ):
        migrations.append(
            (
                "approved_at",
                (
                    "ALTER TABLE appointments "
                    "ADD COLUMN approved_at "
                    f"{datetime_type}"
                )
            )
        )

    if (
        "created_at"
        not in existing_columns
    ):
        migrations.append(
            (
                "created_at",
                (
                    "ALTER TABLE appointments "
                    "ADD COLUMN created_at "
                    f"{datetime_type}"
                )
            )
        )

    if (
        "updated_at"
        not in existing_columns
    ):
        migrations.append(
            (
                "updated_at",
                (
                    "ALTER TABLE appointments "
                    "ADD COLUMN updated_at "
                    f"{datetime_type}"
                )
            )
        )

    if not migrations:
        return

    with engine.begin() as connection:
        for (
            column_name,
            sql,
        ) in migrations:
            connection.execute(
                text(sql)
            )

            print(
                (
                    "[DB MIGRATION] Added "
                    f"appointments.{column_name}"
                )
            )