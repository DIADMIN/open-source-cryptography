# @dottedice/pdf-redaction-engine

Client-side PDF data redaction and info dictionary sanitization engine. Helps ensure compliance with DPDP Act 2023 by removing sensitive fields and rendering unrecoverable solid mask shapes over document sections before signing.

## Installation

```bash
npm install @dottedice/pdf-redaction-engine pdf-lib
```

## Features
* **Coordinate Redactions**: Draw solid mask rectangles on target coordinates to blackbox personal data.
* **Info Directory Sanitization**: Automatically flushes Title, Author, and Creator metadata tags.
* **Zero Server Transit**: Processing runs fully client-side.

## API Reference

### `redactPdf(pdfBytes, redactions)`
Returns `Uint8Array` bytes representing the sanitized and redacted PDF file.
* `pdfBytes` (`Uint8Array`): Original PDF document binary.
* `redactions` (`Array<Object>`): List of coordinates to obscure:
  * `pageIndex` (`number`): 0-based page index.
  * `x`, `y` (`number`): Bottom-left coordinate anchors.
  * `width`, `height` (`number`): Box dimensions.
  * `color` (`{ r, g, b }`): Mask color channels (values 0-1).
