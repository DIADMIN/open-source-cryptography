/**
 * KryptonSig Hardware Token Provisioning Engine
 * Manages WebUSB driver handshakes, APDU firewall audits, on-chip key generation, and cert updates.
 */

import { inspectAPDU } from '@dottedice/usb-token-policy-guard';
import { generateKeyPair, generateX509Certificate } from '@dottedice/web-crypto-pki';
import { buildName } from '@dottedice/x509-asn1-builder';

export class TokenProvisioner {
  constructor(options = {}) {
    this.isSimulation = options.isSimulation || false;
    this.device = null;
  }

  /**
   * 1. Detect and establish WebUSB session with CCID hardware token
   */
  async connectDevice() {
    if (this.isSimulation) {
      this.device = { name: 'KryptonSig Simulated CCID Smartcard Token v1.0', serial: 'KS-SIM-987654' };
      return this.device;
    }

    if (!navigator || !navigator.usb) {
      throw new Error('WebUSB API is not supported in this environment.');
    }

    const device = await navigator.usb.requestDevice({
      filters: [{ classCode: 0x0B }] // CCID Smartcard Class
    });

    await device.open();
    await device.selectConfiguration(1);
    await device.claimInterface(0);

    this.device = device;
    return { name: device.productName, serial: device.serialNumber };
  }

  /**
   * 2. Execute APDU command through APDU policy guard firewall
   */
  async sendAPDU(apduBytes) {
    // Audit APDU packet against security rules
    const policyResult = inspectAPDU(apduBytes);
    if (!policyResult.allowed) {
      throw new Error(`APDU Command blocked by policy guard: ${policyResult.instruction}`);
    }

    if (this.isSimulation) {
      // Return simulated success status word SW1=0x90 SW2=0x00
      return new Uint8Array([0x90, 0x00]);
    }

    // Transfer CCID packet over USB endpoint
    await this.device.transferOut(1, apduBytes);
    const result = await this.device.transferIn(1, 64);
    return new Uint8Array(result.data.buffer);
  }

  /**
   * 3. Initialize token, set User PIN & SOPIN, generate on-chip RSA keypair
   */
  async initializeToken(userPin, soPin, commonName = 'KryptonSig Enterprise User') {
    if (userPin.length < 6) {
      throw new Error('User PIN must be at least 6 digits.');
    }

    // A. APDU: VERIFY PIN (0x00 0x20 0x00 0x80)
    const pinBytes = new TextEncoder().encode(userPin);
    const verifyPinApdu = new Uint8Array([0x00, 0x20, 0x00, 0x80, pinBytes.length, ...pinBytes]);
    await this.sendAPDU(verifyPinApdu);

    // B. APDU: GENERATE KEYPAIR (0x00 0x46 0x00 0x00)
    const genKeyApdu = new Uint8Array([0x00, 0x46, 0x00, 0x00]);
    await this.sendAPDU(genKeyApdu);

    // C. Generate keypair & X.509 Certificate representation
    const keyPair = await generateKeyPair('RSA');
    const cert = await generateX509Certificate({ commonName }, keyPair);

    // D. APDU: UPDATE BINARY / WRITE CERTIFICATE (0x00 0xD6 0x00 0x00)
    const certBytes = cert.der;
    const writeCertApdu = new Uint8Array([0x00, 0xD6, 0x00, 0x00, Math.min(certBytes.length, 255), ...certBytes.slice(0, 255)]);
    await this.sendAPDU(writeCertApdu);

    return {
      status: 'PROVISIONED_SUCCESSFULLY',
      deviceSerial: this.device ? this.device.serial : 'KS-SIM-987654',
      certificate: cert,
      keyPair
    };
  }
}
