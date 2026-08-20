/**
 * KryptonPDF Integration Client
 * Demonstrates how KryptonPDF (or third-party apps) consumes KryptonSig APIs.
 */

export class KryptonSigClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:4000/api/v1';
  }

  static _bytesToBase64(uint8Array) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(uint8Array).toString('base64');
    }
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  }

  static _base64ToBytes(base64Str) {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64Str, 'base64'));
    }
    const binary = atob(base64Str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * 1. Request KryptonSig API to sanitize target PII strings from PDF page content streams
   */
  async sanitizePdf(pdfBytes, stripText = []) {
    const response = await fetch(`${this.baseUrl}/sanitize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: KryptonSigClient._bytesToBase64(pdfBytes),
        stripText
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`KryptonSig Sanitize API Error: ${data.error || response.statusText}`);
    }

    return KryptonSigClient._base64ToBytes(data.sanitizedPdfBase64);
  }

  /**
   * 2. Request KryptonSig API to sanitize and sign PDF in a single PAdES workflow
   */
  async signPdf(pdfBytes, signingOptions = {}) {
    const response = await fetch(`${this.baseUrl}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: KryptonSigClient._bytesToBase64(pdfBytes),
        signerName: signingOptions.signerName || 'KryptonPDF User',
        location: signingOptions.location || 'KryptonPDF Client Session',
        stripText: signingOptions.stripText || []
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`KryptonSig Sign API Error: ${data.error || response.statusText}`);
    }

    return {
      signedPdfBytes: KryptonSigClient._base64ToBytes(data.signedPdfBase64),
      signerName: data.signerName,
      serialNumberHex: data.serialNumberHex
    };
  }

  /**
   * 3. Request KryptonSig API to cryptographically verify a signed PDF
   */
  async verifyPdf(pdfBytes) {
    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: KryptonSigClient._bytesToBase64(pdfBytes)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`KryptonSig Verify API Error: ${data.error || response.statusText}`);
    }

    return data.verification;
  }
}
