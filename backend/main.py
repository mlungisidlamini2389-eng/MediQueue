from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import initialize_database
from app.routers.auth import router as auth_router
from app.routers.consultations import router as consultations_router
from app.routers.appointments import router as appointments_router
from app.routers.admin import router as admin_router

app = FastAPI(title="MediQueue API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

initialize_database()
app.include_router(auth_router)
app.include_router(consultations_router)
app.include_router(appointments_router)
app.include_router(admin_router)


@app.get("/health")
def health_check():
	return {"status": "ok"}
