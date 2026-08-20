# KryptonSig: Hardware Token Preparation & Provisioning Guide

This document defines the supply chain sourcing, software provisioning, and commercial packaging strategy for distributing secure cryptographic hardware tokens (USB Tokens/Smartcards) to enterprise clients.

---

## 1. Hardware Sourcing & OEM Customization

To meet international regulatory compliance, the physical USB tokens must be sourced from certified original equipment manufacturers (OEMs) and customized for the KryptonSig brand.

### A. Required Compliance Certifications
*   **eIDAS (Europe)**: Tokens must be certified as **Qualified Signature Creation Devices (QSCD)** under the Common Criteria (CC) EAL4+ or EAL5+ security profiles.
*   **FIPS Standard**: Sourced hardware must carry **FIPS 140-2 Level 3** (or FIPS 140-3) approval to ensure physical tamper-resistance and secure boundaries.
*   **Recommended OEM Partners**: Feitian Technologies (ePass series), EnterSafe, or Yubico (YubiKey series).

### B. Branding & Customization
*   **Housing**: Custom-colored token shells (KryptonSig blue/grey).
*   **Engraving**: Laser-etched brand logo and unique hardware serial number.
*   **Packaging**: Tamper-evident, sealed anti-static bags containing a security recovery keycard.

---

## 2. Token Provisioning Workflow

Tokens are purchased in a "blank" factory state. The initialization process must be executed securely by the client using our driverless browser portal.

```
┌─────────────────┐      ┌──────────────┐      ┌────────────────┐      ┌─────────────┐
│ Reset Transport │ ───► │ Set User PIN │ ───► │ Generate Keys  │ ───► │ Import CA   │
│      Keys       │      │   & SOPIN    │      │ (Non-Export)   │      │ Certificate │
└─────────────────┘      └──────────────┘      └────────────────┘      └─────────────┘
```

### Step 1: Initial Handshake & Reset
The client connects the token via USB and opens the KryptonSig Setup Page. The portal utilizes `@dottedice/dsc-token-bridge` via the browser's WebUSB API to establish connection and reset the device to clear default transport keys.

### Step 2: Credential Configuration
The user is prompted to establish:
1.  **User PIN (6-8 digits)**: Used for everyday signing authorizations.
2.  **SOPIN / PUK (8-16 characters)**: The administrative password used to unlock the token if the User PIN is blocked.

### Step 3: On-Chip Keypair Generation
The portal sends the command structure (`0x00 0x46` - Generate Keypair) to the token's chip.
*   The private key is generated inside the hardware boundary and flagged as **non-exportable**. 
*   The corresponding public key is exported to the browser.

### Step 4: Certificate Enrollment
The browser generates a Certificate Signing Request (CSR) signed by the token's private key and transmits it to our Certificate Authority or partner QTSP. The issued X.509 certificate is written back onto the token's EEPROM filesystem using APDU commands.

---

## 3. Commercial Packaging & Pricing

| Product Option | What's Included | Target Audience | Pricing Model |
| :--- | :--- | :--- | :--- |
| **KryptonSig Enterprise Box** | - Branded USB Token<br>- Quick Start Guide<br>- Tamper-evident serial seal | Executives, Legal Signers, Corporate Admins | $79 one-time hardware fee + Annual subscription |
| **BYOT (Bring Your Own Token)** | - Virtual provisioning profile<br>- Universal WebUSB driver package | Developers, Enterprise IT Departments | $0 hardware fee + API transaction usage tier |
