import json
import hashlib
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status

from app.database import get_connection
from app.routers.auth import get_current_user
from app.schemas.consultation import ConsultationCreate, ConsultationResponse
from app.schemas.user import UserResponse
from app.services.image_service import safe_original_filename, validate_image_content

router = APIRouter(prefix="/consultations", tags=["consultations"])
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024
MAX_IMAGES = 3


def _consultation_values(payload: ConsultationCreate):
	return (
		json.dumps(payload.symptoms),
		payload.duration,
		payload.impact,
		payload.history,
		payload.medicines,
		payload.notes,
	)


@router.get("/mine/latest")
def latest_patient_consultation(user: UserResponse = Depends(get_current_user)):
	with get_connection() as connection:
		row = connection.execute(
			"SELECT * FROM consultations WHERE patient_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1",
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
		"submission_id": row["submission_id"],
		"symptoms": json.loads(row["symptoms"]),
		"duration": row["duration"],
		"impact": row["impact"],
		"history": row["history"],
		"medicines": row["medicines"],
		"notes": row["notes"],
		"appointment": dict(appointment) if appointment else None,
		"offers": [dict(offer) for offer in offers],
	}


@router.post("", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def create_consultation(
	payload: ConsultationCreate,
	user: UserResponse = Depends(get_current_user),
):
	consultation_id = str(uuid.uuid4())
	with get_connection() as connection:
		connection.execute("BEGIN IMMEDIATE")
		existing = connection.execute(
			"SELECT * FROM consultations WHERE patient_id = ? AND submission_id = ?",
			(user.id, payload.submission_id),
		).fetchone()
		if existing:
			existing_values = (
				existing["symptoms"], existing["duration"], existing["impact"],
				existing["history"], existing["medicines"], existing["notes"],
			)
			if existing_values != _consultation_values(payload):
				raise HTTPException(
					status_code=409,
					detail="That submission ID is already associated with different consultation data.",
				)
			return ConsultationResponse(id=existing["id"], status="existing")
		connection.execute(
			"""
			INSERT INTO consultations
			(id, patient_id, submission_id, symptoms, duration, impact, history, medicines, notes)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			""",
			(
				consultation_id,
				user.id,
				payload.submission_id,
				*_consultation_values(payload),
			),
		)
	return ConsultationResponse(id=consultation_id, status="created")


@router.post("/{consultation_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_consultation_image(
	consultation_id: str,
	response: Response,
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
	if not content:
		raise HTTPException(status_code=422, detail="The uploaded image is empty.")
	try:
		content_type, suffix = validate_image_content(content, image.content_type or "")
	except ValueError as error:
		raise HTTPException(status_code=422, detail=str(error)) from error
	digest = hashlib.sha256(content).hexdigest()
	image_id = str(uuid.uuid4())
	UPLOAD_DIR.mkdir(exist_ok=True)
	file_path = UPLOAD_DIR / f"{image_id}{suffix}"
	with get_connection() as connection:
		connection.execute("BEGIN IMMEDIATE")
		owned = connection.execute(
			"SELECT id FROM consultations WHERE id = ? AND patient_id = ?",
			(consultation_id, user.id),
		).fetchone()
		if not owned:
			raise HTTPException(status_code=404, detail="Consultation not found.")
		existing = connection.execute(
			"SELECT id, filename FROM consultation_images WHERE consultation_id = ? AND content_sha256 = ?",
			(consultation_id, digest),
		).fetchone()
		if existing:
			response.status_code = status.HTTP_200_OK
			return dict(existing)
		count = connection.execute(
			"SELECT COUNT(*) AS count FROM consultation_images WHERE consultation_id = ?",
			(consultation_id,),
		).fetchone()["count"]
		if count >= MAX_IMAGES:
			raise HTTPException(status_code=409, detail="A consultation can have no more than 3 images.")
		filename = safe_original_filename(image.filename, file_path.name)
		try:
			file_path.write_bytes(content)
			connection.execute(
				"""
				INSERT INTO consultation_images
				(id, consultation_id, filename, content_type, path, content_sha256)
				VALUES (?, ?, ?, ?, ?, ?)
				""",
				(image_id, consultation_id, filename, content_type, str(file_path), digest),
			)
		except Exception:
			file_path.unlink(missing_ok=True)
			raise
	return {"id": image_id, "filename": filename}
