# KryptonSig: System Architecture & Technical Specifications Document

This document provides a comprehensive technical architecture description of the **KryptonSig Platform**, detailing signature level flows, cryptographic specifications, legal admissibility frameworks, hardware APDU firewalls, and API monetization structures.

---

## 1. System Architecture Topology

KryptonSig is built on a **local-first, multi-tier architecture** separating public client runtimes, developer SDKs, and backend API metering services:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Client Applications (e.g. KryptonPDF)                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                                         │  HTTP / HTTPS REST API Requests
                                         │  Header: X-API-Key
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             KryptonSig API Gateway                              │
│  - API Key Validation & Rate Limiting (engine/metering.js)                      │
│  - Endpoint Routers: /signatures/ses, /signatures/ades, /signatures/qes         │
└──────────────────┬─────────────────────┬─────────────────────┬──────────────────┘
                   │                     │                     │
                   ▼                     ▼                     ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  Level 1 Engine (SES)│ │ Level 2 Engine (AdES)│ │ Level 3 Engine (QES) │
│  - Intent capture    │ │ - Soft PKI Keypair   │ │ - WebUSB CCID Bridge │
│  - Attribution Data  │ │ - CMS SignedData     │ │ - APDU Firewall      │
│  - SHA-256 Digest    │ │ - RFC 3161 Timestamp │ │ - Section 65B Log    │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
```

---

## 2. Multi-Level E-Signature Engine Architecture

### A. Level 1: Simple Electronic Signature (SES)
*   **Target Standards**: U.S. ESIGN Act of 2000, U.S. UETA.
*   **Intent Capture**: Captures explicit user actions (`TYPED_NAME`, `DRAWN_SVG`, or `CLICK_AGREE`).
*   **Attribution Payload**: Records Signer Name, Email, IP Address, User-Agent string, and ISO Timestamp.
*   **Tamper Seal**: Computes a pre-stamp and post-stamp SHA-256 hash over the raw document bytes.
*   **Output**: Modified PDF with visual signature footer + `auditTrail` JSON object.

### B. Level 2: Advanced Electronic Signature (AdES)
*   **Target Standards**: EU eIDAS Regulation (EU No 910/2014) Advanced Electronic Signature, U.S. ESIGN PKI.
*   **Key Generation**: Generates 2048-bit RSA keypairs using the Web Cryptography API (`crypto.subtle`).
*   **X.509 Certificate**: Formats self-signed or CA-issued DER-encoded certificates using ASN.1 sequence encoders (`@dottedice/x509-asn1-builder`).
*   **CMS SignedData**: Assembles PKCS#7 / CMS SignedData envelopes (tag `0x31`) over DER `SignedAttributes`.
*   **PDF Injection**: Calculates PDF `/ByteRange` offsets and injects hex-encoded signature blocks into the document dictionary.

### C. Level 3: Qualified Electronic Signature (QES)
*   **Target Standards**: EU eIDAS Qualified Electronic Signature (QSCD Hardware), Indian IT Act 2000 / Section 65B IEA 1872 / BSA 2023.
*   **Hardware Interface**: Establishes WebUSB CCID sessions (`dsc-token-bridge`) with FIPS 140-2 Level 3 / CC EAL5+ physical smartcard tokens.
*   **APDU Firewall**: Passes all outbound APDU buffers through `usb-token-policy-guard` (`inspectAPDU`), enforcing bounds on `CLA`, `INS`, `P1`, `P2`, and payload size `Lc`.
*   **Non-Exportable Key Execution**: Triggers `GENERATE_KEYPAIR` (`0x00 0x46`) and `PERFORM_SECURITY_OPERATION` (`0x00 0x2A`) on-chip. Private keys never leave the physical token.
*   **Court Admissibility**: Generates Section 65B legal attestation certificates containing document hashes, execution timestamps, and system administrator declaration templates.

---

## 3. APDU Security Policy Rules

The APDU Firewall (`usb-token-policy-guard`) filters smartcard communications against the following rules:

```javascript
ALLOWED_INSTRUCTIONS = {
  0x20: 'VERIFY_PIN',               // P1=0x00, P2<=0x8F, Lc 1..16
  0x88: 'INTERNAL_AUTHENTICATE',
  0x82: 'EXTERNAL_AUTHENTICATE',
  0x2A: 'PERFORM_SECURITY_OPERATION',// RSA/ECDSA signing on-chip
  0xA4: 'SELECT_FILE',
  0xB0: 'READ_BINARY',
  0xD6: 'UPDATE_BINARY',             // Certificate EEPROM update
  0x46: 'GENERATE_KEYPAIR'           // On-chip key generation
};
```
*Any instruction class outside standard ISO 7816-4 (e.g. `0x90` proprietary diagnostic commands) is immediately blocked to prevent card memory buffer exploits.*

---

## 4. API Monetization & Metering Model

| Tier Name | Key Prefix | Monthly Quota | Base Monthly Price | Overage Rate |
| :--- | :--- | :--- | :--- | :--- |
| **Free Developer** | `ks_live_free_*` | 5 Requests | $0 | N/A (Blocked) |
| **Business SaaS** | `ks_live_biz_*` | 100 Requests | $29 | $0.25 / request |
| **Enterprise API** | `ks_live_ent_*` | 1,000 Requests | $79 | $0.10 / request |

Every API response returns real-time headers:
* `X-RateLimit-Tier`: Current subscription plan.
* `X-RateLimit-Limit`: Total monthly included request quota.
* `X-RateLimit-Remaining`: Remaining request allowance for current billing cycle.
