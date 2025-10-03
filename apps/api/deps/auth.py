from fastapi import Request, HTTPException
from jose import jwt, JWTError
from api.core.security import JWT_SECRET, JWT_ALGO
from api.db.session import get_session
from api.db.models import User

def require_user(req: Request):
    token = req.cookies.get("session")
    if not token: raise HTTPException(401, "Unauthenticated")
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except JWTError:
        raise HTTPException(401, "Invalid session")
    with get_session() as s:
        user = s.get(User, data["sub"])
    if not user: raise HTTPException(401, "Unknown user")
    return user
