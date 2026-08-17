## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/section-65b-certificate

Form and legal declaration generator under Section 65B of the Indian Evidence Act 1872 / Section 63 of the Bharatiya Sakshya Adhiniyam (BSA) 2023. Generates standardized, court-admissible textual declarations for electronic records.

## Installation

```bash
npm install @dottedice/section-65b-certificate
```

## Features
* **BSA 2023 Ready**: Fully supports current Indian legal frameworks for electronic record admissibility.
* **Metadata Parametrization**: Easily inject system, device, declarant, and file hash information.
* **Zero Dependencies**: Pure vanilla JavaScript module.

## Usage Example

```javascript
import { generateSection65BDeclaration } from '@dottedice/section-65b-certificate';

const declarationText = generateSection65BDeclaration({
  declarantName: 'Sanjay Deshmukh',
  declarantDesignation: 'Chief Technology Officer',
  organizationName: 'DottedIce Services',
  computerDescription: 'Production Server Node 4',
  documentName: 'Contract_Agreements_Signed.pdf',
  documentHash: 'd2b044260a8e8d68ffd3476d6ae5256f6bff26173b3ce2fe5c7928111ad2c8f7',
  location: 'Mumbai, India'
});

console.log(declarationText);
```
