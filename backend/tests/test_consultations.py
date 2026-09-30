import uuid

from fastapi.testclient import TestClient

from app.database import get_connection
from conftest import create_consultation, image_bytes, register


def upload(client, consultation_id, content, filename="image.png", content_type="image/png"):
	return client.post(
		f"/consultations/{consultation_id}/images",
		files={"image": (filename, content, content_type)},
	)


def test_consultation_retry_is_idempotent(api):
	register(api)
	submission_id = str(uuid.uuid4())
	first, payload = create_consultation(api, submission_id)
	second = api.post("/consultations", json=payload)
	assert second.status_code == 201
	assert second.json() == {"id": first["id"], "status": "existing"}
	with get_connection() as connection:
		assert connection.execute("SELECT COUNT(*) FROM consultations").fetchone()[0] == 1


def test_submission_id_cannot_be_reused_for_different_data(api):
	register(api)
	first, payload = create_consultation(api)
	payload["notes"] = "Changed after the first submission"
	response = api.post("/consultations", json=payload)
	assert response.status_code == 409
	with get_connection() as connection:
		row = connection.execute(
			"SELECT id, notes FROM consultations WHERE id = ?", (first["id"],)
		).fetchone()
	assert row["notes"] == "Test consultation"


def test_retry_does_not_duplicate_an_uploaded_image(api):
	register(api)
	consultation, _ = create_consultation(api)
	content = image_bytes()
	first = upload(api, consultation["id"], content)
	second = upload(api, consultation["id"], content)
	assert first.status_code == 201
	assert second.status_code == 200
	assert second.json()["id"] == first.json()["id"]
	with get_connection() as connection:
		assert connection.execute("SELECT COUNT(*) FROM consultation_images").fetchone()[0] == 1


def test_valid_image_and_safe_filename(api):
	register(api)
	consultation, _ = create_consultation(api)
	response = upload(api, consultation["id"], image_bytes(), "../../patient.png")
	assert response.status_code == 201
	assert response.json()["filename"] == "patient.png"
	with get_connection() as connection:
		path = connection.execute("SELECT path FROM consultation_images").fetchone()["path"]
	assert "patient.png" not in path


def test_fake_image_is_rejected(api):
	register(api)
	consultation, _ = create_consultation(api)
	response = upload(api, consultation["id"], b"this is not a png")
	assert response.status_code == 422
	assert "valid image" in response.json()["detail"]


def test_unsupported_image_format_is_rejected(api):
	register(api)
	consultation, _ = create_consultation(api)
	response = upload(api, consultation["id"], image_bytes("GIF"), "image.gif", "image/gif")
	assert response.status_code == 415


def test_oversized_image_is_rejected(api):
	register(api)
	consultation, _ = create_consultation(api)
	response = upload(api, consultation["id"], b"x" * (5 * 1024 * 1024 + 1))
	assert response.status_code == 413


def test_fourth_image_is_rejected(api):
	register(api)
	consultation, _ = create_consultation(api)
	for index in range(3):
		assert upload(
			api, consultation["id"], image_bytes(color=(index, 40, 60)), f"{index}.png"
		).status_code == 201
	fourth = upload(api, consultation["id"], image_bytes(color=(99, 40, 60)), "fourth.png")
	assert fourth.status_code == 409
	assert "no more than 3" in fourth.json()["detail"]


def test_image_upload_requires_consultation_ownership(api):
	register(api, "owner")
	consultation, _ = create_consultation(api)
	other = TestClient(api.app)
	register(other, "other")
	response = upload(other, consultation["id"], image_bytes())
	assert response.status_code == 404
