import os
import uuid
import pymupdf as fitz
from typing import List, Dict, Any
from app.core.config import settings
from app.models.models import DetectedField, UploadedForm

class PDFGeneratorService:
    @staticmethod
    def generate_filled_pdf(
        original_pdf_path: str,
        fields: List[DetectedField],
        form_title: str,
        user_id: str
    ) -> tuple[str, str, int]:
        """
        Creates a completed PDF document by inserting filled field values at their
        detected page coordinates.
        Returns: (output_abs_path, output_filename, filled_count)
        """
        if not os.path.exists(original_pdf_path):
            raise FileNotFoundError(f"Original form file not found: {original_pdf_path}")

        doc = fitz.open(original_pdf_path)
        filled_count = 0

        # Group fields by page number
        fields_by_page = {}
        for f in fields:
            fields_by_page.setdefault(f.page_number, []).append(f)

        for page_idx in range(len(doc)):
            page_num = page_idx + 1
            page = doc[page_idx]
            rect = page.rect
            width = rect.width
            height = rect.height

            # Check if this page has interactive widgets
            widgets = page.widgets()
            widget_dict = {w.field_name: w for w in widgets} if widgets else {}

            page_fields = fields_by_page.get(page_num, [])
            for field in page_fields:
                val = field.filled_value
                if not val:
                    continue

                filled_count += 1

                # 1. If an AcroForm widget matches, update it directly
                norm_name = field.normalized_name
                matched_widget = None
                for w_name, w_obj in widget_dict.items():
                    if norm_name in w_name.lower():
                        matched_widget = w_obj
                        break

                if matched_widget:
                    matched_widget.field_value = str(val)
                    matched_widget.update()
                else:
                    # 2. Coordinate-based visual text insertion
                    # Calculate point coordinates from bbox percentage
                    bx = (field.bbox_x / 100.0) * width
                    by = (field.bbox_y / 100.0) * height
                    bw = (field.bbox_width / 100.0) * width
                    bh = (field.bbox_height / 100.0) * height

                    # If the box represents the label itself, position text slightly to the right or into the line area
                    insert_x = min(width - 50, bx + 130) if bw < 150 else bx + 5
                    insert_y = by + min(bh, 14)

                    # Dynamic font size
                    font_size = 9.5
                    if len(str(val)) > 30:
                        font_size = 8.0

                    # Insert clean, high-contrast dark blue text
                    # (0.05, 0.15, 0.45) represents a professional dark ink color
                    try:
                        page.insert_text(
                            fitz.Point(insert_x, insert_y),
                            str(val),
                            fontsize=font_size,
                            fontname="helv",
                            color=(0.05, 0.15, 0.45)
                        )
                    except Exception:
                        # Fallback simple text insertion
                        page.insert_text(
                            fitz.Point(insert_x, insert_y),
                            str(val),
                            fontsize=font_size
                        )

            # Insert FormWise verification footer stamp
            footer_stamp = "FormWise AI — Prepared Application Draft (Please verify before submission)"
            page.insert_text(
                fitz.Point(width / 2 - 140, height - 15),
                footer_stamp,
                fontsize=7.5,
                color=(0.4, 0.45, 0.55)
            )

        # Save to dedicated exports directory
        export_dir = os.path.join(settings.STORAGE_DIR, "exports", user_id)
        os.makedirs(export_dir, exist_ok=True)
        out_filename = f"Completed_{form_title.replace(' ', '_')}_{uuid.uuid4().hex[:8]}.pdf"
        out_file_path = os.path.join(export_dir, out_filename)

        doc.save(out_file_path)
        doc.close()

        return out_file_path, out_filename, filled_count
