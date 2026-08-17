## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/secure-key-store

Secure, browser-native IndexedDB database for Web Cryptography keys. Supports direct structured cloning of non-extractable keys, as well as PBKDF2/AES-GCM encrypted persistence of exportable keys.

## Installation

```bash
npm install @dottedice/secure-key-store
```

## Features
* **Non-Extractable Support**: Save private keys in IndexedDB without exporting them (safest browser practice).
* **Password Encryption**: Encrypt exportable keys before writing to disk using PBKDF2 iterations and AES-GCM 256-bit envelopes.
* **100% Offline**: Leverages standard browser APIs (`indexedDB` and `crypto.subtle`).

## API Reference

### Password-Encrypted Storage
* `storeEncryptedKey(alias, cryptoKey, password)`: Encrypts and writes the key to IndexedDB.
* `retrieveDecryptedKey(alias, password)`: Reads, decrypts, and imports the key back as a `CryptoKey`.

### Direct Storage (Non-Extractable Keys)
* `storeRawKey(alias, cryptoKey)`: Saves a `CryptoKey` object directly in IndexedDB.
* `retrieveRawKey(alias)`: Retrieves a `CryptoKey` from IndexedDB.

### Utilities
* `deleteKey(alias)`: Removes a key.
* `listKeys()`: Returns an array of stored aliases.
