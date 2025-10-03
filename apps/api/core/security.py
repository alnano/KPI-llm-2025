from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

JWT_SECRET = "change_me"  # env in prod
JWT_ALGO = "HS256"
JWT_TTL  = timedelta(hours=12)

pwd_ctx = CryptContext(
    schemes=["bcrypt_sha256", "bcrypt"],
    deprecated="auto",
)

def hash_pw(pw: str) -> str:
    return pwd_ctx.hash(pw)

def verify_pw(pw: str, pw_hash: str) -> bool:
    return pwd_ctx.verify(pw, pw_hash)

def mint_session(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.utcnow() + JWT_TTL},
                         JWT_SECRET, algorithm=JWT_ALGO)  # <-- keyword arg for jose

def cookie_opts():
    return dict(httponly=True, samesite="lax", secure=False,
                    max_age=int(JWT_TTL.total_seconds()))
