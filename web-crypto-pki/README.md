# @dottedice/web-crypto-pki

Offline-first asymmetric key pair and X.509 certificate generator utilizing the native Web Cryptography API. Works seamlessly in both modern web browsers and Node.js environments.

## Installation

```bash
npm install @dottedice/web-crypto-pki
```

## Features
* **Zero Dependencies**: Uses standard native Web Cryptography APIs under the hood.
* **Algorithm Support**: Supports standard RSA (`RSASSA-PKCS1-v1_5`) and ECDSA (`P-256`) algorithms.
* **PEM Exports**: Convenient utilities to format cryptographic keys as PEM (`SPKI` / `PKCS#8`) strings.
* **Offline X.509 Certification**: Locally simulates self-signed certificate structures for testing and sandbox validation.

## Usage Example

```javascript
import { generateKeyPair, exportPEM, generateX509Certificate } from '@dottedice/web-crypto-pki';

// 1. Generate an RSA Keypair
const keyPair = await generateKeyPair('RSA');

// 2. Export Private Key to PEM
const privatePem = await exportPEM(keyPair.privateKey, 'private');
console.log(privatePem);

// 3. Generate a local self-signed certificate
const cert = await generateX509Certificate(
  { commonName: 'Vikram Sharma', organization: 'DottedIce Tech' },
  keyPair
);
console.log('Certificate Signature:', cert.signature);
```

## Publishing to Registry

To publish this package to the npm registry, execute:
```bash
npm login
npm publish --access public
```
