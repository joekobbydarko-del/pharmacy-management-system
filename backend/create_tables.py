from database import Base, engine

from models import User
from order_models import MedicineOrder
from inventory_models import Drug, InventoryItem
from pos_models import POSSale, POSSaleItem
from purchase_models import Purchase, PurchaseItem
from supplier_models import Supplier


Base.metadata.create_all(
    bind=engine
)

print(
    "Database tables created successfully."
)