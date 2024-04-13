from fastapi import FastAPI
from app.routers import api_routes

print("Loading FastAPI application...")
app = FastAPI()
print("FastAPI application loaded successfully.")

app.include_router(api_routes.router)