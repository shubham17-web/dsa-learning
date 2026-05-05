"""
C++ DSA Learning Platform — FastAPI Backend
============================================
Run:  uvicorn backend.main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

from __future__ import annotations

import os
import time
import random
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session, sessionmaker

from backend.models import (
    Base,
    Question,
    Topic,
    User,
    UserProgress,
    DailyChallenge,
    Discussion,
    Comment,
    engine,
    init_db,
)
from backend.modules_content import MODULES_DETAILED_CONTENT

# ---------------------------------------------------------------------------
# App & CORS
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _seed_data()
    yield

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("dsa_platform")

app = FastAPI(
    title="C++ DSA Learning Platform API",
    description="Backend API for the C++ DSA Learning Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Database session
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Auth helpers (JWT)
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production-please")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def _hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    streak_count: int
    total_solved: int

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    total_solved: int
    streak: int
    accuracy: float
    recent_activity: List[dict]
    topic_progress: List[dict]


class Token(BaseModel):
    access_token: str
    token_type: str


class TopicOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    long_description: Optional[str]
    order_index: int
    icon: Optional[str]
    has_code_runner: bool

    class Config:
        from_attributes = True


class ModuleDetail(BaseModel):
    topic: TopicOut
    questions: List[QuestionOut]


class QuestionExample(BaseModel):
    input: str
    output: str
    explanation: Optional[str] = None


class QuestionOut(BaseModel):
    id: int
    title: str
    slug: str
    description: str
    difficulty: str
    time_complexity: Optional[str]
    space_complexity: Optional[str]
    starter_code_cpp: Optional[str]
    hints: Optional[str]
    examples: Optional[List[QuestionExample]]
    constraints: Optional[str]
    tags: Optional[List[str]]
    topic_id: int

    class Config:
        from_attributes = True


class QuestionDetail(QuestionOut):
    solution_code_cpp: Optional[str]


class ProgressUpdate(BaseModel):
    status: str   # not_started | in_progress | completed
    notes: Optional[str] = None


class ProgressOut(BaseModel):
    id: int
    user_id: int
    question_id: int
    status: str
    attempts: int
    notes: Optional[str]

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str


class DiscussionCreate(BaseModel):
    title: str
    content: str


class CommentCreate(BaseModel):
    content: str


class CommentOut(BaseModel):
    id: int
    content: str
    user_id: int
    username: str
    created_at: datetime

    class Config:
        from_attributes = True


class DiscussionOut(BaseModel):
    id: int
    title: str
    content: str
    user_id: int
    username: str
    created_at: datetime
    comment_count: int

    class Config:
        from_attributes = True


class DailyChallengeOut(BaseModel):
    date: datetime
    question: QuestionOut


class ExecuteRequest(BaseModel):
    code: str
    language: str
    question_id: Optional[int] = None
    custom_input: Optional[str] = None


class ExecuteResponse(BaseModel):
    status: str
    output: str
    test_cases: Optional[List[dict]] = None
    execution_time: float


# ---------------------------------------------------------------------------
# Auth Routes
# ---------------------------------------------------------------------------
@app.post("/api/v1/auth/register", response_model=UserOut, tags=["Auth"])
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=_hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/v1/auth/token", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Obtain a JWT access token."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not _verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = _create_access_token(
        {"sub": user.username},
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/v1/auth/me", response_model=UserOut, tags=["Auth"])
def me(current_user: User = Depends(_get_current_user)):
    return current_user


# ---------------------------------------------------------------------------
# Topics / Modules
# ---------------------------------------------------------------------------
@app.get("/api/v1/topics", response_model=List[TopicOut], tags=["Modules"])
def list_topics(db: Session = Depends(get_db)):
    """List all learning topics/modules."""
    return db.query(Topic).order_by(Topic.order_index).all()


@app.get("/api/v1/topics/{slug}", response_model=TopicOut, tags=["Modules"])
def get_topic(slug: str, db: Session = Depends(get_db)):
    """Get a single topic by its slug."""
    topic = db.query(Topic).filter(Topic.slug == slug).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic


@app.get("/api/v1/modules/{slug}", response_model=ModuleDetail, tags=["Modules"])
def get_module_detail(slug: str, db: Session = Depends(get_db)):
    """Get comprehensive module details including all its questions."""
    topic = db.query(Topic).filter(Topic.slug == slug).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Module not found")
    
    questions = db.query(Question).filter(Question.topic_id == topic.id).all()
    
    return {
        "topic": topic,
        "questions": questions
    }


# ---------------------------------------------------------------------------
# Questions / Practice Engine
# ---------------------------------------------------------------------------
@app.get("/api/v1/questions", response_model=List[QuestionOut], tags=["Practice"])
def list_questions(
    topic_id: Optional[int] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="easy | medium | hard"),
    db: Session = Depends(get_db),
):
    """List questions, optionally filtered by topic and/or difficulty."""
    q = db.query(Question).filter(Question.is_published == True)
    if topic_id:
        q = q.filter(Question.topic_id == topic_id)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty.lower())
    return q.all()


@app.get("/api/v1/questions/{slug}", response_model=QuestionDetail, tags=["Practice"])
def get_question(slug: str, db: Session = Depends(get_db)):
    """Get full question details including starter code."""
    question = db.query(Question).filter(Question.slug == slug).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


# ---------------------------------------------------------------------------
# User Progress
# ---------------------------------------------------------------------------
@app.get("/api/v1/progress", response_model=List[ProgressOut], tags=["Progress"])
def get_progress(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's progress, optionally filtered by status."""
    q = db.query(UserProgress).filter(UserProgress.user_id == current_user.id)
    if status_filter:
        q = q.filter(UserProgress.status == status_filter)
    return q.all()


