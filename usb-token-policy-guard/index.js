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
  0xCA: 'GET_DATA',
  0x46: 'GENERATE_KEYPAIR'
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
    // VERIFY PIN: Ensure PIN parameters conform to standard values
    if (p1 !== 0x00) {
      throw new Error('APDU Policy Violation: Invalid VERIFY_PIN parameter P1 (must be 0x00).');
    }
    if (p2 > 0x8F) {
      throw new Error('APDU Policy Violation: Invalid VERIFY_PIN parameter P2 (must be <= 0x8F).');
    }
    
    const lc = apdu[4] || 0;
    if (lc === 0 || lc > 16) {
      throw new Error('APDU Policy Violation: PIN length must be between 1 and 16 bytes.');
    }
    
    // Ensure packet length matches the declared Lc
    if (apdu.length < 5 + lc) {
      throw new Error('APDU Policy Violation: Truncated APDU packet relative to declared Lc length.');
    }
  }

  // 4. Validate Lc data size matches overall packet length for all data-bearing commands
  if (apdu.length > 4) {
    const lc = apdu[4];
    if (apdu.length > 5 && apdu.length < 5 + lc) {
      throw new Error('APDU Policy Violation: Declared Lc length mismatch with actual packet buffer length.');
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
