## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/aadhaar-esign-bridge

Indian Aadhaar eSign ASP/ESP XML request compiler and response parser, compliant with the Controller of Certifying Authorities (CCA) India e-Sign API specifications v2.1.

## Installation

```bash
npm install @dottedice/aadhaar-esign-bridge
```

## Features
* **CCA Compliance**: Ready-to-go templates for compiling official XML requests.
* **Detached Signature Parsing**: Parses multi-document batch responses from gateways (eMudhra, NSDL/Protean, C-DAC).
* **Zero Dependencies**: Pure vanilla JavaScript module.

## API Reference

### `compileEsignRequestXML(params)`
Compiles and returns the XML string to be sent to the eSign Service Provider.
* `aspId` (`string`): App Service Provider identifier.
* `txnId` (`string`): Unique transaction ID.
* `preferredAuthMode` (`string`): `'OTP'` or `'BIO'`.
* `documentHashes` (`Array<{ id, hash }>`): SHA-256 hashes of the target PDF documents.

### `parseEsignResponseXML(responseXml)`
Parses the XML string response from the gateway.
* Returns `{ success: true, txn, signatures: Array<{ docId, signatureBase64 }>, userCertificatePem }` on success.
* Returns `{ success: false, txn, errCode, errMsg }` on failure.