@app.post("/api/v1/progress/{question_id}", response_model=ProgressOut, tags=["Progress"])
def update_progress(
    question_id: int,
    payload: ProgressUpdate,
    current_user: User = Depends(_get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a user's progress record for a given question."""
    prog = (
        db.query(UserProgress)
        .filter(
            UserProgress.user_id == current_user.id,
            UserProgress.question_id == question_id,
        )
        .first()
    )
    if not prog:
        prog = UserProgress(user_id=current_user.id, question_id=question_id)
        db.add(prog)

    prog.status = payload.status
    prog.attempts = (prog.attempts or 0) + 1
    prog.last_attempted_at = datetime.now(timezone.utc)
    if payload.status == "completed":
        prog.completed_at = datetime.now(timezone.utc)
    if payload.notes is not None:
        prog.notes = payload.notes

    db.commit()
    db.refresh(prog)

    # Update User stats if completed
    if payload.status == "completed":
        current_user.total_solved = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.status == "completed"
        ).count()
        # Simple streak logic: if last login was yesterday or today, keep/increment streak
        # (For production, this would be more robust)
        current_user.streak_count = (current_user.streak_count or 0) + 1
        db.commit()

    return prog


# ---------------------------------------------------------------------------
# Dashboard & Daily Challenge
# ---------------------------------------------------------------------------
@app.get("/api/v1/dashboard/stats", response_model=StatsOut, tags=["Dashboard"])
def get_dashboard_stats(current_user: User = Depends(_get_current_user), db: Session = Depends(get_db)):
    """Get summarized stats for the user dashboard."""
    # Topic progress
    topics = db.query(Topic).all()
    topic_progress = []
    for t in topics:
        total_q = db.query(Question).filter(Question.topic_id == t.id).count()
        solved_q = db.query(UserProgress).join(Question).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.status == "completed",
            Question.topic_id == t.id
        ).count()
        topic_progress.append({
            "name": t.name,
            "solved": solved_q,
            "total": total_q,
            "percentage": (solved_q / total_q * 100) if total_q > 0 else 0
        })

    # Recent activity
    recent = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).order_by(UserProgress.last_attempted_at.desc()).limit(5).all()
    
    activity = []
    for r in recent:
        q = db.query(Question).filter(Question.id == r.question_id).first()
        activity.append({
            "question_title": q.title,
            "status": r.status,
            "timestamp": r.last_attempted_at
        })

    return {
        "total_solved": current_user.total_solved,
        "streak": current_user.streak_count,
        "accuracy": 85.5,  # Mock accuracy for now
        "recent_activity": activity,
        "topic_progress": topic_progress
    }


