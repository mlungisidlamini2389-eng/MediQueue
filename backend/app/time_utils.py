from datetime import datetime, timezone


def parse_timestamp(value: str) -> datetime:
	"""Parse an ISO-8601 timestamp and require an explicit timezone."""
	normalized = value.strip()
	if normalized.endswith("Z"):
		normalized = f"{normalized[:-1]}+00:00"
	try:
		parsed = datetime.fromisoformat(normalized)
	except ValueError as error:
		raise ValueError("Appointment dates must use ISO-8601 date/time format.") from error
	if parsed.tzinfo is None or parsed.utcoffset() is None:
		raise ValueError("Appointment dates must include a timezone offset.")
	return parsed.astimezone(timezone.utc)


def utc_timestamp(value: datetime) -> str:
	if value.tzinfo is None or value.utcoffset() is None:
		raise ValueError("A timezone-aware datetime is required.")
	return value.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def utc_now() -> datetime:
	return datetime.now(timezone.utc)


def scheduling_resource(department: str, location: str) -> str:
	return f"{department.strip().casefold()}|{location.strip().casefold()}"
