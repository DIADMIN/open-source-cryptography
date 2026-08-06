# @dottedice/esign-audit-verifier

Offline signature verification engine, integrity checks, and Section 65B Indian Evidence Act compliant court-admissible audit log compiler.

## Installation

```bash
npm install @dottedice/esign-audit-verifier pdf-lib
```

## Features
* **Integrity Validation**: Computes SHA-256 digests and checks for tampering in downstream incremental updates.
* **Section 65B Audit trail**: Generates legal validation reports for evidence purposes in legal and corporate jurisdictions.
* **100% Offline**: Executes entirely on the local client without cloud data transit.

## Usage Example

```javascript
import { verifySignature } from '@dottedice/esign-audit-verifier';

// 1. Read signed PDF file bytes
const signedPdfBuffer = await fetch('/contracts/Signed_Contract.pdf').then(res => res.arrayBuffer());

// 2. Verify signature integrity and generate Audit logs
const verification = await verifySignature(new Uint8Array(signedPdfBuffer));

if (verification.isValid) {
  console.log('Document is Valid. Signed by:', verification.signer);
  console.log('Court-admissible Audit Certificate:', verification.auditCertificate);
} else {
  console.error('Tampering or modification detected!');
}
```

## Publishing to Registry

To publish this package to the npm registry, execute:
```bash
npm login
npm publish --access public
```
