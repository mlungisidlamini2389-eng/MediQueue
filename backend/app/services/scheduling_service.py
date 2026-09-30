SLOTS = [
	{
		"id": "general-2026-10-20-1030",
		"starts_at": "2026-10-20T10:30:00",
		"department": "General medicine",
		"location": "MediQueue Hospital · Block B",
	},
	{
		"id": "general-2026-10-21-1400",
		"starts_at": "2026-10-21T14:00:00",
		"department": "General medicine",
		"location": "MediQueue Hospital · Block B",
	},
	{
		"id": "general-2026-10-22-0900",
		"starts_at": "2026-10-22T09:00:00",
		"department": "General medicine",
		"location": "MediQueue Hospital · Block B",
	},
]


def available_slots(booked_slot_ids: set[str]):
	return [slot for slot in SLOTS if slot["id"] not in booked_slot_ids]


def get_slot(slot_id: str):
	return next((slot for slot in SLOTS if slot["id"] == slot_id), None)