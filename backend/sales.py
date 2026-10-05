from datetime import date, datetime, timedelta
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User
from pos_models import POSSale, POSSaleItem
from security import decode_access_token


router = APIRouter(
    prefix="/admin/sales",
    tags=["Admin Sales"],
)

security = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    payload = decode_access_token(
        credentials.credentials
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    user_id = payload.get(
        "sub"
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload.",
        )

    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    role = str(
        user.role or ""
    ).strip().lower()

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required.",
        )

    return user


def decimal_to_float(
    value,
):
    if value is None:
        return 0.0

    if isinstance(
        value,
        Decimal,
    ):
        return float(value)

    return float(value)


def start_of_day(
    value: date,
):
    return datetime.combine(
        value,
        datetime.min.time(),
    )


def end_of_day(
    value: date,
):
    return datetime.combine(
        value,
        datetime.max.time(),
    )


@router.get("/summary")
def get_sales_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    today = date.today()

    today_start = start_of_day(
        today
    )

    today_end = end_of_day(
        today
    )

    week_start = (
        today
        -
        timedelta(
            days=today.weekday()
        )
    )

    month_start = today.replace(
        day=1
    )


    total_sales = (
        db.query(
            func.coalesce(
                func.sum(
                    POSSale.total_amount
                ),
                0,
            )
        )
        .filter(
            POSSale.status
            == "completed"
        )
        .scalar()
    )


    total_transactions = (
        db.query(POSSale)
        .filter(
            POSSale.status
            == "completed"
        )
        .count()
    )


    today_sales = (
        db.query(
            func.coalesce(
                func.sum(
                    POSSale.total_amount
                ),
                0,
            )
        )
        .filter(
            POSSale.status
            == "completed",
            POSSale.created_at
            >= today_start,
            POSSale.created_at
            <= today_end,
        )
        .scalar()
    )


    today_transactions = (
        db.query(POSSale)
        .filter(
            POSSale.status
            == "completed",
            POSSale.created_at
            >= today_start,
            POSSale.created_at
            <= today_end,
        )
        .count()
    )


    week_sales = (
        db.query(
            func.coalesce(
                func.sum(
                    POSSale.total_amount
                ),
                0,
            )
        )
        .filter(
            POSSale.status
            == "completed",
            POSSale.created_at
            >= start_of_day(
                week_start
            ),
        )
        .scalar()
    )


    month_sales = (
        db.query(
            func.coalesce(
                func.sum(
                    POSSale.total_amount
                ),
                0,
            )
        )
        .filter(
            POSSale.status
            == "completed",
            POSSale.created_at
            >= start_of_day(
                month_start
            ),
        )
        .scalar()
    )


    average_sale = 0.0

    if total_transactions > 0:
        average_sale = (
            decimal_to_float(
                total_sales
            )
            /
            total_transactions
        )


    return {
        "total_sales":
            decimal_to_float(
                total_sales
            ),

        "total_transactions":
            total_transactions,

        "today_sales":
            decimal_to_float(
                today_sales
            ),

        "today_transactions":
            today_transactions,

        "week_sales":
            decimal_to_float(
                week_sales
            ),

        "month_sales":
            decimal_to_float(
                month_sales
            ),

        "average_sale":
            round(
                average_sale,
                2,
            ),
    }


@router.get("/transactions")
def get_sales_transactions(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    safe_limit = max(
        1,
        min(
            limit,
            500,
        ),
    )

    sales = (
        db.query(POSSale)
        .filter(
            POSSale.status
            == "completed"
        )
        .order_by(
            POSSale.created_at.desc()
        )
        .limit(
            safe_limit
        )
        .all()
    )

    transactions = []

    for sale in sales:
        transactions.append(
            {
                "id":
                    sale.id,

                "sale_number":
                    sale.sale_number,

                "customer_name":
                    sale.customer_name,

                "customer_type":
                    sale.customer_type,

                "payment_method":
                    sale.payment_method,

                "subtotal":
                    decimal_to_float(
                        sale.subtotal
                    ),

                "total_amount":
                    decimal_to_float(
                        sale.total_amount
                    ),

                "amount_paid":
                    decimal_to_float(
                        sale.amount_paid
                    ),

                "change_amount":
                    decimal_to_float(
                        sale.change_amount
                    ),

                "status":
                    sale.status,

                "created_at":
                    (
                        sale.created_at
                        .isoformat()
                        if sale.created_at
                        else None
                    ),

                "item_count":
                    len(
                        sale.items
                    ),
            }
        )

    return {
        "transactions":
            transactions,

        "count":
            len(
                transactions
            ),
    }


@router.get("/top-products")
def get_top_selling_products(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    safe_limit = max(
        1,
        min(
            limit,
            50,
        ),
    )

    rows = (
        db.query(
            POSSaleItem.drug_id,
            POSSaleItem.drug_name,
            func.sum(
                POSSaleItem.quantity
            ).label(
                "units_sold"
            ),
            func.sum(
                POSSaleItem.total_price
            ).label(
                "revenue"
            ),
        )
        .join(
            POSSale,
            POSSale.id
            ==
            POSSaleItem.sale_id,
        )
        .filter(
            POSSale.status
            ==
            "completed"
        )
        .group_by(
            POSSaleItem.drug_id,
            POSSaleItem.drug_name,
        )
        .order_by(
            func.sum(
                POSSaleItem.quantity
            ).desc()
        )
        .limit(
            safe_limit
        )
        .all()
    )

    products = []

    for row in rows:
        products.append(
            {
                "drug_id":
                    row.drug_id,

                "drug_name":
                    row.drug_name,

                "units_sold":
                    int(
                        row.units_sold
                        or 0
                    ),

                "revenue":
                    decimal_to_float(
                        row.revenue
                    ),
            }
        )

    return {
        "products":
            products,

        "count":
            len(
                products
            ),
    }


@router.get("/daily")
def get_daily_sales(
    days: int = 7,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    safe_days = max(
        1,
        min(
            days,
            31,
        ),
    )

    today = date.today()

    start_date = (
        today
        -
        timedelta(
            days=safe_days - 1
        )
    )

    rows = (
        db.query(
            func.date(
                POSSale.created_at
            ).label(
                "sale_date"
            ),
            func.sum(
                POSSale.total_amount
            ).label(
                "total_sales"
            ),
            func.count(
                POSSale.id
            ).label(
                "transactions"
            ),
        )
        .filter(
            POSSale.status
            ==
            "completed",
            POSSale.created_at
            >=
            start_of_day(
                start_date
            ),
        )
        .group_by(
            func.date(
                POSSale.created_at
            )
        )
        .order_by(
            func.date(
                POSSale.created_at
            ).asc()
        )
        .all()
    )

    row_map = {
        str(
            row.sale_date
        ): {
            "sales":
                decimal_to_float(
                    row.total_sales
                ),

            "transactions":
                int(
                    row.transactions
                    or 0
                ),
        }

        for row
        in rows
    }


    daily = []

    for offset in range(
        safe_days
    ):
        current_date = (
            start_date
            +
            timedelta(
                days=offset
            )
        )

        key = str(
            current_date
        )

        values = row_map.get(
            key,
            {
                "sales": 0.0,
                "transactions": 0,
            },
        )

        daily.append(
            {
                "date":
                    key,

                "sales":
                    values[
                        "sales"
                    ],

                "transactions":
                    values[
                        "transactions"
                    ],
            }
        )

    return {
        "daily":
            daily,

        "days":
            safe_days,
    }