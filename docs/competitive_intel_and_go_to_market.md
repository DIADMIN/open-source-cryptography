# KryptonSig: Competitive Intel & Go-To-Market Strategy

This document outlines the product positioning, feature matrix, pricing strategy, and GTM roadmap for **KryptonSig** as a standalone and embeddable cryptographic signing platform.

---

## 1. Competitive Analysis & Feature Benchmarks

### A. Pricing Models
*   **SignWell**:
    *   *Personal*: $15/month (1 user, 3 templates, limited document sends).
    *   *Business*: $30/user/month (unlimited documents, custom branding).
    *   *API*: Usage-based tiers starting at $24/month. Highly tailored for low-cost, high-velocity SMB workflows.
*   **DocuSeal**:
    *   *Self-Hosted*: Free and open-source (MIT License).
    *   *Pro Cloud*: $50/month flat rate (unlimited users and documents).
    *   *Enterprise*: $150/month flat rate (adds SSO/SAML, priority support).
*   **DocuSign / Dropbox Sign**:
    *   Standard enterprise tiers starting at $25–$40/user/month.
    *   Imposes strict envelope limits (e.g. 100 templates/sends per year) and charges heavy overage fees.

### B. Feature Comparison

| Feature / Standard | DocuSign | SignWell | DocuSeal | Preview (Mac) / Foxit | KryptonSig |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Cryptographic PDF Signatures** | Yes | Yes | Yes | No (Flat image stamp only) | **Yes (True PAdES /ByteRange)** |
| **Document Vector Sanitization** | No | No | No | No (Visual overlay only) | **Yes (Underlying text stripping)** |
| **Direct Hardware Token (WebUSB)** | No | No | No | No | **Yes (APDU policy enforcer)** |
| **IT Act 2000 Section 65B Logs** | No | No | No | No | **Yes (Automated legal declarations)** |
| **EU eIDAS QES Support** | Custom | No | No | No | **Yes (Trust path resolvers)** |
| **Developer API & Embeds** | Paid | Paid | Yes | No | **Yes (Zero-dependency SDK)** |

---

## 2. KryptonSig Product Architecture

KryptonSig is designed as a **dual-engine platform**:

1.  **Standalone SaaS / On-Premise Portal**: A drag-and-drop web dashboard for template management, sending signing invitations, and exporting court-admissible audit logs.
2.  **Embeddable REST API**: A performant service interface allowing sister applications like **KryptonPDF** to execute sanitization and cryptographic operations programmatically.

---

## 3. Monetization Strategy

To disrupt the market, KryptonSig will deploy a developer-first pricing model:

*   **Free Developer Core ($0)**: Self-hosted engine, standard PKI key management, and PAdES signatures.
*   **Business SaaS ($29/month flat)**: Unlimited users and documents, custom branding, and automated Section 65B declarations.
*   **Enterprise API (Starts at $79/month)**: Exposes full REST API (1,000 document operations/month), WebUSB hardware smartcard triggers, and SAML/SSO integrations.

---

## 4. Product-Market Fit (PMF) & GTM

### A. PMF Focus
*   **GDPR / DPDP Act 2023**: Standard redaction tools only mask text visually. KryptonSig completely destroys the character streams in the content layer, preventing data leakage.
*   **Indian Evidence Act / BSA 2023**: Automates legal declaration formats (Section 65B) to ensure electronic records are admissible in court.
*   **eIDAS (EU No 910/2014)**: Leverages client-side WebUSB CCID transport with APDU guards to sign using certified hardware smartcards.

### B. Go-To-Market Execution
1.  **Developer PLG**: Maintain open-source package repositories on GitHub/NPM under the non-commercial disclaimer. Developers will adopt the local-first SDK and upgrade to commercial licenses for corporate deployments.
2.  **KryptonPDF Bundle**: Integrate KryptonSig into **KryptonPDF** as the native signing engine, offering users free document signing credits to drive SaaS sign-ups.
3.  **Content Marketing**: Drive organic traffic by publishing technical guides on topics like *"How to redact PDFs safely under GDPR"* and *"Proving document integrity under Section 65B IEA"*.

---

## 5. Development Roadmap

*   **Phase 1: REST API Wrapper & KryptonPDF Connector (Month 1-2)**:
    *   Expose the 17 monorepo packages as a unified HTTP REST API.
    *   Implement the integration plug-in inside KryptonPDF.
*   **Phase 2: SaaS Portal Dashboard (Month 3-4)**:
    *   Release the multi-tenant web portal.
    *   Integrate secure browser storage (`@dottedice/secure-key-store`) for local key management.
*   **Phase 3: Enterprise Trust Roots & LTV (Month 5-6)**:
    *   Implement EU Trust List (EUTL) and CCA India CRL path resolution.
    *   Add enterprise SAML/SSO authentication.
