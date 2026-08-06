# @dottedice/pades-pdf-signer

PAdES-compliant PDF signing utility using incremental update pipelines and native client-side Web Crypto.

## Installation

```bash
npm install @dottedice/pades-pdf-signer pdf-lib
```

## Features
* **PAdES Compatibility**: Automatically sets document metadata structures compatible with PAdES dictionary checks.
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
  visualStamp: { x: 50, y: 120, width: 260, height: 75 }
});

// signedPdfBytes is a signed PDF document, ready for download or verification
```

## Publishing to Registry

To publish this package to the npm registry, execute:
```bash
npm login
npm publish --access public
```
