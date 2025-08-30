from sqlalchemy import (
    Column, Integer, String, DateTime,
    func, Index, Float
)
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Products(Base):
    __tablename__ = 'products'

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(String(128), unique=True)
    title = Column(String(128))
    url = Column(String(128))
    rating = Column(JSON)
    specifications = Column(JSON)
    media = Column(JSON)
    pricing = Column(JSON)
    category = Column(String(128))
    warrantySummary = Column(String(128))
    availability = Column(String(128))
    source = Column(String(32), nullable=False, index=True)
    time_update = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), nullable=False)

    __table_args__ = (
        Index('idx_source', 'source', 'id'),
        Index('ix_time', 'time_update'),
    )
