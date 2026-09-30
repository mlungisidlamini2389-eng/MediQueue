from pydantic import BaseModel, Field, field_validator
from app.schemas.contact import normalize_mobile


class AppointmentSelection(BaseModel):
	mobile: str = Field(min_length=1, max_length=32)

	@field_validator("mobile")
	@classmethod
	def validate_mobile(cls, value):
		return normalize_mobile(value)


class AppointmentBooking(BaseModel):
	consultation_id: str = Field(min_length=1)
	slot_id: str = Field(min_length=1)


class AppointmentResponse(BaseModel):
	id: str
	consultation_id: str
	slot_id: str
	starts_at: str
	department: str
	location: str
	status: str
	notifications: dict[str, str] = Field(default_factory=dict)