@app.get("/api/v1/daily-challenge", response_model=DailyChallengeOut, tags=["Practice"])
def get_daily_challenge(db: Session = Depends(get_db)):
    """Get the problem of the day."""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    challenge = db.query(DailyChallenge).filter(DailyChallenge.date == today).first()
    
    if not challenge:
        # Fallback: pick a random question if no challenge set for today
        q = db.query(Question).first()
        if not q:
            raise HTTPException(status_code=404, detail="No questions available")
        challenge = DailyChallenge(question_id=q.id, date=today)
        db.add(challenge)
        db.commit()
        db.refresh(challenge)
    
    return challenge


# ---------------------------------------------------------------------------
# Code Execution (Mock)
# ---------------------------------------------------------------------------
@app.post("/api/v1/execute", response_model=ExecuteResponse, tags=["Practice"])
async def execute_code(payload: ExecuteRequest, db: Session = Depends(get_db)):
    """
    Simulate code execution against test cases.
    In a real production app, this would call a sandboxed service like Judge0.
    """
    # Simulate execution time
    await asyncio.sleep(0.8)
    
    # Mock result logic
    is_success = "error" not in payload.code.lower()
    
    test_cases = [
        {"input": "Input 1", "expected": "Output 1", "actual": "Output 1", "passed": True},
        {"input": "Input 2", "expected": "Output 2", "actual": "Output 2" if is_success else "Wrong Output", "passed": is_success},
    ]
    
    return {
        "status": "success" if is_success else "failed",
        "output": "Compilation successful.\nExecution finished." if is_success else "Runtime Error: segmentation fault",
        "test_cases": test_cases,
        "execution_time": 0.124
    }


# ---------------------------------------------------------------------------
# Discussions
# ---------------------------------------------------------------------------
@app.get("/api/v1/questions/{slug}/discussions", response_model=List[DiscussionOut], tags=["Discussions"])
def list_discussions(slug: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.slug == slug).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    discussions = db.query(Discussion).filter(Discussion.question_id == q.id).all()
    out = []
    for d in discussions:
        out.append({
            "id": d.id,
            "title": d.title,
            "content": d.content,
            "user_id": d.user_id,
            "username": d.user.username,
            "created_at": d.created_at,
            "comment_count": len(d.comments)
        })
    return out


