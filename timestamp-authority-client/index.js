/**
 * @dottedice/timestamp-authority-client
 * RFC 3161 compliant Timestamping Authority (TSA) client.
 */

import {
  derSequence,
  derInteger,
  derOID,
  derNull,
  derOctetString,
  concatUint8Arrays
} from '../x509-asn1-builder/index.js';

/**
 * Encodes a TimeStampReq structure.
 * @param {Uint8Array} digest - The SHA-256 document hash
 * @param {Object} options - Additional options (nonce, certReq)
 * @returns {Uint8Array} DER encoded TimeStampReq bytes
 */
export function buildTimeStampRequest(digest, options = {}) {
  const { certReq = true } = options;
  const sha256Oid = '2.16.840.1.101.3.4.2.1';
  
  // 1. Version: INTEGER (1)
  const version = derInteger(1);

  // 2. MessageImprint SEQUENCE
  const hashAlgorithm = derSequence([
    derOID(sha256Oid),
    derNull()
  ]);
  const hashedMessage = derOctetString(digest);
  const messageImprint = derSequence([hashAlgorithm, hashedMessage]);

  // Assemble request sequence
  const reqItems = [version, messageImprint];

  // Optional: CertReq BOOLEAN (0x01 tag)
  if (certReq) {
    reqItems.push(new Uint8Array([0x01, 0x01, 0xFF])); // Tag: BOOLEAN, Length: 1, Value: TRUE (0xFF)
  }

  return derSequence(reqItems);
}

/**
 * Submits a timestamp query to a Time Stamp Authority (TSA).
 * @param {string} tsaUrl - URL of the TSA service (e.g. 'http://timestamp.digicert.com')
 * @param {Uint8Array} digest - SHA-256 hash of the data to timestamp
 * @param {Object} options - Optional parameters
 * @returns {Promise<Uint8Array>} DER encoded TimeStampResp bytes
 */
export async function getTimestampToken(tsaUrl, digest, options = {}) {
  const requestBytes = buildTimeStampRequest(digest, options);

  const response = await fetch(tsaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/timestamp-query',
      'Accept': 'application/timestamp-reply'
    },
    body: requestBytes
  });

  if (!response.ok) {
    throw new Error(`TSA server returned error status: ${response.status} ${response.statusText}`);
  }

  const responseBuffer = await response.arrayBuffer();
  return new Uint8Array(responseBuffer);
}
