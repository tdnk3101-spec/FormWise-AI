import re
from typing import List, Dict, Any
from app.models.models import DetectedField, UserDocument

class ValidationEngine:
    @staticmethod
    def validate_form(fields: List[DetectedField], uploaded_documents: List[UserDocument]) -> Dict[str, Any]:
        """
        Executes deterministic field validation and produces the missing information checklist.
        """
        errors = []
        warnings = []
        checklist = []
        total_checks = 0
        passed_checks = 0

        # Build map of available document types in vault
        doc_types_available = {doc.document_type for doc in uploaded_documents}

        for field in fields:
            val = (field.filled_value or "").strip()
            norm = field.normalized_name
            label = field.label
            f_id = field.id

            # 1. Required field check
            if field.is_required:
                total_checks += 1
                if not val:
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "required_field",
                        "is_valid": False,
                        "error_message": f"Mandatory field '{label}' is blank.",
                        "correction_needed": f"Please provide {label} before final export.",
                        "severity": "error",
                        "blocks_export": True
                    })
                    checklist.append({
                        "id": f"chk_{norm}",
                        "item_name": label,
                        "item_type": "field",
                        "is_satisfied": False,
                        "required_doc_type": field.supporting_doc,
                        "status": "missing"
                    })
                    continue
                else:
                    passed_checks += 1
                    checklist.append({
                        "id": f"chk_{norm}",
                        "item_name": label,
                        "item_type": "field",
                        "is_satisfied": True,
                        "required_doc_type": field.supporting_doc,
                        "status": "available"
                    })

            if not val:
                continue

            # 2. Indian Mobile Number validation (10 digits starting with 6,7,8,9)
            if "mobile" in norm or "phone" in norm:
                total_checks += 1
                cleaned = re.sub(r"[\s+-]", "", val)
                if cleaned.startswith("91") and len(cleaned) == 12:
                    cleaned = cleaned[2:]
                if not re.match(r"^[6-9]\d{9}$", cleaned):
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "mobile_format",
                        "is_valid": False,
                        "error_message": f"Invalid Indian mobile number: '{val}'.",
                        "correction_needed": "Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.",
                        "severity": "error",
                        "blocks_export": True
                    })
                else:
                    passed_checks += 1

            # 3. PIN Code validation (6 digits starting with 1-9)
            elif "pin" in norm or "postal" in norm:
                total_checks += 1
                cleaned = val.replace(" ", "")
                if not re.match(r"^[1-9][0-9]{5}$", cleaned):
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "pincode_format",
                        "is_valid": False,
                        "error_message": f"Invalid PIN code: '{val}'.",
                        "correction_needed": "Enter a valid 6-digit Indian PIN code.",
                        "severity": "error",
                        "blocks_export": True
                    })
                else:
                    passed_checks += 1

            # 4. Email format validation
            elif "email" in norm:
                total_checks += 1
                if not re.match(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", val):
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "email_format",
                        "is_valid": False,
                        "error_message": f"Invalid email format: '{val}'.",
                        "correction_needed": "Enter a standard email address like name@domain.com.",
                        "severity": "error",
                        "blocks_export": True
                    })
                else:
                    passed_checks += 1

            # 5. PAN validation
            elif "pan" in norm:
                total_checks += 1
                cleaned = val.replace(" ", "").upper()
                if not re.match(r"^[A-Z]{5}[0-9]{4}[A-Z]$", cleaned):
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "pan_format",
                        "is_valid": False,
                        "error_message": f"Invalid PAN number format: '{val}'.",
                        "correction_needed": "PAN must be 10 characters: 5 uppercase letters, 4 digits, 1 uppercase letter.",
                        "severity": "error",
                        "blocks_export": True
                    })
                else:
                    passed_checks += 1

            # 6. IFSC Code validation
            elif "ifsc" in norm:
                total_checks += 1
                cleaned = val.replace(" ", "").upper()
                if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", cleaned):
                    errors.append({
                        "field_id": f_id,
                        "rule_name": "ifsc_format",
                        "is_valid": False,
                        "error_message": f"Invalid IFSC code: '{val}'.",
                        "correction_needed": "IFSC must be 11 characters (first 4 alphabetic, 5th is zero '0', last 6 alphanumeric).",
                        "severity": "error",
                        "blocks_export": True
                    })
                else:
                    passed_checks += 1

            # 7. Annual Income numeric validation
            elif "income" in norm:
                total_checks += 1
                cleaned = re.sub(r"[^0-9]", "", val)
                if not cleaned or int(cleaned) <= 0:
                    warnings.append({
                        "field_id": f_id,
                        "rule_name": "income_format",
                        "is_valid": False,
                        "error_message": f"Suspicious or non-numeric income figure: '{val}'.",
                        "correction_needed": "Enter total annual family income as a positive integer.",
                        "severity": "warning",
                        "blocks_export": False
                    })
                else:
                    passed_checks += 1

        # 8. Cross-field requirement checks for supporting documents
        category_field = next((f for f in fields if f.normalized_name == "category"), None)
        if category_field and category_field.filled_value:
            cat_val = category_field.filled_value.upper()
            if any(reserved in cat_val for reserved in ["OBC", "SC", "ST", "EWS", "BC"]):
                has_caste_cert = any("caste" in dt.lower() for dt in doc_types_available)
                checklist.append({
                    "id": "chk_caste_cert",
                    "item_name": "Caste / Category Certificate",
                    "item_type": "document",
                    "is_satisfied": has_caste_cert,
                    "required_doc_type": "Caste Certificate",
                    "status": "available" if has_caste_cert else "missing"
                })
                if not has_caste_cert:
                    warnings.append({
                        "field_id": category_field.id,
                        "rule_name": "caste_cert_missing",
                        "is_valid": False,
                        "error_message": f"Reservation category '{category_field.filled_value}' claimed, but no Caste Certificate found in Document Vault.",
                        "correction_needed": "Upload your Caste/Community Certificate to your Document Vault to satisfy official audit requirements.",
                        "severity": "warning",
                        "blocks_export": False
                    })

        income_field = next((f for f in fields if "income" in f.normalized_name), None)
        if income_field and income_field.filled_value:
            has_income_cert = any("income" in dt.lower() for dt in doc_types_available)
            checklist.append({
                "id": "chk_income_cert",
                "item_name": "Income Certificate (Revenue Authority)",
                "item_type": "document",
                "is_satisfied": has_income_cert,
                "required_doc_type": "Income Certificate",
                "status": "available" if has_income_cert else "missing"
            })
            if not has_income_cert:
                warnings.append({
                    "field_id": income_field.id,
                    "rule_name": "income_cert_missing",
                    "is_valid": False,
                    "error_message": "Annual family income declared without supporting Income Certificate in Vault.",
                    "correction_needed": "Attach a valid Income Certificate issued by Tahsildar/MRO before final physical submission.",
                    "severity": "warning",
                    "blocks_export": False
                })

        # Ready for export if there are 0 blocking errors
        is_ready = len(errors) == 0

        return {
            "is_ready_for_export": is_ready,
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "errors": errors,
            "warnings": warnings,
            "checklist": checklist
        }

