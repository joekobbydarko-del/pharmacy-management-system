import json
import os
from datetime import datetime
from urllib.parse import urlencode
from urllib.request import urlopen

from dotenv import load_dotenv
from sqlalchemy.orm import Session

from inventory_models import Drug, InventoryItem


load_dotenv()


def parse_datetime(value):
    if not value:
        return None

    try:
        return datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )
    except ValueError:
        return None


def get_google_inventory_data():
    base_url = os.getenv(
        "GOOGLE_APPS_SCRIPT_URL"
    )

    sync_key = os.getenv(
        "GOOGLE_APPS_SCRIPT_SYNC_KEY"
    )

    if not base_url:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_URL is missing from .env"
        )

    if not sync_key:
        raise RuntimeError(
            "GOOGLE_APPS_SCRIPT_SYNC_KEY is missing from .env"
        )

    query = urlencode(
        {
            "action": "dashboard-inventory",
            "key": sync_key,
        }
    )

    url = f"{base_url}?{query}"

    with urlopen(
        url,
        timeout=30,
    ) as response:
        payload = json.loads(
            response.read().decode("utf-8")
        )

    if not payload.get("ok"):
        raise RuntimeError(
            payload.get(
                "error",
                "Google inventory sync failed.",
            )
        )

    return payload


def sync_inventory_from_google(
    db: Session,
):
    payload = get_google_inventory_data()

    drugs = payload.get(
        "drugs",
        [],
    )

    inventory = payload.get(
        "inventory",
        [],
    )

    drug_count = 0
    inventory_count = 0

    try:
        for item in drugs:
            drug_id = str(
                item.get(
                    "Drug_ID",
                    "",
                )
            ).strip()

            if not drug_id:
                continue

            drug = (
                db.query(Drug)
                .filter(
                    Drug.drug_id
                    == drug_id
                )
                .first()
            )

            if drug is None:
                drug = Drug(
                    drug_id=drug_id
                )

                db.add(
                    drug
                )

            drug.drug_name = str(
                item.get(
                    "Drug_Name",
                    "",
                )
            ).strip()

            drug.category = str(
                item.get(
                    "Category",
                    "",
                )
            ).strip()

            drug.cost_price = float(
                item.get(
                    "Cost_Price",
                    0,
                )
                or 0
            )

            drug.monthly_price = float(
                item.get(
                    "Monthly_Price",
                    0,
                )
                or 0
            )

            drug.one_time_price = float(
                item.get(
                    "One_Time_Price",
                    0,
                )
                or 0
            )

            drug.stock_quantity = int(
                item.get(
                    "Stock_Quantity",
                    0,
                )
                or 0
            )

            drug.reorder_level = int(
                item.get(
                    "Reorder_Level",
                    0,
                )
                or 0
            )

            drug_count += 1

        for item in inventory:
            inventory_id = str(
                item.get(
                    "Inventory_ID",
                    "",
                )
            ).strip()

            if not inventory_id:
                continue

            inventory_item = (
                db.query(
                    InventoryItem
                )
                .filter(
                    InventoryItem.inventory_id
                    == inventory_id
                )
                .first()
            )

            if inventory_item is None:
                inventory_item = (
                    InventoryItem(
                        inventory_id=
                        inventory_id
                    )
                )

                db.add(
                    inventory_item
                )

            inventory_item.drug_id = str(
                item.get(
                    "Drug_ID",
                    "",
                )
            ).strip()

            inventory_item.drug_name = str(
                item.get(
                    "Drug_Name",
                    "",
                )
            ).strip()

            inventory_item.stock_quantity = int(
                item.get(
                    "Stock_Quantity",
                    0,
                )
                or 0
            )

            inventory_item.reorder_level = int(
                item.get(
                    "Reorder_Level",
                    0,
                )
                or 0
            )

            inventory_item.stock_status = str(
                item.get(
                    "Stock_Status",
                    "",
                )
            ).strip()

            inventory_item.last_updated = (
                parse_datetime(
                    item.get(
                        "Last_Updated"
                    )
                )
            )

            inventory_count += 1

        db.commit()

        return {
            "ok": True,
            "source": payload.get(
                "source"
            ),
            "drugs_synced":
                drug_count,
            "inventory_synced":
                inventory_count,
        }

    except Exception:
        db.rollback()
        raise