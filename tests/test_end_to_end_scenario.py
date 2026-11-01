import os
import sys
import unittest
import asyncio
import pymupdf as fitz
from datetime import datetime

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database.session import SessionLocal
from app.models.models import User, UserProfile, UserDocument, UploadedForm, ExtractedDocumentData, DetectedField, CompletedForm
from app.schemas.schemas import UserCreate, UserLogin, DocumentApprovalRequest, ExtractedFieldApproval, AutofillRequest, AutofillBatchConfirm, FieldExplainRequest, FormChatRequest
from app.api.v1 import auth, users, documents, forms, autofill, validation, history
from app.core.config import settings

class TestScholarshipApplicationScenario(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_complete_scholarship_scenario_and_data_isolation(self):
        print("--> Step 1: User Registration", flush=True)
        email_a = f"ramesh_{os.urandom(4).hex()}@example.com"
        reg_res_a = auth.register(
            user_in=UserCreate(full_name="Ramesh Kumar Reddy", email=email_a, password="Password123!"),
            db=self.db
        )
        user_a = reg_res_a["user"]
        print("--> Step 1 done", flush=True)

        print("--> Step 2: Login", flush=True)
        login_res_a = auth.login(
            login_in=UserLogin(email=email_a, password="Password123!"),
            db=self.db
        )
        print("--> Step 2 done", flush=True)

        print("--> Step 3: Vault Doc", flush=True)
        cert_text = "Name: RAMESH KUMAR REDDY\nFather: VENKATA SUBBAIAH REDDY\nDOB: 15/08/2003\nCategory: OBC\nAnnual Income: Rs. 1,50,000\nMobile: 9876543210\n"
        test_vault_dir = os.path.join(settings.STORAGE_DIR, "vault", user_a.id)
        os.makedirs(test_vault_dir, exist_ok=True)
        cert_path = os.path.join(test_vault_dir, "test_income_cert.pdf")
        
        doc_pdf = fitz.open()
        p = doc_pdf.new_page(width=595, height=842)
        p.insert_text(fitz.Point(50, 100), cert_text)
        doc_pdf.save(cert_path)
        doc_pdf.close()

        doc_record = UserDocument(
            user_id=user_a.id,
            document_type="income_certificate",
            original_filename="test_income_cert.pdf",
            file_path=cert_path,
            file_size=os.path.getsize(cert_path),
            mime_type="application/pdf",
            status="uploaded"
        )
        self.db.add(doc_record)
        self.db.commit()
        self.db.refresh(doc_record)
        print("--> Step 3 done", flush=True)

        print("--> Step 4: OCR Extract", flush=True)
        extract_res = documents.extract_document_ocr(
            document_id=doc_record.id,
            current_user=user_a,
            db=self.db
        )
        print("--> Step 4 done", flush=True)

        print("--> Step 5: Approve Values", flush=True)
        approvals = [
            ExtractedFieldApproval(field_id=f.id, approved_value=f.field_value, is_approved=True)
            for f in extract_res["extracted_fields"]
        ]
        app_res = documents.approve_extracted_data(
            document_id=doc_record.id,
            approval_req=DocumentApprovalRequest(approvals=approvals),
            current_user=user_a,
            db=self.db
        )
        print("--> Step 5 done", flush=True)

        print("--> Step 6: Form Analysis", flush=True)
        form_text = "Applicant Name: __________________\nFather Name: __________________\nDOB: __________________\nAnnual Family Income: __________________\nMobile Number: __________________\nPIN Code: __________________\n"
        test_forms_dir = os.path.join(settings.STORAGE_DIR, "forms", user_a.id)
        os.makedirs(test_forms_dir, exist_ok=True)
        form_path = os.path.join(test_forms_dir, "scholarship_form.pdf")

        f_doc = fitz.open()
        fp = f_doc.new_page(width=595, height=842)
        fp.insert_text(fitz.Point(50, 100), form_text)
        f_doc.save(form_path)
        f_doc.close()

        form_record = UploadedForm(
            user_id=user_a.id,
            title="National Post-Matric Scholarship",
            original_filename="scholarship_form.pdf",
            file_path=form_path,
            file_type="pdf",
            status="uploaded"
        )
        self.db.add(form_record)
        self.db.commit()
        self.db.refresh(form_record)

        from app.services.form_analyzer import FormAnalyzerService
        analysis = FormAnalyzerService.analyze_pdf_form(form_record.file_path, form_record.id)
        form_record.total_pages = analysis["total_pages"]
        form_record.status = "analyzed"

        for f in analysis["fields"]:
            field_obj = DetectedField(
                form_id=form_record.id,
                page_number=f["page_number"],
                field_id_str=f["field_id_str"],
                label=f["label"],
                normalized_name=f["normalized_name"],
                field_type=f["field_type"],
                is_required=f["is_required"],
                expected_format=f["expected_format"],
                bbox_x=f["bbox_x"],
                bbox_y=f["bbox_y"],
                bbox_width=f["bbox_width"],
                bbox_height=f["bbox_height"],
                explanation=f["explanation"],
                supporting_doc=f["supporting_doc"],
                confidence=f["confidence"],
                is_uncertain=f["is_uncertain"],
                status="pending"
            )
            self.db.add(field_obj)
        self.db.commit()
        self.db.refresh(form_record)
        print("--> Step 6 done", flush=True)

        print("--> Step 7: Telugu Explain", flush=True)
        income_field = next(f for f in form_record.fields if "income" in f.normalized_name)
        explain_res = forms.explain_field(
            form_id=form_record.id,
            req=FieldExplainRequest(field_id=income_field.id, language="te"),
            current_user=user_a,
            db=self.db
        )
        self.assertIn("ఆదాయ", explain_res["meaning"])
        print("--> Step 7 done", flush=True)

        print("--> Step 8: Chat Assistant", flush=True)
        chat_res = forms.form_assistant_chat(
            form_id=form_record.id,
            req=FormChatRequest(message="What documents are required?", language="en"),
            current_user=user_a,
            db=self.db
        )
        self.assertIn("supporting documents", chat_res["reply"].lower())
        print("--> Step 8 done", flush=True)

        print("--> Step 9: Autofill", flush=True)
        autofill_res = autofill.trigger_autofill(
            form_id=form_record.id,
            req=AutofillRequest(mode="automatic"),
            current_user=user_a,
            db=self.db
        )
        print("--> Step 9 done", flush=True)

        print("--> Step 10: Confirm", flush=True)
        confirm_payload = [
            {"field_id": s["field_id"], "value": s["suggested_value"], "status": "confirmed"}
            for s in autofill_res["suggestions"] if s["suggested_value"]
        ]
        conf_res = autofill.confirm_autofill_batch(
            form_id=form_record.id,
            batch_req=AutofillBatchConfirm(confirmations=confirm_payload),
            current_user=user_a,
            db=self.db
        )
        print("--> Step 10 done", flush=True)

        print("--> Step 11: Validate", flush=True)
        val_res = validation.validate_form(
            form_id=form_record.id,
            current_user=user_a,
            db=self.db
        )
        print("--> Step 11 done", flush=True)

        print("--> Step 12: Export", flush=True)
        export_res = validation.export_completed_form(
            form_id=form_record.id,
            current_user=user_a,
            db=self.db
        )
        export_file = os.path.join(settings.STORAGE_DIR, "exports", user_a.id, export_res["filename"])
        print("--> Step 12 done", flush=True)

        print("--> Step 13: History", flush=True)
        hist_res = history.get_user_history(current_user=user_a, db=self.db)
        print("--> Step 13 done", flush=True)

        print("--> Step 14: Security isolation", flush=True)
        email_b = f"priya_{os.urandom(4).hex()}@example.com"
        reg_b = auth.register(
            user_in=UserCreate(full_name="Priya Sharma", email=email_b, password="Password123!"),
            db=self.db
        )
        user_b = reg_b["user"]

        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as cm:
            documents.get_user_document(document_id=doc_record.id, current_user=user_b, db=self.db)
        self.assertEqual(cm.exception.status_code, 404)

        with self.assertRaises(HTTPException) as cm:
            forms.get_form_details(form_id=form_record.id, current_user=user_b, db=self.db)
        self.assertEqual(cm.exception.status_code, 404)

        with self.assertRaises(HTTPException) as cm:
            validation.download_completed_pdf(
                form_id=form_record.id,
                export_id=export_res["export_id"],
                current_user=user_b,
                db=self.db
            )
        self.assertEqual(cm.exception.status_code, 404)
        print("--> Step 14 done! ALL SCENARIOS PASSED!", flush=True)

        # Cleanup
        if os.path.exists(cert_path):
            os.remove(cert_path)
        if os.path.exists(form_path):
            os.remove(form_path)
        if os.path.exists(export_file):
            os.remove(export_file)

if __name__ == "__main__":
    unittest.main()
