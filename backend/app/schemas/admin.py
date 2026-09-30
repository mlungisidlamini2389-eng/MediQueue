from pydantic import BaseModel, Field


class AppointmentOfferInput(BaseModel):
	starts_at: str = Field(min_length=16, max_length=40)
	department: str = Field(min_length=2, max_length=120)
	location: str = Field(min_length=2, max_length=200)


class AppointmentOffersCreate(BaseModel):
	offers: list[AppointmentOfferInput] = Field(min_length=2, max_length=5)