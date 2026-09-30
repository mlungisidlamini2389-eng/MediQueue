import os
import sqlite3
import uuid
from pathlib import Path

from app.security import hash_password

DATABASE_PATH = Path(
	os.getenv("MEDIQUEUE_DB_PATH", Path(__file__).resolve().parents[2] / "mediqueue.db")
)


def get_connection():
	connection = sqlite3.connect(DATABASE_PATH)
	connection.row_factory = sqlite3.Row
	connection.execute("PRAGMA foreign_keys = ON")
	return connection


def _add_column(connection, table: str, definition: str):
	column = definition.split()[0]
	columns = {row["name"] for row in connection.execute(f"PRAGMA table_info({table})")}
	if column not in columns:
		connection.execute(f"ALTER TABLE {table} ADD COLUMN {definition}")


def initialize_database():
	with get_connection() as connection:
		connection.executescript(
			"""
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				email TEXT NOT NULL UNIQUE COLLATE NOCASE,
				password_hash TEXT NOT NULL,
				role TEXT NOT NULL DEFAULT 'patient',
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE TABLE IF NOT EXISTS sessions (
				token TEXT PRIMARY KEY,
				user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				expires_at TEXT NOT NULL
			);
			CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
			CREATE TABLE IF NOT EXISTS consultations (
				id TEXT PRIMARY KEY,
				patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				submission_id TEXT,
				symptoms TEXT NOT NULL,
				duration TEXT NOT NULL,
				impact TEXT NOT NULL,
				history TEXT NOT NULL DEFAULT '',
				medicines TEXT NOT NULL DEFAULT '',
				notes TEXT NOT NULL DEFAULT '',
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE TABLE IF NOT EXISTS consultation_images (
				id TEXT PRIMARY KEY,
				consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
				filename TEXT NOT NULL,
				content_type TEXT NOT NULL,
				path TEXT NOT NULL,
				content_sha256 TEXT,
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS consultations_patient_id_idx ON consultations(patient_id);
			CREATE INDEX IF NOT EXISTS consultation_images_consultation_id_idx ON consultation_images(consultation_id);
			CREATE TABLE IF NOT EXISTS appointments (
				id TEXT PRIMARY KEY,
				patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
				slot_id TEXT NOT NULL UNIQUE,
				starts_at TEXT NOT NULL,
				department TEXT NOT NULL,
				location TEXT NOT NULL,
				resource_key TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'confirmed',
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS appointments_patient_id_idx ON appointments(patient_id);
			CREATE TABLE IF NOT EXISTS appointment_offers (
				id TEXT PRIMARY KEY,
				consultation_id TEXT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
				starts_at TEXT NOT NULL,
				department TEXT NOT NULL,
				location TEXT NOT NULL,
				resource_key TEXT NOT NULL,
				status TEXT NOT NULL DEFAULT 'offered',
				created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
			);
			CREATE INDEX IF NOT EXISTS appointment_offers_consultation_idx ON appointment_offers(consultation_id);
			"""
		)
		_add_column(connection, "users", "role TEXT NOT NULL DEFAULT 'patient'")
		_add_column(connection, "consultations", "submission_id TEXT")
		_add_column(connection, "consultation_images", "content_sha256 TEXT")
		_add_column(connection, "appointments", "resource_key TEXT NOT NULL DEFAULT ''")
		_add_column(connection, "appointment_offers", "resource_key TEXT NOT NULL DEFAULT ''")
		connection.execute(
			"UPDATE appointments SET resource_key = lower(trim(department)) || '|' || lower(trim(location)) WHERE resource_key = ''"
		)
		connection.execute(
			"UPDATE appointment_offers SET resource_key = lower(trim(department)) || '|' || lower(trim(location)) WHERE resource_key = ''"
		)
		for table in ("appointments", "appointment_offers"):
			connection.execute(
				f"UPDATE {table} SET starts_at = starts_at || 'Z' "
				"WHERE starts_at NOT LIKE '%Z' AND starts_at NOT GLOB '*[+-][0-9][0-9]:[0-9][0-9]'"
			)
		connection.execute(
			"CREATE UNIQUE INDEX IF NOT EXISTS consultations_submission_idx "
			"ON consultations(patient_id, submission_id) WHERE submission_id IS NOT NULL"
		)
		connection.execute(
			"CREATE UNIQUE INDEX IF NOT EXISTS consultation_images_hash_idx "
			"ON consultation_images(consultation_id, content_sha256) WHERE content_sha256 IS NOT NULL"
		)
		connection.execute(
			"CREATE UNIQUE INDEX IF NOT EXISTS appointments_resource_time_idx "
			"ON appointments(resource_key, starts_at)"
		)

	admin_email = os.getenv("MEDIQUEUE_ADMIN_EMAIL", "").strip().lower()
	admin_password = os.getenv("MEDIQUEUE_ADMIN_PASSWORD", "")
	if admin_email and admin_password:
		with get_connection() as connection:
			admin = connection.execute(
				"SELECT id FROM users WHERE email = ?", (admin_email,)
			).fetchone()
			if admin:
				connection.execute(
					"UPDATE users SET role = 'admin', password_hash = ? WHERE id = ?",
					(hash_password(admin_password), admin["id"]),
				)
			else:
				connection.execute(
					"INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'admin')",
					(
						str(uuid.uuid4()),
						os.getenv("MEDIQUEUE_ADMIN_NAME", "MediQueue Admin"),
						admin_email,
						hash_password(admin_password),
					),
				)
