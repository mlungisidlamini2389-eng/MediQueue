import uuid
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_connection
from app.routers.auth import get_current_user
from app.schemas.appointment import AppointmentResponse, AppointmentSelection
from app.services.notification_service import send_confirmations, notification_statuses
from app.schemas.user import UserResponse
from app.time_utils import parse_timestamp, utc_now

router = APIRouter(prefix="/appointments", tags=["appointments"])


def to_response(row) -> AppointmentResponse:
	return AppointmentResponse(
		id=row["id"],
		consultation_id=row["consultation_id"],
		slot_id=row["slot_id"],
		starts_at=row["starts_at"],
		department=row["department"],
		location=row["location"],
		status=row["status"],
		notifications=notification_statuses(row["id"]),
	)


@router.get("/offers")
def list_patient_offers(
	consultation_id: str,
	user: UserResponse = Depends(get_current_user),
):
	with get_connection() as connection:
		consultation = connection.execute(
			"SELECT id FROM consultations WHERE id = ? AND patient_id = ?",
			(consultation_id, user.id),
		).fetchone()
		if not consultation:
			raise HTTPException(status_code=404, detail="Consultation not found.")
		rows = connection.execute(
			"SELECT id, starts_at, department, location FROM appointment_offers "
			"WHERE consultation_id = ? AND status = 'offered' ORDER BY starts_at",
			(consultation_id,),
		).fetchall()
	return [dict(row) for row in rows if parse_timestamp(row["starts_at"]) > utc_now()]


@router.post("/offers/{offer_id}/select", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def select_appointment_offer(
	offer_id: str,
	payload: AppointmentSelection,
	user: UserResponse = Depends(get_current_user),
):
	with get_connection() as connection:
		connection.execute("BEGIN IMMEDIATE")
		offer = connection.execute(
			"""
			SELECT appointment_offers.* FROM appointment_offers
			JOIN consultations ON consultations.id = appointment_offers.consultation_id
			WHERE appointment_offers.id = ? AND consultations.patient_id = ?
			""",
			(offer_id, user.id),
		).fetchone()
		if offer and offer["status"] == "selected":
			existing = connection.execute("SELECT * FROM appointments WHERE slot_id = ? AND patient_id = ?", (f"offer:{offer_id}", user.id)).fetchone()
			if existing:
				return to_response(existing)
		if not offer or offer["status"] != "offered":
			if not offer:
				raise HTTPException(status_code=404, detail="Appointment option not found.")
			if offer["status"] == "selected":
				raise HTTPException(status_code=409, detail="That appointment option has already been selected.")
			raise HTTPException(status_code=409, detail="That appointment option is no longer available.")
		if parse_timestamp(offer["starts_at"]) <= utc_now():
			raise HTTPException(status_code=410, detail="That appointment option has expired. Ask your care team for another option.")
		if connection.execute(
			"SELECT id FROM appointments WHERE resource_key = ? AND starts_at = ?",
			(offer["resource_key"], offer["starts_at"]),
		).fetchone():
			raise HTTPException(status_code=409, detail="That scheduling resource was just booked. Ask your care team for another option.")
		appointment_id = str(uuid.uuid4())
		try:
			connection.execute(
				"""
				INSERT INTO appointments
				(id, patient_id, consultation_id, slot_id, starts_at, department, location, resource_key)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)
				""",
				(
					appointment_id,
					user.id,
					offer["consultation_id"],
					f"offer:{offer_id}",
					offer["starts_at"],
					offer["department"],
					offer["location"],
					offer["resource_key"],
				),
			)
		except sqlite3.IntegrityError as error:
			raise HTTPException(
				status_code=409,
				detail="That appointment is no longer available.",
			) from error
		connection.execute(
			"UPDATE appointment_offers SET status = 'selected' WHERE id = ?",
			(offer_id,),
		)
		connection.execute(
			"UPDATE appointment_offers SET status = 'withdrawn' WHERE consultation_id = ? AND id != ? AND status = 'offered'",
			(offer["consultation_id"], offer_id),
		)
		connection.execute("UPDATE users SET mobile = ? WHERE id = ?", (payload.mobile, user.id))
		for channel, recipient in (("sms", payload.mobile), ("email", user.email)):
			connection.execute("INSERT INTO appointment_notifications (appointment_id, channel, recipient) VALUES (?, ?, ?)", (appointment_id, channel, recipient))
		row = connection.execute(
			"SELECT * FROM appointments WHERE id = ?", (appointment_id,)
		).fetchone()
	# Notification failures must never undo or hide a confirmed booking.
	try:
		send_confirmations(dict(row))
	except Exception:
		pass
	return to_response(row)


@router.get("", response_model=list[AppointmentResponse])
def list_appointments(user: UserResponse = Depends(get_current_user)):
	with get_connection() as connection:
		rows = connection.execute(
			"SELECT * FROM appointments WHERE patient_id = ? ORDER BY starts_at",
			(user.id,),
		).fetchall()
	return [to_response(row) for row in rows]
