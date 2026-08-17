## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/pdf-vector-sanitizer

Secure PDF text-stripping and data sanitization engine. Completely strips or obfuscates text characters from the underlying PDF `/Contents` streams, preventing data recovery through copy-paste or text extraction tools (essential for DPDP Act 2023 / GDPR compliance).

## Installation

```bash
npm install @dottedice/pdf-vector-sanitizer pdf-lib
```

## Features
* **Underlying Text Stripping**: Completely replaces targeted characters with mask strings inside the raw content stream parameters.
* **Tj/TJ Operator Support**: Safely parses both literal and kerning-based text-drawing operators.
* **100% Client-Side**: No cloud server latency or data leakage.

## API Reference

### `sanitizePdfText(pdfBytes, searchPhrases)`
Parses and returns a `Uint8Array` of the sanitized PDF document.
* `pdfBytes` (`Uint8Array`): Original PDF document binary.
* `searchPhrases` (`Array<string>`): Array of text patterns (e.g. `['Sanjay Deshmukh', '9876543210']`) to securely strip from the document content layers.
