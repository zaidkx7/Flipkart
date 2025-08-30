import json

from sqlalchemy import create_engine, func, cast, Float
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

from backend.alchemy.models import Products
from backend.settings.config import DB_URL

class MysqlConnection:
    def __init__(self):
        self.engine = create_engine(DB_URL)
        self.Session = sessionmaker(bind=self.engine)
        self.session = self.Session()

    def get_products(self):
        return self.session.query(Products).all()
    
    def get_products_by_category(self, category: str):
        return self.session.query(Products).filter(Products.category == category).all()
    
    def get_products_by_brand(self, brand: str):
        return self.session.query(Products).filter(Products.title.contains(brand)).all()
    
    def get_product(self, id: int):
        return self.session.query(Products).filter(Products.id == id).first()
    
    def search_products(self, query: str):
        """Search products by title, category, and specifications"""
        # Convert query to lowercase for case-insensitive search
        search_term = f"%{query.lower()}%"
        
        return self.session.query(Products).filter(
            Products.title.ilike(search_term) |
            Products.category.ilike(search_term) |
            Products.specifications.ilike(search_term)
        ).all()
    
    def get_products_by_price_range(self, min_price: float, max_price: float):
        """Filter products by price range"""
        # Extract current price from pricing JSON (non-strikeOff price)
        return self.session.query(Products).filter(
            text("JSON_EXTRACT(pricing, '$.prices[*].value') BETWEEN :min_price AND :max_price")
            .params(min_price=min_price, max_price=max_price)
        ).all()
    
    def get_products_by_rating(self, min_rating: float):
        """Filter products by minimum rating"""
        return self.session.query(Products).filter(
            text("JSON_EXTRACT(rating, '$.average') >= :min_rating")
            .params(min_rating=min_rating)
        ).all()
    
    def get_products_by_availability(self, status: str):
        """Filter products by availability status"""
        return self.session.query(Products).filter(Products.availability == status).all()
    
    def get_product_statistics(self):
        """Get comprehensive product statistics"""
        total_products = self.session.query(Products).count()
        
        # Category breakdown
        category_stats = self.session.query(
            Products.category,
            func.count(Products.id).label('count')
        ).group_by(Products.category).all()
        
        # Availability breakdown
        availability_stats = self.session.query(
            Products.availability,
            func.count(Products.id).label('count')
        ).group_by(Products.availability).all()
        
        # Average rating calculation
        avg_rating_result = self.session.query(
            func.avg(text("JSON_EXTRACT(rating, '$.average')")).label('avg_rating')
        ).scalar()
        
        return {
            'total': total_products,
            'byCategory': {cat: count for cat, count in category_stats},
            'byAvailability': {avail: count for avail, count in availability_stats},
            'avgRating': float(avg_rating_result) if avg_rating_result else 0.0
        }
    
    def get_trending_products(self, limit: int = 10):
        """Get trending products based on rating and review count"""
        # Calculate trending score: (rating * 0.7) + (normalized_reviews * 0.3) * 5
        return self.session.query(Products).filter(
            text("JSON_EXTRACT(rating, '$.average') > 0")
        ).order_by(
            text("""
                (JSON_EXTRACT(rating, '$.average') * 0.7 + 
                 LEAST(JSON_EXTRACT(rating, '$.reviewCount') / 1000.0, 1) * 0.3 * 5) DESC
            """)
        ).limit(limit).all()
    
    def get_discounted_products(self):
        """Get products with active discounts"""
        return self.session.query(Products).filter(
            text("JSON_EXTRACT(pricing, '$.totalDiscount') > 0")
        ).order_by(
            text("JSON_EXTRACT(pricing, '$.totalDiscount') DESC")
        ).all()
    
    def insert(self, data: dict, table=Products):
        product = table(**data)
        self.session.add(product)
        self.session.commit()
    
    def exists(self, product_id: str, table=Products):
        return self.session.query(table).filter(table.product_id == product_id).first() is not None
    
    def commit_all(self):
        self.session.commit()

    def close_all(self):
        self.session.close()

if __name__ == '__main__':
    db = MysqlConnection()
    db.get_products()
    db.close_all()
