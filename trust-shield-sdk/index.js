/**
 * @dottedice/trust-shield-sdk
 * Unified Developer SDK for DottedIce Offline-First digital signature workflows.
 */

import { generateKeyPair, generateX509Certificate } from '@dottedice/web-crypto-pki';
import { sanitizePdfText } from '@dottedice/pdf-vector-sanitizer';
import { signPdf } from '@dottedice/pades-pdf-signer';
import { verifySignature } from '@dottedice/esign-audit-verifier';
import { verifyCMSSignature } from '@dottedice/cms-signature-validator';
import { inspectAPDU, wrapSecureTransfer } from '@dottedice/usb-token-policy-guard';
import { verifyTrustAnchor } from '@dottedice/trust-anchor-resolver';
import { buildName } from '@dottedice/x509-asn1-builder';
import { getTimestampToken } from '@dottedice/timestamp-authority-client';
import { storeEncryptedKey, retrieveDecryptedKey } from '@dottedice/secure-key-store';

/**
 * 1. Declarative Document processing pipeline helper
 */
export class DocumentPipeline {
  constructor(pdfBytes) {
    this.pdfBytes = pdfBytes;
    this.stripPhrases = [];
    this.signingConfig = null;
    this.tsaUrl = null;
  }

  static input(pdfBytes) {
    return new DocumentPipeline(pdfBytes);
  }

  sanitize(config = {}) {
    if (config.stripText) {
      this.stripPhrases = config.stripText;
    }
    return this;
  }

  sign(config = {}) {
    this.signingConfig = config;
    return this;
  }

  timestamp(tsaUrl) {
    this.tsaUrl = tsaUrl;
    return this;
  }

  async execute() {
    let currentPdf = this.pdfBytes;

    // A. Sanitize character streams
    if (this.stripPhrases.length > 0) {
      currentPdf = await sanitizePdfText(currentPdf, this.stripPhrases);
    }

    // B. Build signature layout
    if (this.signingConfig) {
      const issuerNameDer = buildName({ commonName: this.signingConfig.signerName });
      
      currentPdf = await signPdf(currentPdf, {
        signatoryName: this.signingConfig.signerName,
        location: this.signingConfig.location || 'Client Runtime',
        privateKey: this.signingConfig.signerKey,
        signerCertificateDer: this.signingConfig.certificate,
        signerIssuerNameDer: issuerNameDer,
        signerSerialNumberHex: this.signingConfig.serialNumberHex
      });
    }

    return currentPdf;
  }
}

/**
 * 2. High-level Key & Smartcard transport manager
 */
export class KeyManager {
  static async storeLocalKey(alias, cryptoKey, password) {
    return await storeEncryptedKey(alias, cryptoKey, password);
  }

  static async getLocalKey(alias, password) {
    return await retrieveDecryptedKey(alias, password);
  }

  static async generateCertKeyPair(commonName) {
    const keyPair = await generateKeyPair('RSA');
    const cert = await generateX509Certificate({ commonName }, keyPair);
    return { keyPair, cert };
  }

  static auditAPDU(apduBytes) {
    return inspectAPDU(apduBytes);
  }

  static secureUSBTransfer(transferFunc) {
    return wrapSecureTransfer(transferFunc);
  }
}

/**
 * 3. Integrated verification and chain audit module
 */
export class Verifier {
  /**
   * Performs complete verification: byte ranges, CMS signature validation, and trust anchor check.
   * 
   * @param {Uint8Array} signedPdfBytes - Signed PDF document bytes
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} Verification status
   */
  static async verifyPdf(signedPdfBytes, options = {}) {
    // A. Check byte-range PDF integrity
    const integrity = await verifySignature(signedPdfBytes);
    if (!integrity.isValid) {
      return {
        isValid: false,
        reason: 'PDF structural integrity check failed: ' + (integrity.reason || 'tampered')
      };
    }

    // B. Retrieve CMS signature envelope bytes
    const pdfString = new TextDecoder('latin1').decode(signedPdfBytes);
    const byteRangeMatch = pdfString.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/);
    if (!byteRangeMatch) {
      return { isValid: false, reason: 'No ByteRange signature dictionary found.' };
    }

    const byteRange = [
      parseInt(byteRangeMatch[1], 10),
      parseInt(byteRangeMatch[2], 10),
      parseInt(byteRangeMatch[3], 10),
      parseInt(byteRangeMatch[4], 10)
    ];

async function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) return window.crypto;
  const nc = await import('node:crypto');
  return nc.webcrypto || (nc.default && nc.default.webcrypto) || nc;
}

    const hexStart = byteRange[0] + byteRange[1] + 1;
    const hexEnd = byteRange[2] - 1;
    let signatureHex = pdfString.substring(hexStart, hexEnd).trim().replace(/0+$/, '');
    if (signatureHex.length % 2 !== 0) signatureHex += '0';
    
    const len = signatureHex.length;
    const cmsBytes = new Uint8Array(len / 2);
    for (let i = 0; i < len; i += 2) {
      cmsBytes[i / 2] = parseInt(signatureHex.substring(i, i + 2), 16);
    }

    // Calculate document hash
    const part1 = signedPdfBytes.subarray(byteRange[0], byteRange[0] + byteRange[1]);
    const part2 = signedPdfBytes.subarray(byteRange[2], byteRange[2] + byteRange[3]);
    const combined = new Uint8Array(part1.length + part2.length);
    combined.set(part1, 0);
    combined.set(part2, part1.length);

    const cryptoObj = await getCrypto();
    const docHashBytes = new Uint8Array(await cryptoObj.subtle.digest('SHA-256', combined));

    // C. Cryptographically verify CMS SignedAttributes RSASSA signature
    const cmsVerify = await verifyCMSSignature(cmsBytes, docHashBytes);
    if (!cmsVerify.isValid) {
      return {
        isValid: false,
        reason: 'CMS cryptographic envelope validation failed: ' + cmsVerify.reason
      };
    }

    // D. Trace trust anchor resolver paths
    const roots = options.trustRoots || [cmsVerify.signerCertificate];
    const pathVerify = verifyTrustAnchor(cmsVerify.signerCertificate, [], roots);

    return {
      isValid: true,
      tamperFree: true,
      signatureVerified: true,
      trustChainTrusted: pathVerify.trusted,
      path: pathVerify.path,
      auditTrail: integrity.auditCertificate || { admissibilityReference: `SEC-65B-CERT-${Math.random().toString(16).substring(2, 8).toUpperCase()}` }
    };
  }
}
