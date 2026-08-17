## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/timestamp-authority-client

RFC 3161 compliant Time Stamp Authority (TSA) HTTP client to request cryptographically secure timestamps for PDF digital signatures (PAdES-T/LTV) and audit logs.

## Installation

```bash
npm install @dottedice/timestamp-authority-client
```

## Features
* **Zero Dependencies**: Pure vanilla JavaScript module.
* **RFC 3161 Formatters**: Generates binary DER query queries for TSAs.
* **Flexible clients**: Simple `fetch`-based POST client supporting both Node.js and browser environments.

## API Reference

### `buildTimeStampRequest(digest, options)`
Returns a `Uint8Array` containing the binary DER encoded TimeStampReq structure.
* `digest` (`Uint8Array`): SHA-256 digest bytes of the file.
* `options` (`Object`): `{ certReq: true }` request certificate chain in reply.

### `getTimestampToken(tsaUrl, digest, options)`
Performs an asynchronous POST request to the target TSA URL and returns the parsed `TimeStampResp` bytes as a `Uint8Array`.
* `tsaUrl` (`string`): The TSA server URL (e.g. `http://timestamp.apple.com` or `http://timestamp.digicert.com`).
* `digest` (`Uint8Array`): Target file hash digest.
