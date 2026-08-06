# @dottedice/web-crypto-pki

Offline-first asymmetric key pair and simulated certificate generator utilizing the native Web Cryptography API. Works seamlessly in both modern web browsers and Node.js environments.

## Installation

```bash
npm install @dottedice/web-crypto-pki
```

## Features
* **Zero Dependencies**: Uses standard native Web Cryptography APIs under the hood.
* **Algorithm Support**: Supports standard RSA (`RSASSA-PKCS1-v1_5`) and ECDSA (`P-256`) algorithms.
* **PEM Exports**: Convenient utilities to format cryptographic keys as PEM (`SPKI` / `PKCS#8`) strings.
* **Simulated Self-Signed Certificates**: Locally generates JSON-structured self-signed certificate payloads for development sandboxes and testing (non-ASN.1 DER format).

## Usage Example

```javascript
import { generateKeyPair, exportPEM, generateX509Certificate } from '@dottedice/web-crypto-pki';

// 1. Generate an RSA Keypair
const keyPair = await generateKeyPair('RSA');

// 2. Export Private Key to PEM
const privatePem = await exportPEM(keyPair.privateKey, 'private');
console.log(privatePem);

// 3. Generate a local simulated self-signed certificate payload
const cert = await generateX509Certificate(
  { commonName: 'Vikram Sharma', organization: 'DottedIce Tech' },
  keyPair
);
console.log('Certificate Signature:', cert.signature);
```

> [!NOTE]
> `generateX509Certificate` generates a simulated JSON-structured representation of certificate metadata signed with Web Crypto. For standard ASN.1 DER certificates compliant with RFC 5280, use our upcoming `@dottedice/x509-asn1-builder` package.

## Publishing to Registry

To publish this package to the npm registry, execute:
```bash
npm login
```
