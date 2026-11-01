import os
import re
import pymupdf as fitz
from typing import List, Dict, Any
from app.core.config import settings

class FormAnalyzerService:
    @staticmethod
    def analyze_pdf_form(file_path: str, form_id: str) -> Dict[str, Any]:
        """
        Parses PDF form pages, renders page preview images, detects text blocks,
        interactive fields, and blank fill areas.
        """
        doc = fitz.open(file_path)
        total_pages = len(doc)
        pages_data = []
        detected_fields = []
        
        preview_dir = os.path.join(settings.STORAGE_DIR, "forms", "previews", form_id)
        os.makedirs(preview_dir, exist_ok=True)

        org_name = None
        form_title = "Application Form"

        for page_idx in range(total_pages):
            page_num = page_idx + 1
            page = doc[page_idx]
            rect = page.rect
            width = rect.width
            height = rect.height

            # Render page image preview for the UI
            pix = page.get_pixmap(dpi=150)
            img_filename = f"page_{page_num}.png"
            img_rel_path = f"forms/previews/{form_id}/{img_filename}"
            img_abs_path = os.path.join(preview_dir, img_filename)
            pix.save(img_abs_path)

            # Extract text blocks
            blocks = page.get_text("blocks")
            page_has_text = len(blocks) > 0

            # 1. Check for AcroForm / interactive widget fields
            widgets = page.widgets()
            if widgets:
                for w in widgets:
                    w_rect = w.rect
                    w_name = w.field_name or f"field_{len(detected_fields)+1}"
                    w_label = w_name.replace("_", " ").title()
                    w_type = "text"
                    if w.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                        w_type = "checkbox"
                    elif w.field_type == fitz.PDF_WIDGET_TYPE_RADIOBUTTON:
                        w_type = "radio"

                    norm_name = FormAnalyzerService._normalize_field_name(w_name)
                    detected_fields.append({
                        "field_id_str": f"f_w_{page_num}_{len(detected_fields)+1}",
                        "page_number": page_num,
                        "label": w_label,
                        "normalized_name": norm_name,
                        "field_type": w_type,
                        "is_required": True if "req" in w_name.lower() or "*" in w_name else False,
                        "expected_format": FormAnalyzerService._guess_expected_format(norm_name),
                        "bbox_x": (w_rect.x0 / width) * 100,
                        "bbox_y": (w_rect.y0 / height) * 100,
                        "bbox_width": ((w_rect.x1 - w_rect.x0) / width) * 100,
                        "bbox_height": ((w_rect.y1 - w_rect.y0) / height) * 100,
                        "explanation": FormAnalyzerService._default_explanation(norm_name, w_label),
                        "supporting_doc": FormAnalyzerService._default_supporting_doc(norm_name),
                        "confidence": 0.98,
                        "is_uncertain": False
                    })

            # 2. Heuristic layout field extraction from text lines & blanks
            # Look for lines containing labels with colons, dots, underscores or blank spaces
            text_instances = []
            for b in blocks:
                text = b[4].strip()
                if not text:
                    continue
                
                # Check for top organization title
                if page_idx == 0 and not org_name:
                    lines = [l.strip() for l in text.split("\n") if l.strip()]
                    if lines:
                        if any(kw in lines[0].lower() for kw in ["ministry", "department", "government", "university", "college", "board", "institute"]):
                            org_name = lines[0]
                        if len(lines) > 1 and "application" in lines[1].lower():
                            form_title = lines[1]
                        elif "application" in lines[0].lower() or "scholarship" in lines[0].lower():
                            form_title = lines[0]

                # Find field lines
                lines = text.split("\n")
                for line in lines:
                    line_clean = line.strip()
                    matched = FormAnalyzerService._detect_field_in_line(line_clean, b, width, height, page_num)
                    if matched:
                        # Avoid duplicates
                        if not any(f["normalized_name"] == matched["normalized_name"] for f in detected_fields):
                            detected_fields.append(matched)

            pages_data.append({
                "page_number": page_num,
                "width": width,
                "height": height,
                "image_path": img_rel_path,
                "has_text": page_has_text
            })

        doc.close()

        # If very few fields were detected, synthesize intelligent fallback fields based on common Indian applications
        if len(detected_fields) == 0:
            detected_fields = FormAnalyzerService._synthesize_standard_form_fields(1)

        return {
            "title": form_title,
            "organization_name": org_name or "Government / Institutional Authority",
            "total_pages": total_pages,
            "pages": pages_data,
            "fields": detected_fields
        }

    @staticmethod
    def _detect_field_in_line(line: str, block: tuple, page_w: float, page_h: float, page_num: int) -> Dict[str, Any] | None:
        patterns = [
            (r"(?:1\.|2\.|3\.|4\.|5\.|6\.|7\.|8\.|9\.|10\.)?\s*(Applicant'?s?\s*Name|Candidate'?s?\s*Name|Full\s*Name)[\s:._-]*", "full_name", "Applicant Full Name", "text", True),
            (r"(?:Father'?s?\s*Name)[\s:._-]*", "father_name", "Father's Full Name", "text", True),
            (r"(?:Mother'?s?\s*Name)[\s:._-]*", "mother_name", "Mother's Full Name", "text", False),
            (r"(?:Date\s*of\s*Birth|DOB)[\s:._-]*", "dob", "Date of Birth", "date", True),
            (r"(?:Gender|Sex)[\s:._-]*", "gender", "Gender", "radio", True),
            (r"(?:Category|Caste|Community)[\s:._-]*", "category", "Community / Social Category", "dropdown", True),
            (r"(?:Aadhaar\s*(?:No\.?|Number)?)[\s:._-]*", "aadhaar_masked", "Aadhaar Card Number", "text", False),
            (r"(?:PAN\s*(?:No\.?|Card)?)[\s:._-]*", "pan_number", "PAN Card Number", "text", False),
            (r"(?:Mobile\s*(?:No\.?|Number)?|Phone\s*No\.?)[\s:._-]*", "mobile_number", "Mobile Phone Number", "number", True),
            (r"(?:Email\s*(?:ID|Address)?)[\s:._-]*", "email", "Email Address", "text", True),
            (r"(?:Permanent\s*Address|Residential\s*Address|Address)[\s:._-]*", "address_line1", "Residential Address", "text", True),
            (r"(?:PIN\s*Code|Postal\s*Code)[\s:._-]*", "pincode", "PIN / Postal Code", "number", True),
            (r"(?:Annual\s*Family\s*Income|Total\s*Income)[\s:._-]*", "annual_income", "Annual Family Income (INR)", "number", True),
            (r"(?:Educational\s*Qualification|Course|Degree)[\s:._-]*", "education_degree", "Course / Qualifying Degree", "text", True),
            (r"(?:College|Institution|School\s*Name)[\s:._-]*", "institution_name", "Institution / College Name", "text", True),
            (r"(?:Bank\s*Account\s*(?:No\.?|Number)?)[\s:._-]*", "account_number_masked", "Bank Account Number", "text", False),
            (r"(?:IFSC\s*Code)[\s:._-]*", "ifsc_code", "Bank Branch IFSC Code", "text", False),
        ]

        bx0, by0, bx1, by1 = block[0], block[1], block[2], block[3]
        for pat, norm_name, label, ftype, req in patterns:
            if re.search(pat, line, re.IGNORECASE):
                # Bounding box of the fillable line
                x_pct = (bx0 / page_w) * 100
                y_pct = (by0 / page_h) * 100
                w_pct = min(85.0, ((bx1 - bx0 + 120) / page_w) * 100)
                h_pct = max(3.5, ((by1 - by0) / page_h) * 100)
                
                return {
                    "field_id_str": f"f_{norm_name}_{page_num}",
                    "page_number": page_num,
                    "label": label,
                    "normalized_name": norm_name,
                    "field_type": ftype,
                    "is_required": req,
                    "expected_format": FormAnalyzerService._guess_expected_format(norm_name),
                    "bbox_x": x_pct,
                    "bbox_y": y_pct,
                    "bbox_width": w_pct,
                    "bbox_height": h_pct,
                    "explanation": FormAnalyzerService._default_explanation(norm_name, label),
                    "supporting_doc": FormAnalyzerService._default_supporting_doc(norm_name),
                    "confidence": 0.92,
                    "is_uncertain": False
                }
        return None

    @staticmethod
    def _normalize_field_name(raw_name: str) -> str:
        s = raw_name.lower().strip()
        if "name" in s and ("father" not in s and "mother" not in s):
            return "full_name"
        if "father" in s:
            return "father_name"
        if "mother" in s:
            return "mother_name"
        if "dob" in s or "birth" in s:
            return "dob"
        if "gender" in s or "sex" in s:
            return "gender"
        if "category" in s or "caste" in s:
            return "category"
        if "aadhaar" in s or "uid" in s:
            return "aadhaar_masked"
        if "pan" in s:
            return "pan_number"
        if "mobile" in s or "phone" in s or "cell" in s:
            return "mobile_number"
        if "email" in s:
            return "email"
        if "pin" in s or "postal" in s:
            return "pincode"
        if "income" in s:
            return "annual_income"
        if "college" in s or "institution" in s or "school" in s:
            return "institution_name"
        if "course" in s or "degree" in s or "qualification" in s:
            return "education_degree"
        if "bank" in s or "account" in s:
            return "account_number_masked"
        if "ifsc" in s:
            return "ifsc_code"
        if "address" in s:
            return "address_line1"
        return re.sub(r"[^a-z0-9_]", "_", s)

    @staticmethod
    def _guess_expected_format(norm_name: str) -> str:
        formats = {
            "full_name": "Full name in BLOCK letters",
            "father_name": "Father's full name",
            "mother_name": "Mother's full name",
            "dob": "DD/MM/YYYY",
            "gender": "Male / Female / Other",
            "category": "General / OBC / SC / ST / EWS",
            "aadhaar_masked": "12-digit UID (e.g. XXXX-XXXX-1234)",
            "pan_number": "10-character Alphanumeric (ABCDE1234F)",
            "mobile_number": "10-digit Indian Mobile Number",
            "email": "Valid email address (name@domain.com)",
            "address_line1": "Door No, Street, Village/Town",
            "pincode": "6-digit Indian PIN Code",
            "annual_income": "Total annual income in INR (Numeric)",
            "education_degree": "Degree / Qualification name",
            "institution_name": "Recognized School / College name",
            "account_number_masked": "Bank Account Number",
            "ifsc_code": "11-character IFSC (e.g. SBIN0001234)"
        }
        return formats.get(norm_name, "Standard text input")

    @staticmethod
    def _default_explanation(norm_name: str, label: str) -> str:
        explanations = {
            "full_name": "Enter the applicant's official name exactly as shown in 10th certificate or official ID.",
            "father_name": "Enter the father's legal name without initials or prefixes like Shri/Mr unless required.",
            "mother_name": "Enter the mother's legal name as recorded on official school or birth certificates.",
            "dob": "Enter the applicant's exact date of birth in DD/MM/YYYY format matching your educational certificates.",
            "gender": "Select your gender identity as officially recorded.",
            "category": "Select your constitutional or administrative reservation category (General, OBC, SC, ST, or EWS).",
            "aadhaar_masked": "Enter your 12-digit Aadhaar number for identity verification. It will be securely masked.",
            "pan_number": "Enter your Permanent Account Number issued by the Income Tax Department.",
            "mobile_number": "Enter an active 10-digit Indian mobile number capable of receiving SMS alerts and OTPs.",
            "email": "Enter an active personal email address for receiving application updates and registration slips.",
            "address_line1": "Enter your permanent postal address where official communications can be delivered.",
            "pincode": "Enter the 6-digit postal index number corresponding to your residential address.",
            "annual_income": "Enter the combined annual gross income from all sources of the applicant's family.",
            "education_degree": "Specify the current course or highest degree obtained for which scholarship/admission is sought.",
            "institution_name": "Name of the affiliated school, college, or university where you are enrolled.",
            "account_number_masked": "Enter your active individual savings bank account number for direct scholarship benefit transfers.",
            "ifsc_code": "Enter the 11-digit Indian Financial System Code printed on your bank passbook or cheque leaf."
        }
        return explanations.get(norm_name, f"Enter required details for {label} according to the application guidelines.")

    @staticmethod
    def _default_supporting_doc(norm_name: str) -> str | None:
        docs = {
            "full_name": "10th Marksheet or Aadhaar Card",
            "dob": "Birth Certificate or 10th Class SSC Certificate",
            "category": "Community / Caste Certificate issued by competent Revenue Authority (Tahsildar/MRO)",
            "annual_income": "Income Certificate / Salary Slip issued for current financial year",
            "education_degree": "Mark Memorandums / Degree Certificate / Study Bonafide",
            "institution_name": "College ID / Bonafide Certificate",
            "account_number_masked": "Bank Passbook First Page / Cancelled Cheque",
            "ifsc_code": "Bank Passbook / Cheque Leaf",
            "pincode": "Aadhaar Card / Domicile Certificate"
        }
        return docs.get(norm_name, None)

    @staticmethod
    def _synthesize_standard_form_fields(page_num: int) -> List[Dict[str, Any]]:
        """Fallback when PDF has scanned blank lines without text metadata"""
        specs = [
            ("full_name", "Applicant Full Name", "text", True, 10.0, 15.0, 80.0, 4.0),
            ("father_name", "Father's Full Name", "text", True, 10.0, 22.0, 80.0, 4.0),
            ("dob", "Date of Birth (DD/MM/YYYY)", "date", True, 10.0, 29.0, 38.0, 4.0),
            ("gender", "Gender", "radio", True, 52.0, 29.0, 38.0, 4.0),
            ("category", "Social Category (Gen/OBC/SC/ST)", "dropdown", True, 10.0, 36.0, 38.0, 4.0),
            ("annual_income", "Annual Family Income (INR)", "number", True, 52.0, 36.0, 38.0, 4.0),
            ("mobile_number", "Mobile Contact Number", "number", True, 10.0, 43.0, 38.0, 4.0),
            ("email", "Email Address", "text", True, 52.0, 43.0, 38.0, 4.0),
            ("address_line1", "Permanent Residential Address", "text", True, 10.0, 50.0, 80.0, 4.0),
            ("pincode", "PIN Code", "number", True, 10.0, 57.0, 38.0, 4.0),
            ("institution_name", "College / Institution Name", "text", True, 52.0, 57.0, 38.0, 4.0),
            ("education_degree", "Course / Degree Name", "text", True, 10.0, 64.0, 80.0, 4.0),
            ("account_number_masked", "Bank Account Number", "text", False, 10.0, 71.0, 38.0, 4.0),
            ("ifsc_code", "Bank IFSC Code", "text", False, 52.0, 71.0, 38.0, 4.0),
        ]
        res = []
        for norm_name, label, ftype, req, x, y, w, h in specs:
            res.append({
                "field_id_str": f"f_{norm_name}_{page_num}",
                "page_number": page_num,
                "label": label,
                "normalized_name": norm_name,
                "field_type": ftype,
                "is_required": req,
                "expected_format": FormAnalyzerService._guess_expected_format(norm_name),
                "bbox_x": x,
                "bbox_y": y,
                "bbox_width": w,
                "bbox_height": h,
                "explanation": FormAnalyzerService._default_explanation(norm_name, label),
                "supporting_doc": FormAnalyzerService._default_supporting_doc(norm_name),
                "confidence": 0.88,
                "is_uncertain": False
            })
        return res
