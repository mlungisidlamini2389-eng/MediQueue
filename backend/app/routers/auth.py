from datetime import datetime, timedelta, timezone
import re
import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.database import get_connection
from app.schemas.user import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.security import create_session_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
SESSION_COOKIE = "mediqueue_session"
SESSION_DAYS = 7
EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def normalize_email(email: str) -> str:
	normalized = email.strip().lower()
	if not EMAIL_PATTERN.match(normalized):
		raise HTTPException(status_code=422, detail="Enter a valid email address.")
	return normalized


def issue_session(response: Response, user_id: str):
	token = create_session_token()
	expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
	with get_connection() as connection:
		connection.execute(
			"INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
			(token, user_id, expires_at.isoformat()),
		)
	response.set_cookie(
		SESSION_COOKIE,
		token,
		httponly=True,
		secure=False,
		samesite="lax",
		max_age=SESSION_DAYS * 24 * 60 * 60,
	)


def user_response(row) -> UserResponse:
	return UserResponse(
		id=row["id"], name=row["name"], email=row["email"], role=row["role"]
	)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response):
	email = normalize_email(payload.email)
	name = payload.name.strip()
	if not name:
		raise HTTPException(status_code=422, detail="Name is required.")
	user_id = str(uuid.uuid4())
	try:
		with get_connection() as connection:
			connection.execute(
				"INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)",
				(user_id, name, email, hash_password(payload.password)),
			)
			row = connection.execute(
				"SELECT id, name, email, role FROM users WHERE id = ?", (user_id,)
			).fetchone()
	except Exception as error:
		if "UNIQUE constraint failed" in str(error):
			raise HTTPException(status_code=409, detail="An account already exists for this email.")
		raise
	issue_session(response, user_id)
	return AuthResponse(user=user_response(row))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, response: Response):
	email = normalize_email(payload.email)
	with get_connection() as connection:
		row = connection.execute(
			"SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
			(email,),
		).fetchone()
	if not row or not verify_password(payload.password, row["password_hash"]):
		raise HTTPException(status_code=401, detail="Email or password is incorrect.")
	issue_session(response, row["id"])
	return AuthResponse(user=user_response(row))


def get_current_user(mediqueue_session: str | None = Cookie(default=None)) -> UserResponse:
	if not mediqueue_session:
		raise HTTPException(status_code=401, detail="Please sign in to continue.")
	with get_connection() as connection:
		row = connection.execute(
			"""
			SELECT users.id, users.name, users.email, users.role
			FROM sessions JOIN users ON users.id = sessions.user_id
			WHERE sessions.token = ? AND sessions.expires_at > ?
			""",
			(mediqueue_session, datetime.now(timezone.utc).isoformat()),
		).fetchone()
	if not row:
		raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.")
	return user_response(row)


def require_admin(user: UserResponse = Depends(get_current_user)) -> UserResponse:
	if user.role != "admin":
		raise HTTPException(status_code=403, detail="Administrator access required.")
	return user
@router.get("/me", response_model=AuthResponse)
def current_user(user: UserResponse = Depends(get_current_user)):
	return AuthResponse(user=user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, mediqueue_session: str | None = Cookie(default=None)):
	if mediqueue_session:
		with get_connection() as connection:
			connection.execute("DELETE FROM sessions WHERE token = ?", (mediqueue_session,))
	response.delete_cookie(SESSION_COOKIE)