@app.post("/api/v1/questions/{slug}/discussions", response_model=DiscussionOut, tags=["Discussions"])
def create_discussion(
    slug: str, 
    payload: DiscussionCreate, 
    current_user: User = Depends(_get_current_user), 
    db: Session = Depends(get_db)
):
    q = db.query(Question).filter(Question.slug == slug).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    d = Discussion(
        question_id=q.id,
        user_id=current_user.id,
        title=payload.title,
        content=payload.content
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return {
        "id": d.id,
        "title": d.title,
        "content": d.content,
        "user_id": d.user_id,
        "username": current_user.username,
        "created_at": d.created_at,
        "comment_count": 0
    }


@app.get("/api/v1/discussions/{discussion_id}/comments", response_model=List[CommentOut], tags=["Discussions"])
def list_comments(discussion_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.discussion_id == discussion_id).all()
    return [
        {
            "id": c.id,
            "content": c.content,
            "user_id": c.user_id,
            "username": c.user.username,
            "created_at": c.created_at
        } for c in comments
    ]


# ---------------------------------------------------------------------------
# AI Chat Route
# ---------------------------------------------------------------------------
DSA_CPP_SYSTEM_PROMPT = """
You are an expert C++ and Data Structures & Algorithms (DSA) tutor embedded in a
learning platform. Your responses must adhere to the following strict rules:

1. SCOPE: Only answer questions directly related to C++ programming and/or Data
   Structures & Algorithms. If asked about anything outside this scope (e.g.,
   Python, web frameworks, general advice), politely decline and redirect the
   user to ask a DSA/C++ question.

2. HINTS ONLY: Never give away direct solutions or complete implementations.
   Instead, guide the user with conceptual hints, analogies, and pseudocode.
   Encourage them to think through the problem themselves.

3. CODE EXPLANATIONS: When shown a C++ code snippet, explain it line-by-line in
   simple, beginner-friendly language. Highlight the role of each variable, loop,
   or data structure used.

4. COMPLEXITY ANALYSIS: After discussing an algorithm, always mention its Big-O
   time and space complexity and briefly explain why.

5. TONE: Be encouraging, patient, and supportive. Use examples and analogies to
   clarify difficult concepts.

6. FORMAT: Use Markdown for all responses. Use code blocks with `cpp` syntax
   highlighting for any C++ code snippets you include.
"""

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


@app.post("/api/v1/chat", response_model=ChatResponse, tags=["AI Chat"])
async def chat(payload: ChatRequest):
    """
    AI Chat endpoint. Connects to an LLM (Gemini or OpenAI) restricted to
    C++ and DSA topics only.

    Set either GEMINI_API_KEY or OPENAI_API_KEY environment variable.
    If neither is set, a stub response is returned for development.
    """
    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # --- Gemini path ---
    if GEMINI_API_KEY:
        contents = []
        for turn in (payload.history or []):
            contents.append({
                "role": turn.get("role", "user"),
                "parts": [{"text": turn.get("content", "")}],
            })
        contents.append({"role": "user", "parts": [{"text": user_message}]})

        request_body = {
            "system_instruction": {"parts": [{"text": DSA_CPP_SYSTEM_PROMPT}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024},
        }
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        )
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, json=request_body)
        
        if r.status_code != 200:
            error_detail = "Gemini API error"
            try:
                error_detail = f"Gemini API error: {r.json().get('error', {}).get('message', 'Unknown error')}"
            except: pass
            raise HTTPException(status_code=502, detail=error_detail)
            
        data = r.json()
        try:
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            return ChatResponse(reply=reply)
        except (KeyError, IndexError):
            raise HTTPException(status_code=502, detail="Unexpected response format from Gemini API")

    # --- OpenAI path ---
    if OPENAI_API_KEY:
        messages = [{"role": "system", "content": DSA_CPP_SYSTEM_PROMPT}]
        for turn in (payload.history or []):
            messages.append({"role": turn.get("role", "user"), "content": turn.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.4},
            )
        
        if r.status_code != 200:
            error_detail = "OpenAI API error"
            try:
                error_detail = f"OpenAI API error: {r.json().get('error', {}).get('message', 'Unknown error')}"
            except: pass
            raise HTTPException(status_code=502, detail=error_detail)
            
        data = r.json()
        try:
            reply = data["choices"][0]["message"]["content"]
            return ChatResponse(reply=reply)
        except (KeyError, IndexVError):
            raise HTTPException(status_code=502, detail="Unexpected response format from OpenAI API")

    # --- Development stub (no API key set) ---
    stub = (
        "Great question! 🎯 As a hint: think about the **Arrays & Strings** module — "
        "it covers foundational techniques like the two-pointer and sliding-window patterns "
        "that apply to a huge range of C++ DSA problems. "
        "Head over to that module and try the starter exercises first!"
    )
    return ChatResponse(reply=stub)


# ---------------------------------------------------------------------------
# Stress & Load Testing (CPU Intensive)
# ---------------------------------------------------------------------------

def _fibonacci_recursive(n: int) -> int:
    """Intentionally slow recursive Fibonacci."""
    if n <= 1:
        return n
    return _fibonacci_recursive(n - 1) + _fibonacci_recursive(n - 2)

def _cpu_intensive_task(complexity: int = 35):
    """Perform a mix of CPU-bound tasks."""
    start_time = time.perf_counter()
    
    # 1. Recursive Fibonacci (Heavy CPU)
    # n=35 takes ~2-4 seconds on typical Cloud Run instances
    _fibonacci_recursive(complexity)
    
    # 2. Large array sorting
    large_list = [random.random() for _ in range(1_000_000)]
    large_list.sort()
    
    # 3. Matrix-like multiplication simulation
    size = 200
    matrix = [[random.random() for _ in range(size)] for _ in range(size)]
    result = [[0 for _ in range(size)] for _ in range(size)]
    for i in range(size):
        for j in range(size):
            for k in range(size):
                result[i][j] += matrix[i][k] * matrix[k][j]
                
    end_time = time.perf_counter()
    return end_time - start_time

