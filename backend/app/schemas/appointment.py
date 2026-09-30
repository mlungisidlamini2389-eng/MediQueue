from pydantic import BaseModel, Field


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
