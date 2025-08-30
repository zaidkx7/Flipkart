import uvicorn

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routers import products

app = FastAPI(title='Products API', description='API for flipkart scraped products', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix='/api', tags=['api'])
api_router.include_router(products.router)

@app.get('/')
async def root():
    return {'message': 'Welcome to the Products API'}

app.include_router(api_router)

if __name__ == '__main__':
    uvicorn.run("backend.api.main:app", host='0.0.0.0', port=8000, reload=True)
