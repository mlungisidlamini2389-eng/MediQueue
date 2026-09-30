import json
import uuid
from app.services.notification_service import notification_statuses
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.database import get_connection
from app.routers.auth import get_current_user
from app.schemas.consultation import (
	ConsultationCreate,
	ConsultationResponse,
	ConsultationSummaryResponse,
)
from app.services.ai_service import generate_patient_summary, generate_saved_summary, stored_summary
from app.schemas.user import UserResponse

router = APIRouter(prefix="/consultations", tags=["consultations"])
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@router.get("/mine/latest")
def latest_patient_consultation(user: UserResponse = Depends(get_current_user)):
	with get_connection() as connection:
		row = connection.execute(
			"SELECT * FROM consultations WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1",
			(user.id,),
		).fetchone()
		if not row:
			return None
		appointment = connection.execute(
			"SELECT id, starts_at, department, location, status FROM appointments WHERE consultation_id = ? LIMIT 1",
			(row["id"],),
		).fetchone()
		offers = connection.execute(
			"SELECT id, starts_at, department, location, status FROM appointment_offers WHERE consultation_id = ? ORDER BY starts_at",
			(row["id"],),
		).fetchall()
	return {
		"id": row["id"],
		"symptoms": json.loads(row["symptoms"]),
		"duration": row["duration"],
		"impact": row["impact"],
		"history": row["history"],
		"medicines": row["medicines"],
		"notes": row["notes"],
		**stored_summary(row),
		"appointment": {**dict(appointment), "notifications": notification_statuses(appointment["id"])} if appointment else None,
		"offers": [dict(offer) for offer in offers],
	}


@router.post("/summary", response_model=ConsultationSummaryResponse)
def preview_consultation_summary(
	payload: ConsultationCreate,
	_user: UserResponse = Depends(get_current_user),
):
	return ConsultationSummaryResponse(summary=generate_patient_summary(payload))


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
	payload: ConsultationCreate,
	user: UserResponse = Depends(get_current_user),
):
	consultation_id = str(uuid.uuid4())
	summary = generate_patient_summary(payload)
	with get_connection() as connection:
		connection.execute(
			"""
			INSERT INTO consultations
			(id, patient_id, symptoms, duration, impact, history, medicines, notes, summary)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			(
				consultation_id,
				user.id,
				json.dumps(payload.symptoms),
				payload.duration,
				payload.impact,
				payload.history,
				payload.medicines,
				payload.notes,
				summary,
			),
		)
	return ConsultationResponse(id=consultation_id, status="created", **generate_saved_summary(consultation_id))


@router.post("/{consultation_id}/summary", response_model=ConsultationSummaryResponse)
def retry_consultation_summary(consultation_id: str, user: UserResponse = Depends(get_current_user)):
	with get_connection() as connection:
		row = connection.execute("SELECT patient_id FROM consultations WHERE id = ?", (consultation_id,)).fetchone()
	if not row or (row["patient_id"] != user.id and user.role != "admin"):
		raise HTTPException(status_code=404, detail="Consultation not found.")
	return ConsultationSummaryResponse(**generate_saved_summary(consultation_id))


@router.post("/{consultation_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_consultation_image(
	consultation_id: str,
	image: UploadFile = File(...),
	user: UserResponse = Depends(get_current_user),
):
	if image.content_type not in ALLOWED_TYPES:
		raise HTTPException(status_code=415, detail="Only JPG, PNG or WebP images are supported.")
	with get_connection() as connection:
		owned = connection.execute(
			"SELECT id FROM consultations WHERE id = ? AND patient_id = ?",
			(consultation_id, user.id),
		).fetchone()
	if not owned:
		raise HTTPException(status_code=404, detail="Consultation not found.")

	content = await image.read(MAX_IMAGE_BYTES + 1)
	if len(content) > MAX_IMAGE_BYTES:
		raise HTTPException(status_code=413, detail="Images must be smaller than 5 MB.")
	image_id = str(uuid.uuid4())
	suffix = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[image.content_type]
	UPLOAD_DIR.mkdir(exist_ok=True)
	file_path = UPLOAD_DIR / f"{image_id}{suffix}"
	file_path.write_bytes(content)
	with get_connection() as connection:
		connection.execute(
			"""
			INSERT INTO consultation_images
			(id, consultation_id, filename, content_type, path)
			VALUES (?, ?, ?, ?, ?)
			""",
			(image_id, consultation_id, image.filename or file_path.name, image.content_type, str(file_path)),
		)
	return {"id": image_id, "filename": image.filename or file_path.name}