from typing import List, Dict, Any, Tuple
from app.models.models import DetectedField, UserProfile, ExtractedDocumentData

FIELD_ALIASES = {
    "full_name": ["full_name", "applicant_name", "candidate_name", "student_name", "name"],
    "father_name": ["father_name", "fathers_name", "parent_name"],
    "mother_name": ["mother_name", "mothers_name"],
    "dob": ["dob", "date_of_birth", "birth_date"],
    "gender": ["gender", "sex"],
    "category": ["category", "caste", "community", "social_category", "reservation_category"],
    "aadhaar_masked": ["aadhaar_masked", "aadhaar", "uid", "aadhaar_number"],
    "pan_number": ["pan_number", "pan", "pan_card"],
    "mobile_number": ["mobile_number", "mobile", "phone_number", "phone", "contact_number"],
    "email": ["email", "email_id", "email_address"],
    "address_line1": ["address_line1", "address", "residential_address", "permanent_address"],
    "pincode": ["pincode", "pin_code", "postal_code"],
    "annual_income": ["annual_income", "family_income", "total_income", "income"],
    "education_degree": ["education_degree", "degree", "qualification", "course"],
    "institution_name": ["institution_name", "college_name", "school_name", "institute"],
    "percentage_marks": ["percentage_marks", "marks", "percentage", "cgpa"],
    "account_number_masked": ["account_number_masked", "account_number", "bank_account", "account_no"],
    "ifsc_code": ["ifsc_code", "ifsc", "branch_ifsc"]
}

# Fields considered sensitive requiring mandatory user confirmation even in automatic mode
SENSITIVE_FIELDS = {"aadhaar_masked", "pan_number", "account_number_masked", "annual_income"}

class AutofillEngine:
    @staticmethod
    def match_fields(
        detected_fields: List[DetectedField],
        profile: UserProfile | None,
        extracted_docs: List[ExtractedDocumentData],
        mode: str = "assisted"
    ) -> Dict[str, Any]:
        """
        Executes Mode A (Assisted) or Mode B (Automatic) field matching.
        """
        suggestions = []
        filled_count = 0
        confirmed_count = 0
        uncertain_count = 0

        # Create quick lookup dict from approved extracted documents
        doc_lookup = {}
        for doc_item in extracted_docs:
            if doc_item.is_approved:
                doc_lookup[doc_item.field_name] = (doc_item.field_value, "Verified Vault Document", doc_item.confidence)

        for field in detected_fields:
            norm_key = field.normalized_name
            target_attr = AutofillEngine._resolve_target_attribute(norm_key)

            matched_value = None
            source_label = None
            confidence = 0.0

            # 1. First check approved extracted documents
            if target_attr in doc_lookup:
                matched_value, source_label, confidence = doc_lookup[target_attr]
            
            # 2. Check user profile
            elif profile:
                val = getattr(profile, target_attr, None)
                if val:
                    matched_value = str(val)
                    source_label = "Approved Profile"
                    confidence = 0.98

            # Calculate decision based on policy
            if matched_value:
                is_sensitive = target_attr in SENSITIVE_FIELDS
                
                # Mode A: Assisted mode always requires confirmation
                if mode == "assisted":
                    is_auto_filled = False
                    needs_confirmation = True
                    reason = f"Suggested from {source_label}. Awaiting your confirmation."
                    status = "suggested"
                    uncertain_count += 1
                else:
                    # Mode B: Smart Automatic mode
                    if confidence >= 0.95 and not is_sensitive:
                        is_auto_filled = True
                        needs_confirmation = False
                        reason = f"High confidence ({int(confidence*100)}%) match from {source_label}."
                        status = "confirmed"
                        filled_count += 1
                        confirmed_count += 1
                    elif confidence >= 0.75 or is_sensitive:
                        is_auto_filled = False
                        needs_confirmation = True
                        if is_sensitive:
                            reason = f"Sensitive detail matched from {source_label}. Explicit confirmation required by security policy."
                        else:
                            reason = f"Moderate confidence ({int(confidence*100)}%) match from {source_label}. Please confirm."
                        status = "suggested"
                        uncertain_count += 1
                    else:
                        is_auto_filled = False
                        needs_confirmation = True
                        reason = "Low confidence match. Please verify manually."
                        status = "pending"
                        uncertain_count += 1

                suggestions.append({
                    "field_id": field.id,
                    "suggested_value": matched_value,
                    "confidence": confidence,
                    "source": source_label,
                    "is_auto_filled": is_auto_filled,
                    "needs_confirmation": needs_confirmation,
                    "reason": reason,
                    "status": status
                })
            else:
                # No matching value found in profile or vault
                suggestions.append({
                    "field_id": field.id,
                    "suggested_value": "",
                    "confidence": 0.0,
                    "source": "None",
                    "is_auto_filled": False,
                    "needs_confirmation": False,
                    "reason": "No matching record found in profile or vault documents.",
                    "status": "pending"
                })

        return {
            "mode": mode,
            "total_fields": len(detected_fields),
            "filled_count": filled_count,
            "confirmed_count": confirmed_count,
            "uncertain_count": uncertain_count,
            "suggestions": suggestions
        }

    @staticmethod
    def _resolve_target_attribute(norm_name: str) -> str:
        norm_clean = norm_name.lower().strip()
        for attr, aliases in FIELD_ALIASES.items():
            if norm_clean == attr or norm_clean in aliases:
                return attr
        return norm_clean

