from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = Settings()

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Database session dependency."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    license_key = Column(String(128), unique=True, nullable=True)
    license_status = Column(String(50), default="inactive")
    license_plan = Column(String(100), nullable=True)
    license_activated_at = Column(DateTime, nullable=True)
    license_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    loras = relationship("LoRAModel", back_populates="user")
    generations = relationship("Generation", back_populates="user")
    face_swap_tasks = relationship("FaceSwapTask", back_populates="user")
    video_tasks = relationship("VideoTask", back_populates="user")


class LicenseKey(Base):
    __tablename__ = "license_keys"
    __table_args__ = (UniqueConstraint("key", name="uq_license_keys_key"),)

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(128), nullable=False, unique=True, index=True)
    plan_name = Column(String(100), default="lifetime")
    is_active = Column(Boolean, default=True)
    max_activations = Column(Integer, default=1)
    activations_count = Column(Integer, default=0)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    activated_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PaymentCharge(Base):
    __tablename__ = "payment_charges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    provider = Column(String(50), nullable=False, default="efi")
    method = Column(String(30), nullable=False, default="pix")
    status = Column(String(50), nullable=False, default="pending")
    amount_cents = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    external_id = Column(String(255), unique=True, nullable=True, index=True)
    txid = Column(String(255), unique=True, nullable=True, index=True)
    pix_copy_paste = Column(Text, nullable=True)
    qr_code_image = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class LoRAModel(Base):
    __tablename__ = "lora_models"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_name = Column(String(255), nullable=False)
    fal_lora_url = Column(String(512))
    trigger_word = Column(String(100), nullable=False)
    enable_nsfw = Column(Boolean, default=True)
    status = Column(String(50), default="training")
    progress = Column(Integer, default=0)
    replicate_prediction_id = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="loras")
    generations = relationship("Generation", back_populates="lora")
    video_tasks = relationship("VideoTask", back_populates="lora")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(String(100), unique=True, index=True)
    task_type = Column(String(50))
    prompt = Column(Text)
    negative_prompt = Column(Text)
    lora_id = Column(Integer, ForeignKey("lora_models.id"), nullable=True)
    
    cum_effect = Column(Float, default=0.5)
    makeup = Column(Float, default=0.5)
    pose = Column(String(50))
    strength = Column(Float, default=0.7)
    lora_strength = Column(Float, default=0.8)
    girl_lora_strength = Column(Float)
    
    width = Column(Integer, default=1024)
    height = Column(Integer, default=1024)
    steps = Column(Integer, default=30)
    guidance_scale = Column(Float, default=7.0)
    seed = Column(Integer)
    
    output_url = Column(String(512))
    status = Column(String(50), default="processing")
    progress = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="generations")
    lora = relationship("LoRAModel", back_populates="generations")


class FaceSwapTask(Base):
    __tablename__ = "face_swap_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(String(100), unique=True, index=True)
    task_type = Column(String(50))
    source_image_url = Column(String(512))
    target_image_url = Column(String(512))
    source_video_url = Column(String(512))
    lora_strength = Column(Float, default=0.8)
    output_url = Column(String(512))
    status = Column(String(50), default="processing")
    progress = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="face_swap_tasks")


class VideoTask(Base):
    __tablename__ = "video_tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(String(100), unique=True, index=True)
    task_type = Column(String(50))
    image_prompt = Column(Text)
    audio_file_url = Column(String(512))
    image_reference_url = Column(String(512))
    lora_id = Column(Integer, ForeignKey("lora_models.id"), nullable=True)
    motion_strength = Column(Float, default=0.7)
    output_url = Column(String(512))
    status = Column(String(50), default="processing")
    progress = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    user = relationship("User", back_populates="video_tasks")
    lora = relationship("LoRAModel", back_populates="video_tasks")
