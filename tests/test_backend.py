import os
import sys
import unittest

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.services.ocr_service import OCRService
from app.services.autofill_engine import AutofillEngine
from app.services.validation_engine import ValidationEngine
from app.services.pdf_generator import PDFGeneratorService
from app.models.models import DetectedField, UserProfile, ExtractedDocumentData, UserDocument
import pymupdf as fitz

class TestFormWiseBackend(unittest.TestCase):
    def test_01_security_and_passwords(self):
        pwd = "SecurePassword123!"
        hashed = get_password_hash(pwd)
        self.assertTrue(verify_password(pwd, hashed))
        self.assertFalse(verify_password("WrongPassword", hashed))

        token = create_access_token({"sub": "user-uuid-123", "email": "test@example.com"})
        payload = decode_token(token)
        self.assertEqual(payload["sub"], "user-uuid-123")
        self.assertEqual(payload["email"], "test@example.com")

    def test_02_ocr_and_indian_document_parser(self):
        sample_certificate = """
GOVERNMENT OF ANDHRA PRADESH / TELANGANA
REVENUE DEPARTMENT - MEESEVA INTEGRATED CERTIFICATE
This is to certify that Sri / Kum: RAMESH KUMAR REDDY
Son of: VENKATA SUBBAIAH REDDY
Date of Birth: 15/08/2003
Belongs to Category: OBC (BC-A)
Annual Income: Rs. 1,50,000/- (Rupees One Lakh Fifty Thousand Only)
Permanent Address: Door No 4-12, Gandhi Road, Guntur, PIN: 522001
Mobile Number: 9876543210
Aadhaar No: 4521 8963 1245
PAN No: ABCDE1234F
IFSC Code: SBIN0001234
Account Number: 30981234567
"""
        parsed = OCRService.parse_document_entities(sample_certificate, "income_certificate")
        self.assertEqual(parsed.get("full_name"), "RAMESH KUMAR REDDY")
        self.assertEqual(parsed.get("father_name"), "VENKATA SUBBAIAH REDDY")
        self.assertEqual(parsed.get("dob"), "15/08/2003")
        self.assertEqual(parsed.get("category"), "OBC")
        self.assertEqual(parsed.get("annual_income"), "150000")
        self.assertEqual(parsed.get("pincode"), "522001")
        self.assertEqual(parsed.get("mobile_number"), "9876543210")
        self.assertEqual(parsed.get("pan_number"), "ABCDE1234F")
        self.assertEqual(parsed.get("ifsc_code"), "SBIN0001234")
        # Ensure Aadhaar is masked for security and privacy
        self.assertEqual(parsed.get("aadhaar_masked"), "XXXX-XXXX-1245")

    def test_03_autofill_engine_policies(self):
        # Create mock fields
        f1 = DetectedField(id="f1", normalized_name="applicant_name", label="Applicant Name", is_required=True)
        f2 = DetectedField(id="f2", normalized_name="annual_income", label="Annual Income", is_required=True)
        f3 = DetectedField(id="f3", normalized_name="unknown_misc_field", label="Other Info", is_required=False)

        profile = UserProfile(
            full_name="Ramesh Kumar Reddy",
            annual_income="150000"
        )

        # Mode A: Assisted Autofill -> all matches require user confirmation
        res_a = AutofillEngine.match_fields([f1, f2, f3], profile, [], mode="assisted")
        sugg_a1 = next(s for s in res_a["suggestions"] if s["field_id"] == "f1")
        self.assertEqual(sugg_a1["suggested_value"], "Ramesh Kumar Reddy")
        self.assertTrue(sugg_a1["needs_confirmation"])
        self.assertFalse(sugg_a1["is_auto_filled"])

        # Mode B: Automatic Autofill -> regular high confidence filled, sensitive requires confirmation
        res_b = AutofillEngine.match_fields([f1, f2, f3], profile, [], mode="automatic")
        sugg_b1 = next(s for s in res_b["suggestions"] if s["field_id"] == "f1")
        self.assertTrue(sugg_b1["is_auto_filled"]) # Eligible for auto-fill

        sugg_b2 = next(s for s in res_b["suggestions"] if s["field_id"] == "f2")
        self.assertTrue(sugg_b2["needs_confirmation"]) # Sensitive financial detail requires confirmation

    def test_04_validation_engine(self):
        # Test valid vs invalid fields
        f_name = DetectedField(id="f1", normalized_name="applicant_name", label="Name", is_required=True, filled_value="Ramesh")
        f_mobile_bad = DetectedField(id="f2", normalized_name="mobile_number", label="Mobile", is_required=True, filled_value="12345")
        f_pin_bad = DetectedField(id="f3", normalized_name="pincode", label="PIN Code", is_required=True, filled_value="05220")

        res_invalid = ValidationEngine.validate_form([f_name, f_mobile_bad, f_pin_bad], [])
        self.assertFalse(res_invalid["is_ready_for_export"])
        self.assertTrue(any(e["rule_name"] == "mobile_format" for e in res_invalid["errors"]))
        self.assertTrue(any(e["rule_name"] == "pincode_format" for e in res_invalid["errors"]))

        # Fix fields
        f_mobile_good = DetectedField(id="f2", normalized_name="mobile_number", label="Mobile", is_required=True, filled_value="9876543210")
        f_pin_good = DetectedField(id="f3", normalized_name="pincode", label="PIN Code", is_required=True, filled_value="522001")
        res_valid = ValidationEngine.validate_form([f_name, f_mobile_good, f_pin_good], [])
        self.assertTrue(res_valid["is_ready_for_export"])
        self.assertEqual(len(res_valid["errors"]), 0)

    def test_05_pdf_generator_end_to_end(self):
        # Create a sample test application PDF using PyMuPDF
        test_pdf_path = os.path.join(backend_dir, "test_sample_form.pdf")
        doc = fitz.open()
        page = doc.new_page(width=595, height=842) # A4
        page.insert_text(fitz.Point(150, 60), "GOVERNMENT SCHOLARSHIP APPLICATION", fontsize=14)
        page.insert_text(fitz.Point(50, 120), "Applicant Full Name: ___________________________", fontsize=10)
        page.insert_text(fitz.Point(50, 160), "Date of Birth: __________________________________", fontsize=10)
        page.insert_text(fitz.Point(50, 200), "Mobile Number: __________________________________", fontsize=10)
        doc.save(test_pdf_path)
        doc.close()

        fields = [
            DetectedField(id="f1", page_number=1, normalized_name="applicant_name", label="Applicant Full Name",
                          bbox_x=8.4, bbox_y=14.2, bbox_width=50.0, bbox_height=3.0, filled_value="RAMESH KUMAR REDDY"),
            DetectedField(id="f2", page_number=1, normalized_name="dob", label="Date of Birth",
                          bbox_x=8.4, bbox_y=19.0, bbox_width=50.0, bbox_height=3.0, filled_value="15/08/2003"),
            DetectedField(id="f3", page_number=1, normalized_name="mobile_number", label="Mobile Number",
                          bbox_x=8.4, bbox_y=23.7, bbox_width=50.0, bbox_height=3.0, filled_value="9876543210")
        ]

        out_path, out_filename, filled_count = PDFGeneratorService.generate_filled_pdf(
            original_pdf_path=test_pdf_path,
            fields=fields,
            form_title="Scholarship Application",
            user_id="test_user_001"
        )

        self.assertTrue(os.path.exists(out_path))
        self.assertEqual(filled_count, 3)

        # Inspect generated PDF to confirm text was written
        out_doc = fitz.open(out_path)
        out_text = out_doc[0].get_text()
        out_doc.close()

        self.assertIn("RAMESH KUMAR REDDY", out_text)
        self.assertIn("15/08/2003", out_text)
        self.assertIn("9876543210", out_text)
        self.assertIn("FormWise AI", out_text)

        # Clean up temporary test files
        if os.path.exists(test_pdf_path):
            os.remove(test_pdf_path)
        if os.path.exists(out_path):
            os.remove(out_path)

if __name__ == "__main__":
    unittest.main()
