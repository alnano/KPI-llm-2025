
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, ForeignKey, text,  Column, BigInteger, SmallInteger, Date, Text, TIMESTAMP, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, DOUBLE_PRECISION
from sqlalchemy.sql import func
from typing import Optional
import enum, uuid

class Base(DeclarativeBase): pass

class Provider(enum.Enum):
    local = "local"
    google = "google"

#auth
class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    email: Mapped[str]    = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[Optional[str]]
    identities: Mapped[list["Identity"]] = relationship(back_populates="user", cascade="all, delete-orphan")

class Identity(Base):
    __tablename__ = "identities"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, server_default=text("gen_random_uuid()"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[Provider] = mapped_column(Enum(Provider), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(String, nullable=False)
    user: Mapped["User"] = relationship(back_populates="identities")

#Models Schema
class ModelRun(Base):
    __tablename__ = "model_run"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    model_name = Column(Text, nullable=False)
    run_label = Column(Text, nullable=False)
    params_json = Column(JSONB, nullable=False, server_default="{}")
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (
            UniqueConstraint("model_name", "run_label", name="uq_model_run_model_label"),  # <-- NEW
        )

class Channel(Base):
    __tablename__ = "channel"
    id = Column(SmallInteger, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)

class ContributionBaseline(Base):
    __tablename__ = "contribution_baseline"
    run_id = Column(BigInteger, nullable=False, primary_key=True)
    time = Column(Date, nullable=False, primary_key=True)
    baseline = Column(DOUBLE_PRECISION, nullable=False)

class ContributionPoint(Base):
    __tablename__ = "contribution_point"
    run_id = Column(BigInteger, nullable=False, primary_key=True)
    time = Column(Date, nullable=False, primary_key=True)
    channel_id = Column(SmallInteger, nullable=False, primary_key=True)
    value = Column(DOUBLE_PRECISION, nullable=False)

class ResponseCurvePoint(Base):
    __tablename__ = "response_curve_point"
    run_id = Column(BigInteger, nullable=False, primary_key=True)
    spend_multiplier = Column(DOUBLE_PRECISION, nullable=False, primary_key=True)
    channel_id = Column(SmallInteger, nullable=False, primary_key=True)
    mean = Column(DOUBLE_PRECISION, nullable=False)
    lo   = Column(DOUBLE_PRECISION, nullable=False)
    hi   = Column(DOUBLE_PRECISION, nullable=False)
