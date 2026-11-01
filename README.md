# FormWise AI 🇮🇳

> **Understand. Fill. Verify. Apply.**  
> An intelligent document intelligence and application automation platform engineered for Indian citizens.

FormWise AI eliminates the friction, confusion, and rejection rates in completing complex applications for scholarships, college admissions, government certificates (income, caste, residence), welfare schemes, and competitive examinations.

---

## 🌟 Single Unified Architecture

FormWise AI is built as a single, cohesive full-stack web application. The frontend and backend run together from one unified server on **`http://localhost:8000`**:
- **Single Port:** No divided servers or ports (`5173` vs `8000`).
- **No 502 Bad Gateway:** API requests connect directly to the server on the same host without proxy intermediaries.
- **Single Command:** Launch everything with `python run.py`.

---

## 🚀 Key Capabilities

- **Universal Form Scanner & Layout Analysis:** Ingest multi-page PDFs, scanned images (PNG, JPG), or camera captures. PyMuPDF renders high-resolution page previews and computes pixel-accurate bounding box coordinates for every field.
- **Personal Document Vault & OCR Pipeline:** Securely stores Aadhaar, PAN, 10th marksheet, income certificates, caste certificates, and bank passbooks. Extracts structured entities and enforces citizen review and consent before saving.
- **Bilingual Field Explanation Assistant:** Explains complex bureaucratic jargon, expected format examples, required supporting certificates, and rejection warnings in fluent, simple English.
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
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, React Router v7 |
| **Backend** | FastAPI, Python 3.11, Pydantic v2, PyJWT, direct `bcrypt` (72-byte safe) |
| **Document Processing** | PyMuPDF (`pymupdf`), Pillow, ReportLab |
| **Database** | SQLAlchemy ORM (SQLite with standard journal for Windows/OneDrive resilience; PostgreSQL/Supabase compatible) |
| **AI Engine** | Google Gemini (`gemini-2.5-flash` via `google-genai` SDK) + offline deterministic knowledge engine |

---

## ⚡ Quickstart Guide (One Command)

### Run the Unified Application

```bash
# Clone the repository
git clone https://github.com/tdnk3101-spec/FormWise-AI.git
cd FormWise-AI

# Install dependencies (if first time)
pip install -r backend/requirements.txt

# Start the unified server
python run.py
```

Open your browser at **`http://localhost:8000`**!

- **Web Application:** `http://localhost:8000`
- **Interactive API Documentation:** `http://localhost:8000/docs`

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root directory:

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

# Storage Directory
STORAGE_DIR=./backend_storage

# LLM Provider: 'gemini' or 'local_fallback'
LLM_PROVIDER=gemini
LLM_API_KEY=
```

---

## 🧪 Automated Test Suite

Run the comprehensive test suite directly:

```bash
# Backend unit & security tests (5 tests)
python tests/test_backend.py

# End-to-end multi-step workflow simulation (14 scenarios)
python -u tests/test_end_to_end_scenario.py
```

---

## 📄 License

FormWise AI is open-source software licensed under the MIT License.
