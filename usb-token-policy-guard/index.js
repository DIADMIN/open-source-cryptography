/**
 * @dottedice/usb-token-policy-guard
 * CCID security policy enforcer and APDU firewall for secure USB token communications.
 */

// List of allowed standard ISO/IEC 7816-4 instruction codes
const ALLOWED_INSTRUCTIONS = {
  0x20: 'VERIFY_PIN',
  0x88: 'INTERNAL_AUTHENTICATE',
  0x82: 'EXTERNAL_AUTHENTICATE',
  0x2A: 'PERFORM_SECURITY_OPERATION', // Used for signing
  0xA4: 'SELECT_FILE',
  0xB0: 'READ_BINARY',
  0xD6: 'UPDATE_BINARY',
  0xB2: 'READ_RECORD',
  0xE2: 'APPEND_RECORD',
  0xCA: 'GET_DATA'
};

/**
 * Inspects and validates an APDU packet against strict security policies.
 * Throws an error if the command attempts to execute unauthorized, vendor-proprietary,
 * or unsafe debugging operations.
 * 
 * @param {Uint8Array} apdu - Raw APDU command packet bytes
 * @returns {Object} Policy inspection results
 */
export function inspectAPDU(apdu) {
  if (apdu.length < 4) {
    throw new Error('Malformed APDU packet: length must be at least 4 bytes (header CLA, INS, P1, P2).');
  }

  const cla = apdu[0];
  const ins = apdu[1];
  const p1 = apdu[2];
  const p2 = apdu[3];

  // 1. Enforce standard instruction classes (allow standard ISO classes 0x00, 0x80, etc.)
  // Block custom vendor-specific instruction classes (e.g., proprietary backdoors)
  const isStandardClass = (cla === 0x00 || cla === 0x80 || cla === 0x0C || cla === 0x10);
  
  if (!isStandardClass) {
    throw new Error(`APDU Policy Violation: Proprietary instruction class 0x${cla.toString(16).toUpperCase()} is blocked.`);
  }

  // 2. Filter instructions
  const instructionName = ALLOWED_INSTRUCTIONS[ins];
  if (!instructionName) {
    throw new Error(`APDU Policy Violation: Instruction code 0x${ins.toString(16).toUpperCase()} is unauthorized/blocked.`);
  }

  // 3. Prevent PIN verification bypass or eavesdropping
  if (ins === 0x20) {
    // VERIFY PIN: Ensure PIN parameters are not being leaked or sent over unencrypted channels
    // Typically, CCID PIN verification should be offloaded to PIN pad reader devices if available,
    // otherwise verify length limits.
    const lc = apdu[4] || 0;
    if (lc > 16) {
      throw new Error('APDU Policy Violation: PIN length exceeds maximum allowed limit.');
    }
  }

  return {
    allowed: true,
    instruction: instructionName,
    cla,
    ins
  };
}

/**
 * Wrap a device interface to audit and block policy violations.
 * 
 * @param {Object} transferFunc - Device transfer function (e.g. transferAPDU)
 * @returns {Function} Audited transfer function wrapper
 */
export function wrapSecureTransfer(transferFunc) {
  return async function(device, apduBytes, ...args) {
    // Enforce inspection before dispatching bytes to the hardware
    inspectAPDU(apduBytes);
    return await transferFunc(device, apduBytes, ...args);
  };
}
