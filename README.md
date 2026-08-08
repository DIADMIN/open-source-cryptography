# DottedIce Cryptography: Legal Disclaimer & Terms of Use

> [!IMPORTANT]
> **CRITICAL NOTICE: READ BEFORE USE**
> By downloading, installing, copying, or utilizing any package inside this repository (collectively, the "Software"), you agree to be bound by the terms of this Legal Disclaimer.

---

## 1. Strictly Non-Commercial & Non-Business Use Covenant
The Software is provided **strictly for personal, educational, evaluation, and non-commercial research purposes**. 
* **Prohibited Use**: Any commercial use, business operations, enterprise deployments, integration into paid products, or government workflow deployments is strictly prohibited.
* **Licensing Conflict Note**: While the underlying repository files carry the Apache-2.0 license file header, this restrictive covenant governs all public distribution channels (GitHub and NPM). If you require a commercial license, you must obtain written authorization from the creators of DottedIce.

---

## 2. Global Disclaimer of Warranties & Limitation of Liability
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. 

IN NO EVENT SHALL DOTTEDICE, THE CREATORS, THE CONTRIBUTORS, OR THE MAINTAINERS BE LIABLE FOR ANY CLAIM, DAMAGES, LOSS OF DATA, REVENUE, PROFITS, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 3. European Union (EU) Law & Regulatory Compliance
* **eIDAS Regulation (EU No 910/2014)**: The Software is a low-level cryptographic library and is **not** an accredited Qualified Trust Service Provider (QTSP). The developers do not warrant that signatures generated using this Software conform to Qualified Electronic Signature (QES) standards or will be legally recognized as equivalent to handwritten signatures by EU member state courts or public administrations.
* **GDPR (Regulation EU 2016/679) Disclaimer**: The Software executes entirely client-side. The creators and maintainers do not act as data controllers or data processors. Any data privacy violations, leaks, or failure to redact personally identifiable information (PII) using the sanitization libraries are solely the responsibility of the entity executing the Software.
* **EU Product Liability Directive (85/374/EEC)**: Because the Software is provided free of charge, as open-source code for development, and without commercial transaction, it is exempt from standard product liability rules under EU consumer protection regulations.

---

## 4. Indian Jurisdiction & Information Technology Act 2000 Compliance
* **Indian Evidence Act 1872 / BSA 2023**: The Software compiles admissibility declaration forms (Section 65B). However, the creators do not warrant or guarantee that any court of law in India will accept these records without a certified human attestation.
* **IT Act 2000 Section 79 (Safe Harbor)**: The creators, maintainers, and distributors of the Software act solely as developers of open-source technology. They do not store, host, transmit, or modify any user data. Any liability arising from data breaches, transmission errors, or regulatory violations is solely the responsibility of the executing party.
* **Liability Cap**: Under the **Indian Contract Act, 1872**, this disclaimer constitutes a binding agreement limiting the liability of the developers to zero (₹0).

---

## 5. Universal & Other Global Jurisdictions (Open-Ended Clause)
To the maximum extent permitted by applicable law in any other national, federal, regional, state, or international jurisdiction worldwide, the creators and maintainers of the Software disclaim any and all liability. 
* **Saving Clause**: If any provision of this disclaimer is held to be invalid or unenforceable under the laws of any specific jurisdiction, such provision shall be modified to the minimum extent necessary to make it valid and enforceable, and the remaining provisions of this Disclaimer shall remain in full force and effect.
* **Global Exemption**: In no event shall the cumulative liability of the developers exceed zero under any consumer protection, contract, tort, or data privacy law of any territory globally.

---

## 6. US Export Control Classification (EAR / ECCN 5D002)
The Software contains cryptographic functions (e.g. generating RSA/ECDSA keypairs and CMS envelopes). 
* **Export Control Classification Number (ECCN)**: Classified under **5D002** (Information Security Software).
* **Public Source Exemption**: Published publicly on GitHub and NPM in accordance with **15 CFR § 740.13(e) (TSU exception)**.
* **Restricted Destinations**: The Software may not be downloaded or exported to any country subject to US embargoes (including Cuba, Iran, North Korea, Sudan, and Syria) or any entity on the US Denied Persons List.

---



# DottedIce Cryptographic Monorepo (Open-Source Verification Shield)

A modular, high-performance, and offline-first client-side digital signature and privacy compliance monorepo. Formulates a complete trust shield utilizing the native Web Cryptography API.

---

## 🗺️ Architectural Interlink Grid

The following diagram illustrates how the 16 packages interlink to build an end-to-end secure document processing workflow:

```mermaid
graph TD
    subgraph Client Key Management
        A["@dottedice/web-crypto-pki"] -->|Generates Keys & Certs| B["@dottedice/x509-asn1-builder"]
        A -->|Stores Keys locally| C["@dottedice/secure-key-store"]
        D["@dottedice/dsc-token-bridge"] -->|Accesses Smartcards| E["@dottedice/usb-token-policy-guard"]
    end

    subgraph Document Sanitization
        F["@dottedice/pdf-vector-sanitizer"] -->|Strips sensitive text| G["@dottedice/pdf-redaction-engine"]
    end

    subgraph Cryptographic Envelope Signing
        H["@dottedice/pades-pdf-signer"] -->|ByteRange Offset Planning| I["@dottedice/cms-signed-data"]
        I -->|Appends signed attributes| J["@dottedice/timestamp-authority-client"]
        K["@dottedice/xmldsig-signer"] -->|Canonicalization C14N| L["@dottedice/aadhaar-esign-bridge"]
    end

    subgraph Verification & Attestation
        M["@dottedice/esign-audit-verifier"] -->|Extracts CMS & Digests| N["@dottedice/cms-signature-validator"]
        N -->|Traces CA Root Chains| O["@dottedice/trust-anchor-resolver"]
        P["@dottedice/section-65b-certificate"] -->|Attestation logs| M
    end

    F -->|1. Sanitized PDF| H
    E -->|2. Audited Private Key| H
    H -->|3. Signed PDF| M
```

