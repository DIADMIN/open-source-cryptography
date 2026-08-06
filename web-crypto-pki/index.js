/**
 * @dottedice/web-crypto-pki
 * Offline-first key pair and self-signed certificate utilities using Web Cryptography API.
 */

/**
 * Generates an asymmetric key pair.
 * @param {string} type - Algorithm family, 'RSA' or 'ECDSA'
 * @returns {Promise<CryptoKeyPair>} Key pair object
 */
export async function generateKeyPair(type = 'RSA') {
  const crypto = typeof window !== 'undefined' ? window.crypto : (await import('crypto')).webcrypto;
  
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
  const crypto = typeof window !== 'undefined' ? window.crypto : (await import('crypto')).webcrypto;
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
 * Simulates creation of a self-signed certificate payload offline (JSON structured format, non-ASN.1 DER).
 * @param {Object} subject - Certificate metadata (e.g. { commonName: 'Vikram', org: 'DottedIce' })
 * @param {CryptoKeyPair} keyPair - Cryptographic keys
 * @returns {Promise<Object>} Certificate payload and signature details
 */
export async function generateX509Certificate(subject, keyPair) {
  const crypto = typeof window !== 'undefined' ? window.crypto : (await import('crypto')).webcrypto;
  const commonName = subject.commonName || 'Anonymous';
  const org = subject.organization || 'Local Sandbox Org';
  
  const publicPem = await exportPEM(keyPair.publicKey, 'public');
  
  // Generate a cryptographically secure random serial number
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const serialNumber = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Create a payload to sign
  const certData = JSON.stringify({
    subject: { commonName, org },
    validFrom: new Date().toISOString(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    publicKeyPem: publicPem,
    serialNumber: serialNumber
  });
  
  const encoder = new TextEncoder();
  const certBytes = encoder.encode(certData);
  
  // Self-sign the certificate payload using the private key
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: 'RSASSA-PKCS1-v1_5'
    },
    keyPair.privateKey,
    certBytes
  );
  
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binarySig = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binarySig += String.fromCharCode(signatureBytes[i]);
  }
  const signatureBase64 = typeof btoa !== 'undefined' ? btoa(binarySig) : Buffer.from(binarySig, 'binary').toString('base64');
  
  return {
    rawPayload: certData,
    signature: signatureBase64,
    algorithm: 'RSASSA-PKCS1-v1_5-SHA256',
    issuer: { commonName, org }
  };
}
