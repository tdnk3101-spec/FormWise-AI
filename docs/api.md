# FormWise AI — REST API Reference (v1)

Base URL: `http://localhost:8000/api/v1`  
Interactive OpenAPI Explorer: `http://localhost:8000/docs`

---

## 1. Authentication (`/auth`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | No | Creates citizen account, hashes password via bcrypt, initializes empty profile. |
| `/auth/login` | `POST` | No | Validates credentials, records audit event, returns Bearer JWT. |
| `/auth/me` | `GET` | Yes | Retrieves current authenticated citizen profile and RBAC role. |

---

## 2. User Profiles (`/users`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/users/profile` | `GET` | Yes | Returns master verified profile (personal, educational, financial). |
| `/users/profile` | `PUT` | Yes | Updates citizen master profile with full validation. |

---

## 3. Personal Document Vault (`/documents`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/documents/upload` | `POST` | Yes | Uploads identity, education, or financial document (`multipart/form-data`). |
| `/documents/` | `GET` | Yes | Lists all active vaulted documents for current citizen. |
| `/documents/{document_id}` | `GET` | Yes | Retrieves document metadata and extracted fields. |
| `/documents/{document_id}/extract` | `POST` | Yes | Runs OCR pipeline, parses Indian document entities. |
| `/documents/{document_id}/approve` | `POST` | Yes | Citizen approves or modifies extracted values into verified profile. |
| `/documents/{document_id}/file` | `GET` | Yes | Streams private document with short-lived authorization check. |
| `/documents/{document_id}` | `DELETE` | Yes | Securely purges document and file from disk. |

---

## 4. Universal Form Intelligence (`/forms`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/forms/upload` | `POST` | Yes | Uploads application form (PDF, JPG, PNG) or camera scan. |
| `/forms/` | `GET` | Yes | Lists all user application forms with completion status. |
| `/forms/{form_id}` | `GET` | Yes | Returns form layout, sections, detected fields, and bounding boxes. |
| `/forms/{form_id}/preview/{page_num}` | `GET` | Yes | Returns 150 DPI rendered PNG of requested form page. |
| `/forms/{form_id}/fields/{field_id}` | `PUT` | Yes | Updates a single field value manually. |
| `/forms/{form_id}/explain` | `POST` | Yes | Explains field in English, Telugu (తెలుగు), or Hindi (हिन्दी). |
| `/forms/{form_id}/chat` | `POST` | Yes | Conversational form assistant with contextual field tips. |

---

## 5. Autofill & Smart Matching (`/autofill`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/autofill/{form_id}` | `POST` | Yes | Generates autofill suggestions in Mode A (assisted) or Mode B (automatic). |
| `/autofill/{form_id}/confirm` | `POST` | Yes | Commits citizen-confirmed values into application form fields. |

---

## 6. Form Validation & Document Generation (`/validation`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/validation/{form_id}` | `POST` | Yes | Runs Indian format validators and cross-field document checks. |
| `/validation/{form_id}/export` | `POST` | Yes | Synthesizes filled PDF with coordinate mapping and review stamp. |
| `/validation/{form_id}/download/{export_id}` | `GET` | Yes | Streams completed PDF file to citizen's browser. |

---

## 7. Audit History & Admin Telemetry (`/history`, `/admin`)

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/history/` | `GET` | Yes | Returns list of completed application drafts and security audit logs. |
| `/admin/stats` | `GET` | Admin | Returns global platform telemetry (total users, docs, forms, storage size). |
| `/admin/audit-logs` | `GET` | Admin | Streams immutable system-wide security audit trail. |

