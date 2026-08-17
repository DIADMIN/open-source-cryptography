## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/pades-pdf-signer

Client-side cryptographic PDF signing utility using metadata-level updates and native Web Crypto.

## Installation

```bash
npm install @dottedice/pades-pdf-signer pdf-lib
```

## Features
* **Metadata-Level Signing**: Stores cryptographic signatures, digests, and signer information securely in the PDF document metadata fields (Producer and Subject).
* **Web Crypto Integration**: Performs local document pre-hashing and asymmetric signature computation fully offline inside the browser.
* **Visual Stamp Drawer**: Supports placing styled signature stamps on coordinates with custom signatory metadata.

## Usage Example

```javascript
import { signPdf } from '@dottedice/pades-pdf-signer';
import { generateKeyPair } from '@dottedice/web-crypto-pki';

// 1. Generate keys
const keyPair = await generateKeyPair('RSA');

// 2. Read PDF bytes
const originalPdfBytes = await fetch('/contracts/doc.pdf').then(res => res.arrayBuffer());

// 3. Cryptographically sign the PDF
const signedPdfBytes = await signPdf(new Uint8Array(originalPdfBytes), {
  signatoryName: 'Vikramaditya Sharma',
  location: 'Chennai Sandbox Platform',
  privateKey: keyPair.privateKey,
  trustAuthority: 'Local Authority CA',
  visualStamp: { x: 50, y: 120, width: 260, height: 75 }
});

// signedPdfBytes is a signed PDF document, ready for download or verification
```

> [!NOTE]
> This package writes signatures directly to the PDF Document metadata directory (Subject/Producer structures). Standard PDF readers (like Adobe Acrobat) will not display an AcroForm signature badge. For native PDF byte-range signatures (true ETSI PAdES compliance), use our upcoming `@dottedice/cms-signed-data` package.

## Publishing to Registry

To publish this package to the npm registry, execute:
```bash
npm login
```
