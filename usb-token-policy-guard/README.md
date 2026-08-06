# @dottedice/usb-token-policy-guard

Programmatic APDU (Application Protocol Data Unit) firewall and security enforcer for browser-based WebUSB CCID token communications. Protects USB smartcards against PIN verification bypasses and proprietary vendor backdoors.

## Installation

```bash
npm install @dottedice/usb-token-policy-guard
```

## Features
* **APDU Firewalls**: Filters out non-standard ISO/IEC 7816-4 commands to block proprietary debugging routines.
* **PIN Length Guards**: Intercepts `VERIFY_PIN` frames to prevent buffer overflow attacks.
* **Wrapper Utilities**: Easily wraps low-level transport functions to enforce policy checks transparently.

## API Reference

### `inspectAPDU(apduBytes)`
Inspects the header of the APDU packet and throws an error if it violates safety policies.
* `apduBytes` (`Uint8Array`): APDU byte array.

### `wrapSecureTransfer(transferFunc)`
Wraps raw transfer functions to run `inspectAPDU` checks automatically before writing data to hardware.
