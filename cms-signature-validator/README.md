# @dottedice/cms-signature-validator

Zero-dependency cryptographic PKCS#7 / CMS SignedData signature verifier and certificate chain parser. Leverages native Web Cryptography API to execute in-browser/Node.js validation of signed attributes, certificate SPKIs, and raw signature values.

## Installation

```bash
npm install @dottedice/cms-signature-validator
```

## Features
* **Zero Dependencies**: Pure vanilla JavaScript module using standard Web Crypto.
* **Low-Level ASN.1 Parser**: Includes built-in TLV parsing helpers to traverse nested DER streams.
* **Cryptographic Integrity Checks**: Reconstructs signed attributes (SET structure) and validates the RSASSA-PKCS1-v1_5 signature against the signer's public key.

## API Reference

### `verifyCMSSignature(cmsDer, docHash)`
Asynchronously parses the CMS wrapper, extracts the public key from the embedded certificate, and cryptographically verifies the signature.
* `cmsDer` (`Uint8Array`): Binary DER-encoded CMS SignedData bytes.
* `docHash` (`Uint8Array`): Recomputed document digest bytes.
* Returns `{ isValid: boolean, signerPublicKey, signerCertificate }` on success, or `{ isValid: false, reason }` on verification failure.
