# FormWise AI 🇮🇳

> **Understand. Fill. Verify. Apply.**  
> An intelligent document intelligence and application automation platform engineered for Indian citizens.

FormWise AI eliminates the friction, confusion, and rejection rates in completing complex applications for scholarships, college admissions, government certificates (income, caste, residence), welfare schemes, and competitive examinations.

---

## 🚀 Key Capabilities

- **Universal Form Scanner & Layout Analysis:** Ingest multi-page PDFs, scanned images (PNG, JPG), or camera captures. PyMuPDF renders high-resolution page previews and computes pixel-accurate bounding box coordinates for every field.
- **Personal Document Vault & OCR Pipeline:** Securely stores Aadhaar, PAN, 10th marksheet, income certificates, caste certificates, and bank passbooks. Extracts structured entities and enforces citizen review and consent before saving.
- **Bilingual Field Explanation Assistant:** Explains complex bureaucratic jargon, expected format examples, required supporting certificates, and rejection warnings in fluent **English**, **Telugu (తెలుగు)**, and **Hindi (हिन्दी)**.
- **Dual-Mode Intelligent Autofill:**
  - **Mode A (Assisted Autofill):** Displays confidence-scored suggestions and source citations for manual review and individual approval.
  - **Mode B (Smart Automatic Autofill):** Automatically stages fields with $\ge 95\%$ confidence while highlighting sensitive fields (Aadhaar, Caste, Bank Account) for explicit confirmation.
- **Deterministic Indian Format Validation:** Verifies 10-digit mobile numbers (starting 6-9), 6-digit postal PIN codes (starting 1-9), PAN format (`[A-Z]{5}[0-9]{4}[A-Z]`), and bank IFSC codes.
- **Pixel-Accurate PDF Generation:** Overlays confirmed data directly onto the original form's coordinates with an automated FormWise verification stamp.
- **DPDP Act 2023 Compliant:** Strict citizen data isolation, masked identity numbers (`XXXX-XXXX-1234`), private storage, and complete audit logging.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React, React Router v7 |
| **Backend** | FastAPI, Python 3.11, Pydantic v2, PyJWT, direct `bcrypt` (72-byte safe) |
| **Document Processing** | PyMuPDF (`pymupdf`), Pillow, ReportLab |
| **Database** | SQLAlchemy ORM (SQLite with standard journal for Windows/OneDrive resilience; PostgreSQL/Supabase compatible) |
| **AI Engine** | Google Gemini (`gemini-2.5-flash` via `google-genai` SDK) + offline deterministic multilingual knowledge engine |

---

## 📋 Prerequisites

- **Python:** 3.10 or 3.11 installed and added to `PATH`.
- **Node.js:** v18+ or v20+ with `npm` installed.

---

## ⚡ Quickstart Guide

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload --port 8000
```

The backend API will be live at `http://localhost:8000`.  
Explore interactive OpenAPI documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a separate terminal:

```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root or `backend/` directory:

```env
APP_NAME=FormWise AI
APP_ENV=development
SECRET_KEY=formwise-ai-super-secret-production-key-2026-secure-jwt

# Database (Default: SQLite local database)
DATABASE_URL=sqlite:///./formwise.db

# Optional Supabase Connection
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# AI Provider (gemini or offline heuristic fallback)
LLM_PROVIDER=gemini
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.5-flash

# Storage
STORAGE_DIR=./backend_storage
FRONTEND_URL=http://localhost:5173
```

> **Note:** If `LLM_API_KEY` is not provided, FormWise AI automatically activates its high-precision offline bilingual knowledge engine for English, Telugu, and Hindi.

---

## 🧪 Running Automated Tests

FormWise AI includes comprehensive test suites covering unit logic and end-to-end multi-step application scenarios:

```bash
# 1. Run core unit tests (Security, OCR, Autofill, Validation, PDF Generation)
python tests/test_backend.py

# 2. Run complete 14-step scholarship application scenario & tenant data isolation test
python tests/test_end_to_end_scenario.py
```

---

## 🏛️ Documentation

- [System Architecture & Design](file:///docs/architecture.md)
- [REST API Reference](file:///docs/api.md)
- [Privacy & DPDP Act 2023 Compliance](file:///docs/privacy.md)

---

## 🔒 Security & Privacy

FormWise AI strictly adheres to the **Digital Personal Data Protection (DPDP) Act, 2023**. Personal documents are stored in private isolated directories, never indexed in public web roots, and all sensitive identity numbers are masked prior to persistence.

