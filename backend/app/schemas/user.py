from pydantic import BaseModel, Field, field_validator
from app.schemas.contact import normalize_mobile


class RegisterRequest(BaseModel):
	name: str = Field(min_length=2, max_length=120)
	email: str = Field(min_length=5, max_length=320)
	password: str = Field(min_length=6, max_length=128)
	mobile: str = Field(default="", max_length=32)

	@field_validator("mobile")
	@classmethod
	def validate_mobile(cls, value):
		return normalize_mobile(value) if value else ""


class AdminLoginRequest(BaseModel):
	password: str = Field(min_length=1, max_length=128)


class LoginRequest(BaseModel):
	email: str = Field(min_length=5, max_length=320)
	password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
	id: str
	name: str
	email: str
	role: str = "patient"
	mobile: str = ""


class AuthResponse(BaseModel):
	user: UserResponse
