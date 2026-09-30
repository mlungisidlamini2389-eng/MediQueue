from io import BytesIO
from pathlib import Path
import sys
import uuid

import pytest
from fastapi.testclient import TestClient
from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
	sys.path.insert(0, str(BACKEND_DIR))

from app import database
from app.routers import consultations
from main import app


@pytest.fixture()
def api(tmp_path, monkeypatch):
	monkeypatch.setattr(database, "DATABASE_PATH", tmp_path / "test.db")
	monkeypatch.setattr(consultations, "UPLOAD_DIR", tmp_path / "uploads")
	database.initialize_database()
	with TestClient(app) as client:
		yield client


def register(client: TestClient, prefix: str = "patient"):
	email = f"{prefix}-{uuid.uuid4()}@example.com"
	response = client.post(
		"/auth/register",
		json={"name": "Test Patient", "email": email, "password": "test-password"},
	)
	assert response.status_code == 201, response.text
	return response.json()["user"]


def create_consultation(client: TestClient, submission_id: str | None = None):
	payload = {
		"submission_id": submission_id or str(uuid.uuid4()),
		"symptoms": ["Headache"],
		"duration": "Today",
		"impact": "Some activities are difficult",
		"history": "",
		"medicines": "",
		"notes": "Test consultation",
	}
	response = client.post("/consultations", json=payload)
	assert response.status_code == 201, response.text
	return response.json(), payload


def image_bytes(image_format: str = "PNG", color=(20, 40, 60)) -> bytes:
	output = BytesIO()
	Image.new("RGB", (4, 4), color).save(output, format=image_format)
	return output.getvalue()
