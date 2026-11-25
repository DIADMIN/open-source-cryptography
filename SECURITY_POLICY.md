# Security Policy: The 5 Rules for Total Non-Exposure

> **Applicability**: Mandatory across all DottedIce Digital repositories, microservices, and client applications.  
> **Core Principle**: A client browser must be treated as hostile execution space. Secrets must live exclusively in server/edge runtime environment variables, and the client browser must only ever speak to your server proxy.

---

## The 5 Rules for Total Non-Exposure

### Rule 1: No `NEXT_PUBLIC_` / `VITE_` for Secrets
* **Policy**: Bundler public prefixes compile values directly into client JavaScript bundles.
* **Allowed**: Public identifiers only.
* **Strictly Prohibited**: Never commit or mark private keys, recovery codes, tokens, or credentials with public prefixes.

---

### Rule 2: Fail Closed
* **Policy**: When an expected environment variable is absent, routines must fail immediately and loudly (fatal error / exit 1). Never use fallback literals in source code.

---

### Rule 3: Platform Vaults Only
* **Policy**: Credentials, access tokens, and recovery keys must only be stored in encrypted platform vaults or secure offline keychains. Never commit recovery codes or `.env` files to git.

---

### Rule 4: Git Pre-Commit & CI Scanning
* **Policy**: Every local clone and CI/CD pipeline must enforce pre-commit secret scanning via `.githooks/pre-commit`.

---

### Rule 5: CORS & Strict Origin Locking
* **Policy**: Never use wildcard `*` for `Access-Control-Allow-Origin` on production API endpoints.
