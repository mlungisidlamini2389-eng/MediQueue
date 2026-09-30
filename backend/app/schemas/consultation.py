from pydantic import BaseModel, Field


class ConsultationCreate(BaseModel):
	symptoms: list[str] = Field(min_length=1, max_length=8)
	duration: str = Field(min_length=1, max_length=80)
	impact: str = Field(min_length=1, max_length=120)
	history: str = Field(default="", max_length=2000)
	medicines: str = Field(default="", max_length=500)
	notes: str = Field(default="", max_length=3000)


class ConsultationResponse(BaseModel):
	id: str
	status: str
