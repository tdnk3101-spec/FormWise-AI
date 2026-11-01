import os
import re
import pymupdf as fitz
from PIL import Image
from typing import Dict, Any, List

class OCRService:
    @staticmethod
    def extract_text_from_file(file_path: str, mime_type: str) -> str:
        text_content = []
        if mime_type == "application/pdf" or file_path.lower().endswith(".pdf"):
            try:
                doc = fitz.open(file_path)
                for page_idx in range(len(doc)):
                    page = doc[page_idx]
                    page_text = page.get_text()
                    if page_text.strip():
                        text_content.append(page_text)
                    else:
                        # Fallback: if page has no selectable text, check for images
                        image_list = page.get_images(full=True)
                        if image_list:
                            text_content.append(f"[Scanned page {page_idx + 1} with image layout]")
                doc.close()
            except Exception as e:
                text_content.append(f"Error reading PDF: {str(e)}")
        else:
            # Image file
            try:
                img = Image.open(file_path)
                # Image metadata & basic structural representation
                text_content.append(f"[Image file: {img.format} size {img.width}x{img.height}]")
            except Exception as e:
                text_content.append(f"Error reading image: {str(e)}")

        return "\n".join(text_content)

    @staticmethod
    def parse_document_entities(raw_text: str, doc_type: str) -> Dict[str, Any]:
        """
        Deterministic, regex and pattern-based extractor for standard Indian documents.
        """
        extracted = {}

        # 1. PAN Pattern (e.g. ABCDE1234F)
        pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", raw_text)
        if pan_match:
            extracted["pan_number"] = pan_match.group(1)

        # 2. Aadhaar Pattern (12 digits, e.g. 1234 5678 9012 or 123456789012)
        aadhaar_match = re.search(r"\b(\d{4}\s?\d{4}\s?\d{4})\b", raw_text)
        if aadhaar_match:
            raw_aadhaar = aadhaar_match.group(1).replace(" ", "")
            # Security: Mask raw Aadhaar (show only last 4 digits)
            masked = f"XXXX-XXXX-{raw_aadhaar[-4:]}"
            extracted["aadhaar_masked"] = masked

        # 3. DOB Pattern (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD)
        dob_match = re.search(r"(?:DOB|Birth|Date of Birth)[\s:]*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})", raw_text, re.IGNORECASE)
        if not dob_match:
            dob_match = re.search(r"\b([0-3][0-9][-/.][0-1][0-9][-/.](?:19|20)\d\d)\b", raw_text)
        if dob_match:
            extracted["dob"] = dob_match.group(1)

        # 4. Mobile Number (10 digits starting with 6, 7, 8, or 9)
        mobile_match = re.search(r"(?:Mobile|Phone|Tel|Cell|Contact)[\s:]*(?:\+91[-\s]?)?([6-9]\d{9})\b", raw_text, re.IGNORECASE)
        if not mobile_match:
            mobile_match = re.search(r"\b([6-9]\d{9})\b", raw_text)
        if mobile_match:
            extracted["mobile_number"] = mobile_match.group(1)

        # 5. PIN Code (6 digits)
        pin_match = re.search(r"(?:PIN|Postal|Pincode)[\s:]*([1-9][0-9]{5})\b", raw_text, re.IGNORECASE)
        if not pin_match:
            pin_match = re.search(r"\b([1-9][0-9]{5})\b", raw_text)
        if pin_match:
            extracted["pincode"] = pin_match.group(1)

        # 6. Email
        email_match = re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", raw_text)
        if email_match:
            extracted["email"] = email_match.group(0)

        # 7. IFSC Code (e.g. SBIN0001234)
        ifsc_match = re.search(r"\b([A-Z]{4}0[A-Z0-9]{6})\b", raw_text)
        if ifsc_match:
            extracted["ifsc_code"] = ifsc_match.group(1)

        # 8. Annual Income (e.g. Rs. 1,50,000)
        income_match = re.search(r"(?:Annual Income|Total Income|Income)[\s:]*(?:Rs\.?|INR)?\s*([0-9,]{4,10})", raw_text, re.IGNORECASE)
        if income_match:
            cleaned_inc = income_match.group(1).replace(",", "").strip()
            extracted["annual_income"] = cleaned_inc

        # 9. Marks / Percentage
        pct_match = re.search(r"(?:Percentage|Marks|Score|CGPA)[\s:]*([0-9]{1,3}(?:\.[0-9]{1,2})?%?)", raw_text, re.IGNORECASE)
        if pct_match:
            extracted["percentage_marks"] = pct_match.group(1)

        # 10. Caste / Category
        cat_match = re.search(r"(?:Category|Caste|Community)[\s:]*(General|OBC|SC|ST|EWS|BC-[A-E])", raw_text, re.IGNORECASE)
        if cat_match:
            extracted["category"] = cat_match.group(1).upper()

        # 11. Gender
        gender_match = re.search(r"(?:Gender|Sex)[\s:]*(Male|Female|Transgender)", raw_text, re.IGNORECASE)
        if gender_match:
            extracted["gender"] = gender_match.group(1).capitalize()

        # 12. Full Name / Father Name detection from common certificate lines
        name_match = re.search(r"(?:Name of the Candidate|Student Name|Applicant Name|Candidate Name|Sri\s*/\s*Kum|Sri\s*/\s*Smt|Name)[\s:]*([A-Za-z\s.]{3,40})(?:\n|$|,)", raw_text, re.IGNORECASE)
        if name_match:
            cand_name = name_match.group(1).strip()
            if not any(kw in cand_name.lower() for kw in ["is", "hereby", "certified", "father", "mother"]):
                extracted["full_name"] = cand_name

        father_match = re.search(r"(?:Father'?s?\s*Name|Father|Son\s*of|Daughter\s*of|Wife\s*of|S/o|D/o|W/o)[\s:]*([A-Za-z\s.]{3,40})(?:\n|$|,)", raw_text, re.IGNORECASE)
        if father_match:
            extracted["father_name"] = father_match.group(1).strip()

        mother_match = re.search(r"(?:Mother'?s? Name|Mother)[\s:]*([A-Za-z\s.]{3,40})(?:\n|$|,)", raw_text, re.IGNORECASE)
        if mother_match:
            extracted["mother_name"] = mother_match.group(1).strip()

        return extracted
