import hashlib
import hmac
import secrets

ITERATIONS = 600_000


def hash_password(password: str) -> str:
	salt = secrets.token_bytes(16)
	digest = hashlib.pbkdf2_hmac(
		"sha256", password.encode(), salt, ITERATIONS
	)
	return f"{ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
	try:
		iterations, salt_hex, digest_hex = stored_hash.split("$")
		digest = hashlib.pbkdf2_hmac(
			"sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations)
		)
	except (ValueError, TypeError):
		return False
	return hmac.compare_digest(digest.hex(), digest_hex)


def create_session_token() -> str:
	return secrets.token_urlsafe(32)
