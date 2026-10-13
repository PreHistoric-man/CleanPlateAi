# CleanPlate AI 🍽️✨

CleanPlate AI is an Android-first restaurant hygiene assessment and discovery platform. It enables restaurant owners to capture or upload kitchen photographs by zone, identify visible hygiene risks with AI vision adapters, receive transparent score deductions and cleaning recommendations, and publish verified cleanliness records for customers to discover.

---

## Architecture Overview

- **Mobile App (`mobile/`)**: React Native, Expo SDK 52, TypeScript, Expo Router, Lucide icons.
- **Backend API (`backend/`)**: Python 3.12, FastAPI, Pydantic v2, Pytest.
- **Database & Auth (`backend/supabase/`)**: Supabase (PostgreSQL 15+), Row Level Security (RLS) policies, seed migrations.
- **AI Vision Engine**: Pluggable Vision Adapter with transparent, rule-based scoring engine and deterministic demo fallback.

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Run backend tests:
```bash
pytest -v
```

### 2. Supabase Setup
- Run `backend/supabase/schema.sql` to establish tables, types, and indexes.
- Run `backend/supabase/rls_policies.sql` to apply Row Level Security.
- Run `backend/supabase/seed.sql` to seed sample restaurants and assessments.

### 3. Mobile App Setup

```bash
cd mobile
npm install
npm run start
```
- Press `a` to run on an connected Android emulator/device.
- Press `w` to open web preview.

---

## Food-Safety Disclaimers & Regulatory Boundary
CleanPlate AI evaluates **visible cleanliness only** from photographs. It does not establish microbiological sanitization, food internal temperatures, or substitute for statutory health inspections (e.g., FSSAI in India or FDA / local public health authority audits).
