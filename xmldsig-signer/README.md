## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/xmldsig-signer

Lightweight, browser-compatible W3C XML Digital Signature (XMLDSig) compiler. Ideal for enveloped XML signatures (used in e-invoicing, tax filings, and corporate integrations).

## Installation

```bash
npm install @dottedice/xmldsig-signer
```

## Features
* **Exclusive C14N Canonicalization**: Standard exclusive canonicalization helper.
* **Web Crypto Integration**: Performs local document hashing and asymmetric signature computation fully offline inside the browser.
* **Zero Dependencies**: Pure vanilla JavaScript module.

## API Reference

### `canonicalizeXML(xml)`
Applies exclusive canonicalization (C14N) to the target XML payload.
* `xml` (`string`): Raw XML payload.

### `signXML(xmlPayload, options)`
Asynchronously signs the target XML payload and returns the compiled `<Signature>` XML node.
* `xmlPayload` (`string`): The target XML content to sign.
* `options` (`Object`):
  * `privateKey` (`CryptoKey`): The Web Crypto private key.
  * `certificatePem` (`string`): Optional X.509 certificate PEM string to embed in `<KeyInfo>`.
  * `referenceUri` (`string`): ID of target XML element.
