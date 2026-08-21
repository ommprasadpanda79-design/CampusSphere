# CampusSphere

CampusSphere is a full-stack, role-based college ERP with explainable AI risk insights. Students see their own academic picture, faculty operate only on assigned courses, and administrators manage institution-wide data and trends.

## Architecture

```text
Browser :5173
    │
    ▼
React + Vite + Tailwind ───── role-protected views
    │ /api (JWT access token + httpOnly refresh cookie)
    ▼
Express API :4000 ─────────── auth, RBAC, validation, CRUD
    │                          │
    │ Prisma                  │ POST /predict-risk
    ▼                          ▼
PostgreSQL :5432          FastAPI :8000
users, courses,           transparent risk scorer
enrollments, records      (replaceable by an ML model)
```

## Quick start with Docker

Prerequisites: Docker Desktop with Compose v2.

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:5173](http://localhost:5173). The backend runs on port `4000`, the AI service and its interactive docs on [http://localhost:8000/docs](http://localhost:8000/docs), and PostgreSQL on port `5432`.

The backend applies the checked-in Prisma migration and runs the idempotent seed whenever its container starts. Change both JWT secrets in `.env` before any non-local deployment.

The local Compose file sets `COOKIE_SECURE=false` because it serves plain `http://localhost`. Set it to `true` whenever the deployment is behind HTTPS.

### Demo accounts

All seeded accounts use password `Demo@123`.

| Role | Email |
|---|---|
| Student | `student1@campussphere.edu` |
| Faculty | `maya.iyer@campussphere.edu` |
| Admin | `admin@campussphere.edu` |

The seed contains 20 students, 5 faculty, 3 courses, 1,440 attendance entries, 240 marks, timetable details, and targeted notices. Several profiles deliberately have low attendance or falling marks so every risk band is visible.

## Local development

Start PostgreSQL, create `backend/.env` from its example, and then:

```bash
npm install
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run db:seed
npm run dev:backend
```

In another terminal:

```bash
python -m venv ai-service/.venv
# Windows: ai-service\.venv\Scripts\activate
# macOS/Linux: source ai-service/.venv/bin/activate
pip install -r ai-service/requirements.txt
uvicorn app.main:app --app-dir ai-service --reload --port 8000
```

And in a third terminal:

```bash
npm run dev:frontend
```

The Vite development server proxies `/api` to `http://localhost:4000`.

## Authorization model

- Student: reads only their attendance, marks, courses, notices, dashboard, and insight. Public registration always creates a student.
- Faculty: reads and writes attendance/marks only for courses assigned to them; class insights are limited to enrolled students in those courses.
- Admin: manages users and notices and can access all academic and institution-wide insight data.

The browser keeps the 15-minute access token in memory. A rotating seven-day refresh token is hashed in the database and delivered in an `httpOnly`, `SameSite=Lax` cookie. This avoids persistent browser storage for bearer tokens while preserving sessions across reloads.

## API reference

All routes except authentication and health require `Authorization: Bearer <access-token>`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API liveness |
| POST | `/api/auth/register` | Public | Register a student |
| POST | `/api/auth/login` | Public | Start a session |
| POST | `/api/auth/refresh` | Refresh cookie | Rotate session and return access token |
| POST | `/api/auth/logout` | Public | Revoke refresh session |
| GET/POST | `/api/users` | Admin | List/create users |
| PATCH/DELETE | `/api/users/:id` | Admin | Update/delete a user |
| GET | `/api/courses` | Any role | Role-scoped course list |
| GET/POST | `/api/attendance` | Scoped / Faculty, Admin | List or batch-upsert attendance |
| PATCH/DELETE | `/api/attendance/:id` | Faculty, Admin | Edit/delete attendance |
| GET/POST | `/api/marks` | Scoped / Faculty, Admin | List or upsert a grade |
| PATCH/DELETE | `/api/marks/:id` | Faculty, Admin | Edit/delete a grade |
| GET | `/api/notices` | Any role | Role-filtered notice feed |
| POST/PATCH/DELETE | `/api/notices[/:id]` | Admin | Manage notices |
| GET | `/api/insights/:studentId` | Scoped | Personal student risk insight |
| GET | `/api/insights/course/:courseId` | Faculty, Admin | Course risk summary |
| GET | `/api/insights/college` | Admin | Department and student risk data |
| GET | `/api/dashboard/student` | Student | Aggregated student dashboard |
| GET | `/api/dashboard/faculty/:courseId` | Faculty, Admin | Course workspace data |

Attendance batch example:

```json
{
  "courseId": "course-cs301",
  "date": "2026-08-21",
  "records": [
    { "studentId": "student-01", "status": "PRESENT" },
    { "studentId": "student-02", "status": "ABSENT" }
  ]
}
```

AI request/response:

```json
{
  "attendance_percentage": 68.5,
  "marks_trend": [74, 69, 62, 55],
  "assignment_engagement_score": 58
}
```

```json
{
  "risk_score": 76,
  "risk_label": "High",
  "contributing_factors": [
    "Attendance is below the 75% threshold (68.5%)",
    "Recent marks are declining (-6.3 points per assessment)",
    "Assignment engagement is low (58.0%)"
  ]
}
```

## Tests and checks

```bash
npm test
python -m pytest ai-service/tests
npm run build
docker compose config
```

## Project structure

```text
backend/       Express controllers, routes, middleware, services, Prisma and seed
frontend/      React role dashboards, auth context, Axios interceptors, Tailwind UI
ai-service/    FastAPI contract, rule scorer and tests
docs/          Screenshot placeholders
docker-compose.yml
```

## Screenshots

- Login — add `docs/screenshots/login.png`
- Student dashboard — add `docs/screenshots/student-dashboard.png`
- Faculty dashboard — add `docs/screenshots/faculty-dashboard.png`
- Admin dashboard — add `docs/screenshots/admin-dashboard.png`

## Responsible use

The AI score is intentionally explainable and should trigger supportive human review, not automated penalties. The current rule scorer can later be replaced by a calibrated model in `ai-service/app/scoring.py` without changing the FastAPI response contract. A production rollout should add outcome monitoring, bias checks by relevant cohorts, model/version audit logs, rate limiting, CSRF protection, TLS, and secure managed secrets.
