# FormWise AI — Privacy, Security & India DPDP Act 2023 Compliance

FormWise AI is engineered strictly in compliance with the **Digital Personal Data Protection (DPDP) Act, 2023** of the Republic of India.

---

## 1. Core Principles Applied

### 1.1 Data Minimization
- The platform never mandates Aadhaar or PAN upload for general platform utility or form browsing.
- Extracted identity numbers are masked immediately at the OCR stage before persistence:
  - Aadhaar: Formatted as `XXXX-XXXX-1234` (only the final 4 digits are retained for verification).
  - Bank Account: Middle digits are masked (`XXXXXX1234`).
- No plain-text Aadhaar or full identity numbers are written to application log files or telemetry streams.

### 1.2 Purpose Limitation & Notice
- Documents uploaded to the Personal Document Vault are analyzed solely for the purpose of assisting the citizen with application form preparation.
- Data is never repurposed, aggregated for advertising, or shared with third parties without explicit authorization.

### 1.3 Verifiable Citizen Consent & Approval
- OCR entity extraction does not auto-populate user records silently.
- Every extracted field is tagged with `is_approved = False`.
- The user is presented with a clear verification modal where they can inspect, modify, or reject each extracted datum.
- Only confirmed and approved data becomes part of the citizen's reusable profile.

### 1.4 Dual-Mode Autofill Protection
- **Mode A (Assisted):** Citizen reviews every single suggested match individually with its confidence score and source document citation.
- **Mode B (Smart Automatic):** Non-sensitive fields with $\ge 95\%$ confidence are auto-staged, but sensitive fields (Aadhaar, Caste, Bank Account) are highlighted in amber and require explicit one-click confirmation before application generation.

---

## 2. Storage Security & Access Control

### 2.1 Complete Citizen Data Isolation
- Storage files are physically compartmentalized by citizen ID:
  ```
  backend_storage/
  ├── vault/<user_id>/...
  ├── forms/<user_id>/...
  └── exports/<user_id>/...
  ```
- File streaming endpoints enforce strict user ownership checks. If Citizen B attempts to access a document ID or export ID owned by Citizen A, the API responds with a strict `404 Not Found` (mitigating ID enumeration and unauthorized downloads).

### 2.2 Short-Lived Access & Anti-Traversal Guards
- Files are not hosted in public static directories.
- All downloads pass through authorized streaming endpoints verifying active JWT claims.
- File path operations are wrapped with path traversal guards (`os.path.basename` enforcement and boundary validation).

---

## 3. Citizen Rights & Data Subject Safeguards

| Right under DPDP Act | Platform Implementation |
| :--- | :--- |
| **Right to Access Information** | Citizens can inspect all stored documents, extracted metadata, and application drafts via the Vault and History pages. |
| **Right to Correction & Erasure** | Citizens can modify any profile field or delete any vaulted document at any time. Deletion immediately removes both the database record and the physical file from disk. |
| **Right to Grievance Redressal** | System maintains an immutable `AuditLog` table capturing every file upload, extraction approval, autofill event, and export download. |
| **Nomination / Representative Access** | Multi-profile and parent-child workflows allow parents to manage student applications transparently. |