---

## 📦 Monorepo Packages

| Package | Version | Goal | Primary Compliance |
| :--- | :--- | :--- | :--- |
| **[`@dottedice/web-crypto-pki`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/web-crypto-pki)** | `v1.0.0` | Browser keypair generator and self-signed X.509 cert exporter. | RFC 5280 |
| **[`@dottedice/pades-pdf-signer`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/pades-pdf-signer)** | `v1.0.0` | Adobe-compliant byte-range PDF signature injector. | PAdES / PDF 1.7 |
| **[`@dottedice/esign-audit-verifier`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/esign-audit-verifier)** | `v1.0.2` | Extracts byte ranges, checks integrity, and logs system metadata. | Evidence Act Sec 65B |
| **[`@dottedice/x509-asn1-builder`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/x509-asn1-builder)** | `v1.0.0` | Low-level DER ASN.1 encoder for cert elements. | ASN.1 DER / RFC 5280 |
| **[`@dottedice/cms-signed-data`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/cms-signed-data)** | `v1.0.0` | Formats PKCS#7 CMS SignedData detached envelopes. | CMS (RFC 5652) |
| **[`@dottedice/cms-signature-validator`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/cms-signature-validator)** | `v1.0.0` | Cryptographically validates signatures over CMS SignedAttributes. | PKCS#7 verification |
| **[`@dottedice/pdf-vector-sanitizer`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/pdf-vector-sanitizer)** | `v1.0.0` | Strips raw text streams completely to prevent copy-paste data leaks. | GDPR / DPDP Act 2023 |
| **[`@dottedice/usb-token-policy-guard`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/usb-token-policy-guard)** | `v1.0.0` | Filters CCID APDUs to block proprietary diagnostic backdoors. | ISO/IEC 7816-4 |
| **[`@dottedice/trust-anchor-resolver`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/trust-anchor-resolver)** | `v1.0.0` | Verifies certificate chain paths to CA Root stores. | AATL / eIDAS |
| **[`@dottedice/timestamp-authority-client`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/timestamp-authority-client)** | `v1.0.0` | HTTP timestamp query generator for secure LTV. | RFC 3161 |
| **[`@dottedice/secure-key-store`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/secure-key-store)** | `v1.0.0` | PBKDF2/AES-GCM encrypted local key storage wrapper. | OWASP Client Storage |
| **[`@dottedice/aadhaar-esign-bridge`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/aadhaar-esign-bridge)** | `v1.0.0` | SOAP/XML gateway query client for remote eSign services. | CCA India eSign v2.1 |
| **[`@dottedice/xmldsig-signer`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/xmldsig-signer)** | `v1.0.0` | Exclusive canonicalization and enveloped XML signer. | W3C XMLDSig |
| **[`@dottedice/section-65b-certificate`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/section-65b-certificate)** | `v1.0.0` | Generates admissibility legal attestation forms. | Section 65B Act |
| **[`@dottedice/dsc-token-bridge`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/dsc-token-bridge)** | `v1.0.0` | CCID APDU transport bridge using WebUSB. | CCID smartcards |
| **[`@dottedice/pdf-redaction-engine`](file:///Users/sundarakamatchis/Downloads/DottedIce/Community/open-source-cryptography/pdf-redaction-engine)** | `v1.0.0` | Applies visual coordinate masking blocks. | Visual Obfuscation |

---

## ⚡ Quick Start: Composing a Secure Signature Workflow

Here is how a developer can compose these packages to sanitize, sign, and verify a PDF document:

```js
import { generateKeyPair, generateX509Certificate } from '@dottedice/web-crypto-pki';
import { sanitizePdfText } from '@dottedice/pdf-vector-sanitizer';
import { signPdf } from '@dottedice/pades-pdf-signer';
import { verifySignature } from '@dottedice/esign-audit-verifier';
import { verifyCMSSignature } from '@dottedice/cms-signature-validator';
import { buildName } from '@dottedice/x509-asn1-builder';

// 1. Setup Keys and Certificates
const keyPair = await generateKeyPair('RSA');
const certResult = await generateX509Certificate({ commonName: 'Vikram' }, keyPair);

// 2. Sanitize and Strip sensitive strings (DPDP Act Compliance)
const originalPdfBytes = /* ... load PDF ... */;
const sanitizedPdfBytes = await sanitizePdfText(originalPdfBytes, ['9876543210']);

// 3. Inject True PAdES ByteRange Signature
const signedPdfBytes = await signPdf(sanitizedPdfBytes, {
  signatoryName: 'Vikram Sharma',
  privateKey: keyPair.privateKey,
  signerCertificateDer: certResult.der,
  signerIssuerNameDer: buildName({ commonName: 'Vikram' }),
  signerSerialNumberHex: certResult.serialNumber
});

// 4. Extract and Validate Envelope Cryptographically
const integrity = await verifySignature(signedPdfBytes);
console.log('Document altered:', !integrity.isValid); // checks byte range hashes
```

---

## ⚖️ License
Licensed under the Apache License, Version 2.0. Conforms to patents grant and open-source compliance requirements.
