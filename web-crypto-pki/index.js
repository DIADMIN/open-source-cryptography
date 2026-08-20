import { buildTBSCertificate, buildX509Certificate } from '@dottedice/x509-asn1-builder';

/**
 * Generates an asymmetric key pair.
 * @param {string} type - Algorithm family, 'RSA' or 'ECDSA'
 * @returns {Promise<CryptoKeyPair>} Key pair object
 */
export async function generateKeyPair(type = 'RSA') {
  const crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : (await import('node:crypto')).webcrypto);
  
  if (type === 'RSA') {
    return await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify']
    );
  } else if (type === 'ECDSA') {
    return await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );
  } else {
    throw new Error('Unsupported key pair type: ' + type);
  }
}

/**
 * Exports a CryptoKey to PEM string format.
 * @param {CryptoKey} key - The cryptographic key to export
 * @param {string} format - 'public' or 'private'
 * @returns {Promise<string>} PEM-formatted string
 */
export async function exportPEM(key, format) {
  const crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : (await import('node:crypto')).webcrypto);
  const isPrivate = format === 'private';
  const formatType = isPrivate ? 'pkcs8' : 'spki';
  
  const exported = await crypto.subtle.exportKey(formatType, key);
  const exportedBuffer = new Uint8Array(exported);
  
  let binary = '';
  for (let i = 0; i < exportedBuffer.byteLength; i++) {
    binary += String.fromCharCode(exportedBuffer[i]);
  }
  
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  const label = isPrivate ? 'PRIVATE KEY' : 'PUBLIC KEY';
  
  // Format with 64 character lines
  const lines = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

/**
 * Generates an RFC 5280 compliant X.509 self-signed certificate.
 * @param {Object} subject - Certificate metadata (e.g. { commonName: 'Vikram', organization: 'DottedIce' })
 * @param {CryptoKeyPair} keyPair - Cryptographic keys
 * @returns {Promise<Object>} Certificate PEM, DER bytes, and details
 */
export async function generateX509Certificate(subject, keyPair) {
  const crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : (await import('node:crypto')).webcrypto);
  
  // 1. Export the public key to SPKI DER format
  const publicKeySpkiBytes = new Uint8Array(await crypto.subtle.exportKey('spki', keyPair.publicKey));
  
  // 2. Generate a secure random serial number
  const randomBytes = new Uint8Array(8);
  if (typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(randomBytes);
  } else if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    const nodeCrypto = await import('node:crypto');
    nodeCrypto.randomFillSync(randomBytes);
  }
  const serialNumberHex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const rsaSha256Oid = '1.2.840.113549.1.1.11'; // sha256WithRSAEncryption

  // 3. Build TBS Certificate (To Be Signed)
  const tbsDer = buildTBSCertificate({
    serialNumber: serialNumberHex,
    signatureOid: rsaSha256Oid,
    issuerAttributes: subject,
    subjectAttributes: subject,
    publicKeySpkiBytes
  });

  // 4. Sign the TBS Certificate
  const signatureBuffer = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    keyPair.privateKey,
    tbsDer
  );
  const signatureBytes = new Uint8Array(signatureBuffer);

  // 5. Build Final DER X.509 Certificate
  const certDer = buildX509Certificate(tbsDer, rsaSha256Oid, signatureBytes);

  // 6. Convert to standard PEM representation
  let binary = '';
  for (let i = 0; i < certDer.byteLength; i++) {
    binary += String.fromCharCode(certDer[i]);
  }
  const base64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  
  const lines = [];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  const pem = `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;

  return {
    pem,
    der: certDer,
    serialNumber: serialNumberHex,
    issuer: subject
  };
}
