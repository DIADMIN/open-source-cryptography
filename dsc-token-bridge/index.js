/**
 * @dottedice/dsc-token-bridge
 * WebUSB & WebSerial bridge for communicating with cryptographic USB tokens (smartcards/dongles).
 */

/**
 * Requests permission and connects to a connected USB cryptographic token.
 * e.g. ePass2003 (vendorId: 0x096c) or standard CCID smartcard readers.
 * 
 * @param {Object} options - Matching filter details
 * @returns {Promise<USBDevice>} WebUSB USBDevice instance
 */
export async function requestTokenDevice(options = {}) {
  if (typeof navigator === 'undefined' || !navigator.usb) {
    throw new Error('WebUSB API is not supported in this runtime environment. USB tokens require a modern browser.');
  }

  const {
    filters = [
      { vendorId: 0x096c }, // Feitian (ePass2003)
      { classCode: 0x0b }    // Chip Card Interface Devices (CCID)
    ]
  } = options;

  const device = await navigator.usb.requestDevice({ filters });
  await device.open();
  
  if (device.configuration === null) {
    await device.selectConfiguration(1);
  }
  
  return device;
}

/**
 * Lists currently authorized and connected USB token devices.
 * @returns {Promise<Array<USBDevice>>} List of USB devices
 */
export async function getConnectedTokenDevices() {
  if (typeof navigator === 'undefined' || !navigator.usb) {
    return [];
  }
  return await navigator.usb.getDevices();
}

/**
 * Transmits a raw APDU (Application Protocol Data Unit) packet to a CCID smartcard device.
 * ISO/IEC 7816-4 compliant structure.
 * 
 * @param {USBDevice} device - Opened USBDevice instance
 * @param {Uint8Array} apduBytes - APDU bytes to write
 * @param {number} endpointOut - Outgoing endpoint ID (default: 1)
 * @param {number} endpointIn - Incoming endpoint ID (default: 2)
 * @returns {Promise<Uint8Array>} APDU response packet
 */
export async function transferAPDU(device, apduBytes, endpointOut = 1, endpointIn = 2) {
  // Transmit command APDU
  await device.transferOut(endpointOut, apduBytes);

  // Read response status bytes (usually SW1 / SW2 at the end of buffer)
  const result = await device.transferIn(endpointIn, 64);
  return new Uint8Array(result.data.buffer);
}

/**
 * Simulates signature computation inside the token.
 * Note: Real PKCS#11 interaction requires PIN verification and specific card commands.
 * 
 * @param {USBDevice} device - Opened USBDevice
 * @param {Uint8Array} digestToSign - Target digest to sign
 * @returns {Promise<Uint8Array>} Raw signature bytes
 */
export async function computeTokenSignature(device, digestToSign) {
  // 1. Select the Cryptographic Applet (DF)
  // 2. Perform PIN verification
  // 3. Command: INTERNAL AUTHENTICATE or PSO: DECIPHER/SIGN
  console.log(`Instructing USB token (${device.productName}) to sign payload digest...`);
  
  // Return placeholder bytes simulating APDU roundtrip
  const resultSignature = new Uint8Array(256);
  crypto.getRandomValues(resultSignature);
  return resultSignature;
}
