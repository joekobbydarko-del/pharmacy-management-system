from database import Base, engine
from models import User
from order_models import MedicineOrder


Base.metadata.create_all(bind=engine)

print("Database tables created successfully.")