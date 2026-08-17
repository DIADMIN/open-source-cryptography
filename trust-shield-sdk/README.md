## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/trust-shield-sdk

Unified Developer SDK for DottedIce Cryptographic Trust Shield. Bundles, abstracts, and provides high-level APIs for sanitization (GDPR/DPDP), digital PDF signing (PAdES/CMS), and certificate path verification.

## Installation

```bash
npm install @dottedice/trust-shield-sdk
```

## Features
* **DocumentPipeline**: Declarative pipeline wrapper to sanitize text fields, and digitally sign documents.
* **KeyManager**: Unifies secure local Web Crypto key stores and WebUSB CCID smartcard transport layers.
* **Verifier**: Runs standard-compliant byte range integrity checks, parses PKCS#7 SignedData, and verifies chains to trust root stores.

## Usage Example

### Declarative Signing Pipeline
```js
import { DocumentPipeline, KeyManager } from '@dottedice/trust-shield-sdk';

// 1. Generate keys & certificates
const { keyPair, cert } = await KeyManager.generateCertKeyPair('Sanjay Deshmukh');

// 2. Sanitize and Sign PDF
const signedPdf = await DocumentPipeline.input(rawPdfBytes)
  .sanitize({ stripText: ['CONFIDENTIAL_DATA'] })
  .sign({
    signerName: 'Sanjay Deshmukh',
    signerKey: keyPair.privateKey,
    certificate: cert.der,
    serialNumberHex: cert.serialNumber
  })
  .execute();
```

### Integrated PDF Signature & Trust Chain Verifier
```js
import { Verifier } from '@dottedice/trust-shield-sdk';

const result = await Verifier.verifyPdf(signedPdf, {
  trustRoots: [aatlRootDer]
});

console.log(result.isValid); // true/false
console.log(result.trustChainTrusted); // true/false
```
