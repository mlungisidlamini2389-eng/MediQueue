from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
	name: str = Field(min_length=2, max_length=120)
	email: str = Field(min_length=5, max_length=320)
	password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
	email: str = Field(min_length=5, max_length=320)
	password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
	id: str
	name: str
	email: str
	role: str = "patient"


class AuthResponse(BaseModel):
	user: UserResponse
