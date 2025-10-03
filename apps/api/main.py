from fastapi import FastAPI, APIRouter, HTTPException, Response, Depends
from api.config import get_settings
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, text
from api.db.session import get_session, engine
from api.db.models import User, Identity, Provider, Base
from api.core.security import hash_pw, verify_pw, mint_session, cookie_opts
from api.deps.auth import require_user
from api.routers import  get_models_info
from pydantic import BaseModel

settings = get_settings()

app: FastAPI = FastAPI()
app.include_router(get_models_info.router)

@app.on_event("startup")
def init_db():
    with engine.begin() as conn:
        conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'))
        Base.metadata.create_all(bind=conn)

app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    print(settings.DATABASE_URL)
    return {"status": "ok"}


#auth ---

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterBody(BaseModel):
    email: EmailStr
    password: str

@router.post("/register")
def register(body: RegisterBody, response: Response):
    with get_session() as s:
        exists = s.scalar(select(User).where(User.email == body.email))
        if exists: raise HTTPException(409, "Email already registered")
        user = User(email=body.email, password_hash=hash_pw(body.password))
        s.add(user); s.flush()
        s.add(Identity(user_id=user.id, provider=Provider.local, provider_user_id=str(user.id)))
        s.commit()
        token = mint_session(str(user.id))
    response.set_cookie("session", token, **cookie_opts())
    return {"ok": True}

class LoginBody(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
def login(body: LoginBody, response: Response):
    with get_session() as s:
        user = s.scalar(select(User).where(User.email == body.email))
        if not user or not user.password_hash or not verify_pw(body.password, user.password_hash):
            raise HTTPException(401, "Invalid credentials")
        token = mint_session(str(user.id))
    response.set_cookie("session", token, **cookie_opts())
    return {"ok": True}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"ok": True}


@router.get("/me")
def me(user = Depends(require_user)):
    return {"id": str(user.id), "email": user.email}

app.include_router(router)