@app.get("/api/v1/stress", tags=["Debug"])
async def stress_test(n: int = Query(35, description="Complexity level (30-40 recommended)")):
    """
    Perform CPU-intensive tasks to simulate workload.
    Target: 2-5 seconds of active CPU usage.
    """
    start_ts = time.time()
    logger.info(f"START | /stress | complexity={n}")
    
    # Run CPU task in a thread to avoid blocking the event loop
    loop = asyncio.get_running_loop()
    duration = await loop.run_in_executor(None, _cpu_intensive_task, n)
    
    end_ts = time.time()
    total_time = end_ts - start_ts
    
    logger.info(f"END   | /stress | duration={total_time:.2f}s")
    
    return {
        "status": "success",
        "complexity": n,
        "cpu_duration_seconds": round(duration, 4),
        "total_request_time": round(total_time, 4),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/v1/load", tags=["Debug"])
async def generate_load(
    count: int = Query(50, description="Number of parallel requests to trigger"),
    n: int = Query(35, description="Complexity of each request")
):
    """
    Internally triggers multiple parallel stress requests to simulate massive load.
    """
    start_ts = time.time()
    logger.info(f"START | /load | count={count} | n={n}")
    
    # Define a small helper to call the internal endpoint
    async def call_stress():
        try:
            # We call ourselves internally
            async with httpx.AsyncClient() as client:
                # Use localhost to avoid egress costs/latency if possible
                # In Cloud Run, it might need the service URL or just call the function
                return await stress_test(n)
        except Exception as e:
            logger.error(f"Load task failed: {e}")
            return None

    # Trigger parallel tasks
    tasks = [call_stress() for _ in range(count)]
    results = await asyncio.gather(*tasks)
    
    success_count = len([r for r in results if r and r.get("status") == "success"])
    
    end_ts = time.time()
    total_time = end_ts - start_ts
    
    logger.info(f"END   | /load | success={success_count}/{count} | total_duration={total_time:.2f}s")
    
    return {
        "status": "completed",
        "requested_calls": count,
        "successful_calls": success_count,
        "total_load_duration": round(total_time, 4),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/api/v1/debug/json", tags=["Debug"])
async def process_large_json(payload: dict):
    """Simulate processing a large JSON payload (I/O & Memory load)."""
    size_kb = len(str(payload)) / 1024
    logger.info(f"RECEIVED | /debug/json | size={size_kb:.2f}KB")
    # Simulate some processing
    await asyncio.sleep(0.5)
    return {"status": "processed", "size_kb": round(size_kb, 2)}

@app.get("/api/v1/debug/file", tags=["Debug"])
async def download_dummy_file(size_mb: int = Query(5, description="Size in MB")):
    """Simulate a large file download (Network egress load)."""
    logger.info(f"START | /debug/file | size={size_mb}MB")
    content = b"0" * (size_mb * 1024 * 1024)
    return content
def _seed_data():
    db = SessionLocal()
    try:
        topics_data = [
            ("Arrays & Strings",    "arrays-strings",    "Foundation of every DSA interview.",              "📦", 1),
            ("Linked Lists",        "linked-lists",      "Pointers, nodes, and classic traversal tricks.",  "🔗", 2),
            ("Stacks & Queues",     "stacks-queues",     "LIFO/FIFO structures and their applications.",   "📚", 3),
            ("Trees & BST",         "trees-bst",         "Binary trees, BST operations, traversals.",       "🌳", 4),
            ("Graphs",              "graphs",            "BFS, DFS, shortest paths, and more.",             "🕸️", 5),
            ("Dynamic Programming", "dynamic-programming","Memoization, tabulation, and classic problems.", "⚡", 6),
            ("Sorting & Searching", "sorting-searching", "O(n log n) sorts, binary search, variants.",     "🔍", 7),
            ("Heaps & Hashing",     "heaps-hashing",     "Priority queues, hash maps, and their tricks.",  "🏔️", 8),
        ]

        for name, slug, desc, icon, order in topics_data:
            extra = MODULES_DETAILED_CONTENT.get(slug, {})
            existing = db.query(Topic).filter(Topic.slug == slug).first()
            
            if existing:
                # Update fields if they are missing or default
                if not existing.long_description or existing.long_description == "Content coming soon...":
                    existing.long_description = extra.get("long_description", "Content coming soon...")
                existing.has_code_runner = extra.get("has_code_runner", True)
                existing.icon = icon
                existing.order_index = order
            else:
                # Create new
                t = Topic(
                    name=name, 
                    slug=slug, 
                    description=desc, 
                    icon=icon, 
                    order_index=order,
                    long_description=extra.get("long_description", "Content coming soon..."),
                    has_code_runner=extra.get("has_code_runner", True)
                )
                db.add(t)
        
        db.commit()

        # Get topics map for question seeding
        topics = {t.slug: t for t in db.query(Topic).all()}

        questions_data = [
            {
                "topic_slug": "arrays-strings",
                "title": "Two Sum",
                "slug": "two-sum",
                "description": (
                    "Given an array of integers `nums` and an integer `target`, "
                    "return indices of the two numbers such that they add up to `target`.\n\n"
                    "You may assume that each input would have exactly one solution."
                ),
                "difficulty": "easy",
                "time_complexity": "O(n)",
                "space_complexity": "O(n)",
                "starter_code_cpp": (
                    "#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n"
                    "class Solution {\npublic:\n"
                    "    vector<int> twoSum(vector<int>& nums, int target) {\n"
                    "        // Your code here\n"
                    "    }\n};"
                ),
                "solution_code_cpp": (
                    "#include <vector>\n#include <unordered_map>\nusing namespace std;\n\n"
                    "class Solution {\npublic:\n"
                    "    vector<int> twoSum(vector<int>& nums, int target) {\n"
                    "        unordered_map<int, int> mp;\n"
                    "        for (int i = 0; i < nums.size(); i++) {\n"
                    "            int complement = target - nums[i];\n"
                    "            if (mp.count(complement)) return {mp[complement], i};\n"
                    "            mp[nums[i]] = i;\n"
                    "        }\n"
                    "        return {};\n"
                    "    }\n};"
                ),
                "hints": "Think about using a hash map.\nFor each number, check if target - number is already in the map.",
                "examples": [
                    {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."},
                    {"input": "nums = [3,2,4], target = 6", "output": "[1,2]"}
                ],
                "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9",
                "tags": ["Arrays", "Hash Table"]
            },
            {
                "topic_slug": "arrays-strings",
                "title": "Longest Substring Without Repeating Characters",
                "slug": "longest-substring-no-repeat",
                "description": (
                    "Given a string `s`, find the length of the longest substring "
                    "without repeating characters."
                ),
                "difficulty": "medium",
                "time_complexity": "O(n)",
                "space_complexity": "O(min(m, n))",
                "starter_code_cpp": (
                    "#include <string>\n#include <unordered_map>\nusing namespace std;\n\n"
                    "class Solution {\npublic:\n"
                    "    int lengthOfLongestSubstring(string s) {\n"
                    "        // Your code here\n"
                    "    }\n};"
                ),
                "solution_code_cpp": (
                    "#include <string>\n#include <unordered_map>\n#include <algorithm>\nusing namespace std;\n\n"
                    "class Solution {\npublic:\n"
                    "    int lengthOfLongestSubstring(string s) {\n"
                    "        unordered_map<char, int> mp;\n"
                    "        int maxLen = 0, start = 0;\n"
                    "        for (int i = 0; i < s.length(); i++) {\n"
                    "            if (mp.count(s[i])) start = max(start, mp[s[i]] + 1);\n"
                    "            mp[s[i]] = i;\n"
                    "            maxLen = max(maxLen, i - start + 1);\n"
                    "        }\n"
                    "        return maxLen;\n"
                    "    }\n};"
                ),
                "hints": "Use the sliding window technique.\nMaintain a map of character positions.",
                "examples": [
                    {"input": "s = \"abcabcbb\"", "output": "3", "explanation": "The answer is \"abc\", with the length of 3."}
                ],
                "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
                "tags": ["Strings", "Sliding Window", "Hash Table"]
            },
            {
                "topic_slug": "linked-lists",
                "title": "Reverse a Linked List",
                "slug": "reverse-linked-list",
                "description": (
                    "Given the head of a singly linked list, reverse the list and return the reversed list."
                ),
                "difficulty": "easy",
                "time_complexity": "O(n)",
                "space_complexity": "O(1)",
                "starter_code_cpp": (
                    "struct ListNode {\n    int val;\n    ListNode* next;\n};\n\n"
                    "class Solution {\npublic:\n"
                    "    ListNode* reverseList(ListNode* head) {\n"
                    "        // Your code here\n"
                    "    }\n};"
                ),
                "solution_code_cpp": (
                    "class Solution {\npublic:\n"
                    "    ListNode* reverseList(ListNode* head) {\n"
                    "        ListNode *prev = nullptr, *curr = head;\n"
                    "        while (curr) {\n"
                    "            ListNode* next = curr->next;\n"
                    "            curr->next = prev;\n"
                    "            prev = curr;\n"
                    "            curr = next;\n"
                    "        }\n"
                    "        return prev;\n"
                    "    }\n};"
                ),
                "hints": "Use three pointers: prev, curr, next.\nIterate and reverse the next pointer.",
                "examples": [
                    {"input": "head = [1,2,3,4,5]", "output": "[5,4,3,2,1]"}
                ],
                "constraints": "The number of nodes in the list is the range [0, 5000].\n-5000 <= Node.val <= 5000",
                "tags": ["Linked List", "Recursion"]
            },
        ]
        for qd in questions_data:
            topic = topics[qd.pop("topic_slug")]
            # Only add if not already exists
            existing = db.query(Question).filter(Question.slug == qd["slug"]).first()
            if not existing:
                q = Question(topic_id=topic.id, **qd)
                db.add(q)
            else:
                # Update existing
                for key, val in qd.items():
                    setattr(existing, key, val)

        db.commit()

        # Seed default user
        user = db.query(User).filter(User.username == "gamer").first()
        if not user:
            user = User(
                username="gamer",
                email="gamer@example.com",
                hashed_password=_hash_password("password123"),
                streak_count=5,
                total_solved=12
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Seed dummy discussions
        q_two_sum = db.query(Question).filter(Question.slug == "two-sum").first()
        if q_two_sum and not db.query(Discussion).filter(Discussion.question_id == q_two_sum.id).first():
            d = Discussion(
                question_id=q_two_sum.id,
                user_id=user.id,
                title="Is the hash map approach always O(n)?",
                content="I was wondering if there are cases where the hash map collisions could make this O(n^2)?"
            )
            db.add(d)
            db.commit()
            db.refresh(d)
            
            c = Comment(
                discussion_id=d.id,
                user_id=user.id,
                content="Great question! In C++, `std::unordered_map` uses hashing. While the worst case is O(n), the average case is O(1)."
            )
            db.add(c)
            db.commit()

        # Seed Daily Challenge if none for today
        from sqlalchemy.exc import IntegrityError
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        if not db.query(DailyChallenge).filter(DailyChallenge.date == today).first():
            q = db.query(Question).filter(Question.slug == "two-sum").first()
            if q:
                try:
                    dc = DailyChallenge(question_id=q.id, date=today)
                    db.add(dc)
                    db.commit()
                except IntegrityError:
                    db.rollback()


    finally:
        db.close()


# ---------------------------------------------------------------------------
# Static Frontend (SPA Support)
# ---------------------------------------------------------------------------
import os
import pathlib
from fastapi.responses import FileResponse

_dist_dir = pathlib.Path(__file__).parent.parent / "frontend-v2" / "dist"

if _dist_dir.exists():
    # Mount assets folder
    app.mount("/assets", StaticFiles(directory=str(_dist_dir / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Exclude API routes and docs
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404)
        
        # Check if file exists in dist
        file_path = _dist_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
            
        # Fallback to index.html for SPA
        return FileResponse(str(_dist_dir / "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "Backend is running. Build frontend with 'npm run build' to see the UI."}
