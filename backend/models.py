"""
SQLAlchemy Database Models for C++ DSA Learning Platform
"""

from datetime import datetime, timezone
import os
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    Enum as SAEnum,
    JSON,
    create_engine,
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(128), unique=True, nullable=False, index=True)
    hashed_password = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Stats
    streak_count = Column(Integer, default=0)
    last_login_date = Column(DateTime, nullable=True)
    total_solved = Column(Integer, default=0)

    # relationships
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="user")
    comments = relationship("Comment", back_populates="user")

    def __repr__(self) -> str:
        return f"<User id={self.id} username={self.username!r}>"


# ---------------------------------------------------------------------------
# Topic  (e.g. Arrays, Linked Lists, Trees, Graphs, DP …)
# ---------------------------------------------------------------------------
class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), unique=True, nullable=False)          # "Binary Trees"
    slug = Column(String(128), unique=True, nullable=False)          # "binary-trees"
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)                         # display order
    icon = Column(String(64), nullable=True)                         # emoji / icon key
    long_description = Column(Text, nullable=True)                  # Detailed educational content
    has_code_runner = Column(Boolean, default=True)                 # if module has practice engine

    # relationships
    questions = relationship("Question", back_populates="topic", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Topic id={self.id} name={self.name!r}>"


# ---------------------------------------------------------------------------
# Question
# ---------------------------------------------------------------------------
class DifficultyLevel(str):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    title = Column(String(256), nullable=False)
    slug = Column(String(256), unique=True, nullable=False)
    description = Column(Text, nullable=False)                       # problem statement (markdown)
    difficulty = Column(
        SAEnum("easy", "medium", "hard", name="difficulty_enum"),
        nullable=False,
        default="easy",
    )

    # Complexity hints (shown after attempts)
    time_complexity = Column(String(64), nullable=True)              # e.g. "O(n log n)"
    space_complexity = Column(String(64), nullable=True)             # e.g. "O(n)"

    # C++ solution / starter code
    starter_code_cpp = Column(Text, nullable=True)
    solution_code_cpp = Column(Text, nullable=True)

    # Meta
    hints = Column(Text, nullable=True)                              # newline-separated hints
    examples = Column(JSON, nullable=True)                           # List of example objects
    constraints = Column(Text, nullable=True)                        # Problem constraints
    tags = Column(JSON, nullable=True)                               # List of strings
    
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # relationships
    topic = relationship("Topic", back_populates="questions")
    progress = relationship("UserProgress", back_populates="question", cascade="all, delete-orphan")
    discussions = relationship("Discussion", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Question id={self.id} title={self.title!r} difficulty={self.difficulty!r}>"


# ---------------------------------------------------------------------------
# UserProgress
# ---------------------------------------------------------------------------
class ProgressStatus(str):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)

    status = Column(
        SAEnum("not_started", "in_progress", "completed", name="progress_enum"),
        nullable=False,
        default="not_started",
    )
    attempts = Column(Integer, default=0, nullable=False, server_default="0")
    last_attempted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)                              # personal notes

    # relationships
    user = relationship("User", back_populates="progress")
    question = relationship("Question", back_populates="progress")

    def __repr__(self) -> str:
        return (
            f"<UserProgress user_id={self.user_id} "
            f"question_id={self.question_id} status={self.status!r}>"
        )


# ---------------------------------------------------------------------------
# Daily Challenge
# ---------------------------------------------------------------------------
class DailyChallenge(Base):
    __tablename__ = "daily_challenges"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    date = Column(DateTime, unique=True, nullable=False, index=True)

    question = relationship("Question")


# ---------------------------------------------------------------------------
# Discussions
# ---------------------------------------------------------------------------
class Discussion(Base):
    __tablename__ = "discussions"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    title = Column(String(256), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="discussions")
    question = relationship("Question", back_populates="discussions")
    comments = relationship("Comment", back_populates="discussion", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    discussion_id = Column(Integer, ForeignKey("discussions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="comments")
    discussion = relationship("Discussion", back_populates="comments")


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./dsa_platform.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
)


def init_db() -> None:
    """Create all tables (idempotent)."""
    Base.metadata.create_all(bind=engine)
