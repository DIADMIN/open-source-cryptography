# KryptonSig: Sales Demo Playbook & Prospect Pitch Guide

This document equips sales representatives, enterprise account executives, and solution engineers to pitch, demo, and close prospects for **KryptonSig**.

---

## 1. Executive Elevator Pitch

> *"KryptonSig is the industry’s first **local-first, zero-trust electronic signature and redaction platform**. Unlike traditional cloud signers like DocuSign or SignWell—which charge exorbitant per-envelope fees, leak data on black-box PDF redactions, and fail strict regional court admissibility rules—KryptonSig delivers **cryptographic PAdES signatures**, **true vector stream PII sanitization**, and **driverless WebUSB smartcard signing** at a fraction of the cost."*

---

## 2. Target Buyer Personas & Key Pain Points

| Target Persona | Key Pain Points | Winning KryptonSig Pitch |
| :--- | :--- | :--- |
| **Chief Legal Officer (CLO) / Legal Counsel** | - Electronic records rejected in court due to missing legal attestation.<br>- Unsure if digital signatures meet regional evidence laws. | *"Automates court-admissible Section 65B (IEA 1872 / BSA 2023) attestation logs out-of-the-box."* |
| **Data Protection Officer (DPO) / Compliance** | - Visually blacking out PDF text leaks underlying data under GDPR/DPDP Act.<br>- Cloud signers store unencrypted customer PII. | *"Destroys vector character streams in compressed `/FlateDecode` streams before signing so PII cannot be extracted."* |
| **CTO / VP of Engineering** | - Complex PKI driver installations for client hardware tokens.<br>- Expensive per-document API integration fees. | *"Zero-dependency SDK with native WebUSB CCID drivers — sign using hardware smartcards in browser with zero driver installs."* |
| **CFO / Head of Procurement** | - DocuSign price hikes and strict envelope send caps.<br>- Unpredictable annual software renewal overages. | *"Flat-rate predictable pricing ($29/mo SMB flat, $79/mo API flat) with 80% cost savings over legacy signers."* |

---

## 3. The 3-Tier Signature Level Explanation (Sales Guide)

When presenting to prospects, explain our three tiers of legal validity:

1. **Level 1: Simple Electronic Signature (SES)**
   * *Best For*: Internal NDAs, employee onboarding, low-risk approvals.
   * *How It Works*: Captures explicit intent (click/typed name), IP address, email attribution, and SHA-256 tamper-evident seal.
2. **Level 2: Advanced Electronic Signature (AdES)**
   * *Best For*: Commercial contracts, vendor agreements, B2B procurement.
   * *How It Works*: Embeds PKI soft certificates, RFC 3161 trusted timestamps, and standard PAdES `/ByteRange` CMS envelopes.
3. **Level 3: Qualified Electronic Signature (QES)**
   * *Best For*: Banking transactions, deed execution, high-value government filings.
   * *How It Works*: Direct hardware smartcard USB token signing (APDU policy protected) delivering legal equivalence to handwritten signatures under EU eIDAS and Indian IT Act.

---

## 4. Step-by-Step Live Demo Script

Follow this 5-minute click-through demo when presenting live to prospects:

```
[Slide 1: Problem] ──► [Demo: PII Sanitization] ──► [Demo: Hardware Token Sign] ──► [Demo: 65B Audit Log]
```

### Step 1: The "Fake Redaction" Reveal (Hook)
*   **Action**: Open a standard PDF in Adobe Reader with a black box drawn over a credit card or Aadhaar number. Highlight the text and copy-paste it into Notepad to reveal the hidden data.
*   **Script**: *"Notice how standard PDF editors only draw a black box over text, leaving the underlying data vulnerable under GDPR. Watch what KryptonSig does."*
*   **Action**: Submit document through KryptonSig Sanitizer API (`/api/v1/signatures/ades`). Try to copy-paste the text again—it is completely gone.

### Step 2: Driverless Hardware Smartcard Signing (The Wow Factor)
*   **Action**: Plug in a USB smartcard token (or toggle Simulation Mode in Dashboard UI). Click "Sign with Hardware Token".
*   **Script**: *"Traditionally, users must install bulky 200MB PKI drivers (like ePass/WD Proxkey) on Windows or Mac. KryptonSig communicates directly with the USB token via browser WebUSB while our APDU Firewall blocks rogue commands."*

### Step 3: Verifying Court-Admissible Section 65B Logs (Closing Deal)
*   **Action**: Click "Verify Document" and display the output JSON and downloadable Court Certificate.
*   **Script**: *"Every signature automatically outputs a certified Section 65B attestation reference code, making your electronic records instantly admissible in court without hiring expensive forensic witnesses."*

---

## 5. Handling Competitive Objections

### Objection 1: "We already use DocuSign."
*   **Response**: *"DocuSign is great for basic agreements, but their pricing scales aggressively with envelope limits. Furthermore, DocuSign cannot sanitize compressed PDF streams or sign using your existing enterprise USB smartcards directly in browser without custom software. KryptonSig saves you 75% while providing superior legal compliance."*

### Objection 2: "Is KryptonSig legally binding in my country?"
*   **Response**: *"Yes. KryptonSig implements standard Public Key Infrastructure (PKI) conforming to the U.S. ESIGN Act, U.S. UETA, EU eIDAS Regulation (EU No 910/2014), and Indian Evidence Act Section 65B. We provide audit trails covering intent, attribution, timestamps, and tamper-evident cryptographic seals."*

---

## 6. Pricing & ROI Cheat Sheet

| Prospect Tier | Legacy Cost (DocuSign/SignWell) | KryptonSig Cost | Prospect Annual Savings |
| :--- | :--- | :--- | :--- |
| **Small Business (5 users, 500 sends/yr)** | ~$2,400 / year | **$348 / year** ($29/mo flat) | **$2,052 / year (85% savings)** |
| **Growth Enterprise (20 users, 3,000 API sends)** | ~$8,500 / year | **$948 / year** ($79/mo API) | **$7,552 / year (88% savings)** |
