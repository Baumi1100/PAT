# backend/app/document_processing/ocr_processor.py
import structlog

from app.document_processing.base import DocumentResult

log = structlog.get_logger()


class OCRProcessor:
    def __init__(self, lang: str = "eng+deu") -> None:
        self._lang = lang

    def process(self, file_path: str) -> DocumentResult:
        import pytesseract
        from PIL import Image

        img: Image.Image = Image.open(file_path)
        # Improve OCR quality: convert to grayscale
        if img.mode != "L":
            img = img.convert("L")
        image = img
        text = pytesseract.image_to_string(image, lang=self._lang)
        confidence = self._get_confidence(image)
        warnings = []
        if confidence < 60:
            warnings.append(f"Low OCR confidence ({confidence:.0f}%). Results may be inaccurate.")
        log.info("ocr.complete", confidence=confidence, chars=len(text))
        return DocumentResult(
            text=text.strip(),
            extraction_method="tesseract",
            warnings=warnings,
        )

    def _get_confidence(self, image: object) -> float:
        try:
            import pytesseract

            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            confs = [int(c) for c in data["conf"] if str(c) != "-1"]
            return sum(confs) / len(confs) if confs else 0.0
        except Exception:
            return 0.0
