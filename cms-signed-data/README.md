# @dottedice/cms-signed-data

Zero-dependency Cryptographic Message Syntax (CMS) / PKCS#7 SignedData envelope builder for detached digital signatures (useful for PDF signing and code signing).

## Installation

```bash
npm install @dottedice/cms-signed-data
```

## Features
* **Zero Dependencies**: Lightweight, fast, and pure ES Module.
* **Detached Signature Envelopes**: Builds compliant PKCS#7 envelopes that separate document content from cryptographic signatures.
* **Metadata Insertion Support**: Integrates directly with client-side Web Crypto and `@dottedice/x509-asn1-builder` to format Adobe-compliant PDF signatures.

## API Reference

### `buildCMSSignedData(options)`
Compiles and returns a `Uint8Array` containing the DER-encoded CMS SignedData structure.

#### Options:
* `documentHash` (`Uint8Array`): The SHA-256 digest of the PDF file byte ranges.
* `signerCertificateDer` (`Uint8Array`): Serialized binary DER certificate of the signer.
* `signatureBytes` (`Uint8Array`): Cryptographic signature of the document hash/attributes.
* `signerIssuerNameDer` (`Uint8Array`): DistinguishedName sequence of the certificate issuer.
* `signerSerialNumberHex` (`string`): Serial number hex representation.
