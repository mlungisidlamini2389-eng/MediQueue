from app.schemas.consultation import ConsultationCreate


def generate_patient_summary(consultation: ConsultationCreate) -> str:
	"""Create a grounded narrative using only patient-submitted fields."""
	symptoms = ", ".join(symptom.strip() for symptom in consultation.symptoms)
	paragraphs = [
		f"The patient reports {symptoms}. The reported onset is {consultation.duration.strip()}, "
		f"and the reported daily impact is {consultation.impact.strip()}."
	]

	context = []
	if consultation.history.strip():
		context.append(f"Conditions or allergies reported: {consultation.history.strip()}")
	else:
		context.append("No conditions or allergies were included in the responses.")
	if consultation.medicines.strip():
		context.append(f"Current medicines reported: {consultation.medicines.strip()}")
	else:
		context.append("No current medicines were included in the responses.")
	if consultation.notes.strip():
		context.append(f"Additional concerns reported: {consultation.notes.strip()}")
	else:
		context.append("No additional concerns were included in the responses.")
	paragraphs.append(". ".join(item.rstrip(".") for item in context) + ".")
	paragraphs.append(
		"This summary is based only on the patient's responses. It does not diagnose "
		"a condition or recommend treatment. A healthcare professional should review "
		"this summary and the original responses."
	)
	return "\n\n".join(paragraphs)
