## Legal Terms & Disclaimer
This open-source package is distributed strictly for technical education and architectural research purposes. For full warranty disclaimers, export control notices (US EAR / EU Dual-Use), and limitation of liability terms, please review our [Open Source Terms & Disclaimer](https://dottedice.com/legal.html#tab=opensource).

---

# @dottedice/dsc-token-bridge

WebUSB and WebSerial bridge interface to communicate with USB cryptographic tokens, smart card readers, and USB dongles (e.g. ePass2003) directly from modern web browsers.

## Installation

```bash
npm install @dottedice/dsc-token-bridge
```

## Features
* **WebUSB Integration**: Requests, pairs, and opens connections with standard CCID token devices.
* **APDU Transfers**: Sends raw ISO/IEC 7816-4 compliant Command/Response APDU packets.
* **Zero Dependencies**: Pure vanilla JavaScript module.

## Usage Example

```javascript
import { requestTokenDevice, computeTokenSignature } from '@dottedice/dsc-token-bridge';

// 1. Prompt user to select USB Token device
const device = await requestTokenDevice();
console.log('Connected to:', device.productName);

// 2. Compute signature using token hardware
const digest = new Uint8Array([1, 2, 3, 4]); // digest to sign
const signature = await computeTokenSignature(device, digest);
console.log('Signature computed:', signature);
```
