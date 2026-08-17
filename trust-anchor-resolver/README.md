## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/trust-anchor-resolver

Certificate trust path builder and anchor resolver. Validates intermediate certificate chains, parses distinguished name metadata, and verifies leaf signers against trusted Root CA Stores (AATL / eIDAS / CCA India).

## Installation

```bash
npm install @dottedice/trust-anchor-resolver
```

## Features
* **Zero Dependencies**: Pure vanilla JavaScript module.
* **Path Builder**: Reconstructs leaf-to-root certificate hierarchies.
* **DN Extractors**: Extracts serialNumber, issuer, and subject metadata from X.509 DER streams.

## API Reference

### `extractCertMetadata(certDer)`
Parses subject and issuer CommonName details from DER bytes.
* `certDer` (`Uint8Array`): Certificate DER bytes.

### `verifyTrustAnchor(leafCertDer, intermediates, rootStore)`
Reconstructs certificate path and returns trust state.
* `leafCertDer` (`Uint8Array`): Leaf certificate.
* `intermediates` (`Array<Uint8Array>`): Intermediate CAs.
* `rootStore` (`Array<Uint8Array>`): Trusted Root CA anchors.
* Returns `{ trusted: boolean, reason: string, path: Array<Object> }`.
