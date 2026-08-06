/**
 * @dottedice/x509-asn1-builder
 * Lightweight DER ASN.1 Encoder for Web Crypto.
 */

// Helper to concatenate multiple Uint8Arrays
export function concatUint8Arrays(arrays) {
  let totalLength = 0;
  for (const arr of arrays) {
    totalLength += arr.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Convert a binary string to Uint8Array
export function stringToUint8Array(str) {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
}

// Convert hex string to Uint8Array
export function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const len = cleanHex.length;
  const buf = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    buf[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return buf;
}

// Convert Uint8Array to hex string
export function uint8ArrayToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encode DER Length field
export function encodeLength(len) {
  if (len < 128) {
    return new Uint8Array([len]);
  }
  
  const bytes = [];
  let temp = len;
  while (temp > 0) {
    bytes.unshift(temp & 0xFF);
    temp = temp >> 8;
  }
  
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

// Wrap value in Tag-Length-Value (TLV) structure
export function derTLV(tag, valBytes) {
  const lenBytes = encodeLength(valBytes.length);
  const result = new Uint8Array(1 + lenBytes.length + valBytes.length);
  result[0] = tag;
  result.set(lenBytes, 1);
  result.set(valBytes, 1 + lenBytes.length);
  return result;
}

// Primitive ASN.1 encoders
export const derSequence = (arrays) => derTLV(0x30, concatUint8Arrays(arrays));
export const derSet = (arrays) => derTLV(0x31, concatUint8Arrays(arrays));
export const derOctetString = (bytes) => derTLV(0x04, bytes);
export const derNull = () => new Uint8Array([0x05, 0x00]);

export function derInteger(num) {
  // Simple integer encoder supporting numbers up to 32-bit and hex strings for large numbers
  let bytes;
  if (typeof num === 'string') {
    bytes = hexToUint8Array(num);
  } else {
    // Standard number encoding
    const hex = num.toString(16);
    bytes = hexToUint8Array(hex.length % 2 === 0 ? hex : '0' + hex);
  }

  // If the high bit of the first byte is set, prepend a 0x00 byte to keep it positive
  if (bytes[0] & 0x80) {
    const padded = new Uint8Array(bytes.length + 1);
    padded.set(bytes, 1);
    bytes = padded;
  }
  return derTLV(0x02, bytes);
}

export function derOID(oidStr) {
  const parts = oidStr.split('.').map(Number);
  const bytes = [];
  
  // First two nodes are combined: 40 * first + second
  bytes.push(parts[0] * 40 + parts[1]);
  
  // Subsequent nodes are base-128 encoded (VLQ)
  for (let i = 2; i < parts.length; i++) {
    let val = parts[i];
    const nodeBytes = [];
    nodeBytes.push(val & 0x7F);
    while (val > 0x7F) {
      val = val >> 7;
      nodeBytes.unshift((val & 0x7F) | 0x80);
    }
    bytes.push(...nodeBytes);
  }
  
  return derTLV(0x06, new Uint8Array(bytes));
}

export function derBitString(bytes, paddingBits = 0) {
  const payload = new Uint8Array(bytes.length + 1);
  payload[0] = paddingBits;
  payload.set(bytes, 1);
  return derTLV(0x03, payload);
}

export function derPrintableString(str) {
  return derTLV(0x19, stringToUint8Array(str));
}

export function derUTF8String(str) {
  return derTLV(0x0c, new TextEncoder().encode(str));
}

export function derUTCTime(date) {
  // Format: YYMMDDHHMMSSZ
  const pad = (n) => n.toString().padStart(2, '0');
  const year = pad(date.getUTCFullYear() % 100);
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  
  const formatted = `${year}${month}${day}${hours}${minutes}${seconds}Z`;
  return derTLV(0x17, stringToUint8Array(formatted));
}

// High-level X.509 DER structure builder
export function buildName(attributes) {
  // Convert { commonName: 'Vikram', org: 'DottedIce' } to RDN sequence
  // OIDs: CN=2.5.4.3, O=2.5.4.10, C=2.5.4.6, L=2.5.4.7, ST=2.5.4.8
  const oidMap = {
    commonName: '2.5.4.3',
    organization: '2.5.4.10',
    country: '2.5.4.6',
    locality: '2.5.4.7',
    state: '2.5.4.8'
  };

  const rdns = [];
  for (const [key, val] of Object.entries(attributes)) {
    const oidStr = oidMap[key];
    if (!oidStr) continue;
    
    // Each RDN is a Set containing a Sequence of OID and AttributeValue
    const attribute = derSequence([
      derOID(oidStr),
      derUTF8String(val)
    ]);
    rdns.push(derSet([attribute]));
  }
  return derSequence(rdns);
}

/**
 * Builds standard SubjectPublicKeyInfo (SPKI) from exported public key DER bytes
 */
export function buildSPKI(publicKeySpkiBytes) {
  // Web Crypto exports public keys directly in SPKI DER format.
  // We can return the raw bytes directly.
  return new Uint8Array(publicKeySpkiBytes);
}

/**
 * Compiles TBSCertificate (To-Be-Signed Certificate) DER structure (RFC 5280)
 */
export function buildTBSCertificate(options) {
  const {
    serialNumber, // hex string
    signatureOid, // e.g. '1.2.840.113549.1.1.11' (sha256WithRSAEncryption)
    issuerAttributes,
    subjectAttributes,
    validFrom = new Date(),
    validTo = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    publicKeySpkiBytes
  } = options;

  // Version: v3 is encoded as [0] EXPLICIT Version (0 = v1, 1 = v2, 2 = v3)
  // [0] tag is context-specific constructed tag 0 (0xA0)
  const version = derTLV(0xA0, derInteger(2)); 
  const serial = derInteger(serialNumber);
  
  const signatureAlg = derSequence([
    derOID(signatureOid),
    derNull()
  ]);

  const issuer = buildName(issuerAttributes);
  
  const validity = derSequence([
    derUTCTime(validFrom),
    derUTCTime(validTo)
  ]);

  const subject = buildName(subjectAttributes);
  const subjectPublicKeyInfo = buildSPKI(publicKeySpkiBytes);

  return derSequence([
    version,
    serial,
    signatureAlg,
    issuer,
    validity,
    subject,
    subjectPublicKeyInfo
  ]);
}

/**
 * Wraps TBS and signature into final X.509 DER certificate
 */
export function buildX509Certificate(tbsDer, signatureAlgorithmOid, signatureBytes) {
  const signatureAlg = derSequence([
    derOID(signatureAlgorithmOid),
    derNull()
  ]);
  const signature = derBitString(signatureBytes);

  return derSequence([
    tbsDer,
    signatureAlg,
    signature
  ]);
}
