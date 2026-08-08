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



# @dottedice/trust-shield-sdk

Unified Developer SDK for DottedIce Cryptographic Trust Shield. Bundles, abstracts, and provides high-level APIs for sanitization (GDPR/DPDP), digital PDF signing (PAdES/CMS), and certificate path verification.

## Installation

```bash
npm install @dottedice/trust-shield-sdk
```

## Features
* **DocumentPipeline**: Declarative pipeline wrapper to sanitize text fields, and digitally sign documents.
* **KeyManager**: Unifies secure local Web Crypto key stores and WebUSB CCID smartcard transport layers.
* **Verifier**: Runs standard-compliant byte range integrity checks, parses PKCS#7 SignedData, and verifies chains to trust root stores.

## Usage Example

### Declarative Signing Pipeline
```js
import { DocumentPipeline, KeyManager } from '@dottedice/trust-shield-sdk';

// 1. Generate keys & certificates
const { keyPair, cert } = await KeyManager.generateCertKeyPair('Sanjay Deshmukh');

// 2. Sanitize and Sign PDF
const signedPdf = await DocumentPipeline.input(rawPdfBytes)
  .sanitize({ stripText: ['CONFIDENTIAL_DATA'] })
  .sign({
    signerName: 'Sanjay Deshmukh',
    signerKey: keyPair.privateKey,
    certificate: cert.der,
    serialNumberHex: cert.serialNumber
  })
  .execute();
```

### Integrated PDF Signature & Trust Chain Verifier
```js
import { Verifier } from '@dottedice/trust-shield-sdk';

const result = await Verifier.verifyPdf(signedPdf, {
  trustRoots: [aatlRootDer]
});

console.log(result.isValid); // true/false
console.log(result.trustChainTrusted); // true/false
```
