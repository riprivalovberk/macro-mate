from sqlalchemy import Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
import uuid

Base = declarative_base()

class UserInfo(Base):
    __tablename__ = 'user_info'  # Defines the table name in the database

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)  # Unique UUID for each user
    first_name = Column(String(50))
    last_name = Column(String(50))
    birth_date = Column(Date)
    email = Column(String(100), unique=True)  # Assuming email should be unique
    height = Column(Float)  # Store height as a floating-point number
    sex = Column(String(1))  # M/F
