from datetime import timedelta
import uuid

from fastapi.testclient import TestClient

from app.database import get_connection
from app.time_utils import scheduling_resource, utc_now, utc_timestamp
from conftest import create_consultation, register


def add_offer(consultation_id, starts_at, status="offered", department="General medicine", location="Block B"):
	offer_id = str(uuid.uuid4())
	with get_connection() as connection:
		connection.execute(
			"INSERT INTO appointment_offers (id, consultation_id, starts_at, department, location, resource_key, status) "
			"VALUES (?, ?, ?, ?, ?, ?, ?)",
			(
				offer_id,
				consultation_id,
				utc_timestamp(starts_at),
				department,
				location,
				scheduling_resource(department, location),
				status,
			),
		)
	return offer_id


def test_future_offer_books_and_withdraws_alternatives(api):
	register(api)
	consultation, _ = create_consultation(api)
	selected = add_offer(consultation["id"], utc_now() + timedelta(days=2))
	alternative = add_offer(consultation["id"], utc_now() + timedelta(days=3))

	response = api.post(f"/appointments/offers/{selected}/select")
	assert response.status_code == 201
	assert response.json()["starts_at"].endswith("Z")
	assert api.get("/consultations/mine/latest").json()["appointment"]["id"] == response.json()["id"]
	with get_connection() as connection:
		statuses = {
			row["id"]: row["status"]
			for row in connection.execute(
				"SELECT id, status FROM appointment_offers WHERE id IN (?, ?)",
				(selected, alternative),
			)
		}
	assert statuses == {selected: "selected", alternative: "withdrawn"}


def test_expired_offer_is_rejected_without_withdrawing_alternative(api):
	register(api)
	consultation, _ = create_consultation(api)
	expired = add_offer(consultation["id"], utc_now() - timedelta(minutes=1))
	alternative = add_offer(consultation["id"], utc_now() + timedelta(days=1))

	response = api.post(f"/appointments/offers/{expired}/select")
	assert response.status_code == 410
	with get_connection() as connection:
		assert connection.execute("SELECT COUNT(*) FROM appointments").fetchone()[0] == 0
		assert connection.execute(
			"SELECT status FROM appointment_offers WHERE id = ?", (alternative,)
		).fetchone()["status"] == "offered"


def test_selected_and_withdrawn_offers_are_unavailable(api):
	register(api)
	consultation, _ = create_consultation(api)
	for offer_status, expected_message in (
		("selected", "already been selected"),
		("withdrawn", "no longer available"),
	):
		offer_id = add_offer(
			consultation["id"], utc_now() + timedelta(days=2), status=offer_status,
			location=f"{offer_status} room",
		)
		response = api.post(f"/appointments/offers/{offer_id}/select")
		assert response.status_code == 409
		assert expected_message in response.json()["detail"]


def test_offer_for_another_patient_is_hidden(api):
	register(api, "owner")
	consultation, _ = create_consultation(api)
	offer_id = add_offer(consultation["id"], utc_now() + timedelta(days=2))
	other = TestClient(api.app)
	register(other, "other")
	assert other.post(f"/appointments/offers/{offer_id}/select").status_code == 404


def test_independent_resources_can_share_a_timestamp(api):
	shared_time = utc_now() + timedelta(days=2)
	appointments = []
	for prefix, department, location in (
		("one", "General medicine", "Block B"),
		("two", "Dermatology", "Block C"),
	):
		client = TestClient(api.app)
		register(client, prefix)
		consultation, _ = create_consultation(client)
		offer_id = add_offer(consultation["id"], shared_time, department=department, location=location)
		response = client.post(f"/appointments/offers/{offer_id}/select")
		assert response.status_code == 201, response.text
		appointments.append(response.json()["id"])
	assert len(set(appointments)) == 2


def test_same_resource_cannot_be_double_booked(api):
	shared_time = utc_now() + timedelta(days=2)
	clients_and_offers = []
	for prefix in ("first", "second"):
		client = TestClient(api.app)
		register(client, prefix)
		consultation, _ = create_consultation(client)
		clients_and_offers.append(
			(client, add_offer(consultation["id"], shared_time))
		)
	assert clients_and_offers[0][0].post(
		f"/appointments/offers/{clients_and_offers[0][1]}/select"
	).status_code == 201
	conflict = clients_and_offers[1][0].post(
		f"/appointments/offers/{clients_and_offers[1][1]}/select"
	)
	assert conflict.status_code == 409
	with get_connection() as connection:
		assert connection.execute(
			"SELECT status FROM appointment_offers WHERE id = ?",
			(clients_and_offers[1][1],),
		).fetchone()["status"] == "offered"


def test_admin_offer_normalizes_offset_to_utc(api):
	patient = register(api)
	consultation, _ = create_consultation(api)
	with get_connection() as connection:
		connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", (patient["id"],))
	payload = {
		"offers": [
			{"starts_at": "2035-06-01T12:00:00+02:00", "department": "General medicine", "location": "Block B"},
			{"starts_at": "2035-06-02T12:00:00+02:00", "department": "General medicine", "location": "Block B"},
		]
	}
	response = api.post(f"/admin/consultations/{consultation['id']}/offers", json=payload)
	assert response.status_code == 200, response.text
	with get_connection() as connection:
		stored = connection.execute(
			"SELECT starts_at FROM appointment_offers WHERE consultation_id = ? ORDER BY starts_at",
			(consultation["id"],),
		).fetchall()
	assert [row["starts_at"] for row in stored] == ["2035-06-01T10:00:00Z", "2035-06-02T10:00:00Z"]


def test_admin_rejects_timezone_naive_offer(api):
	patient = register(api)
	consultation, _ = create_consultation(api)
	with get_connection() as connection:
		connection.execute("UPDATE users SET role = 'admin' WHERE id = ?", (patient["id"],))
	response = api.post(
		f"/admin/consultations/{consultation['id']}/offers",
		json={"offers": [
			{"starts_at": "2035-06-01T12:00:00", "department": "General medicine", "location": "Block B"},
			{"starts_at": "2035-06-02T12:00:00Z", "department": "General medicine", "location": "Block B"},
		]},
	)
	assert response.status_code == 422
	assert "timezone" in response.json()["detail"]
