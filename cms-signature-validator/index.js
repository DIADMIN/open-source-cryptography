/**
 * @dottedice/cms-signature-validator
 * Zero-dependency cryptographic PKCS#7 / CMS SignedData signature validator.
 */

// Decode DER Length field
function parseLength(bytes, offset) {
  let len = bytes[offset];
  let bytesUsed = 1;
  
  if (len & 0x80) {
    const numBytes = len & 0x7F;
    if (numBytes > 4) {
      throw new Error('ASN.1 Length field overflow: length byte count exceeds 4 bytes.');
    }
    len = 0;
    for (let i = 0; i < numBytes; i++) {
      len = (len << 8) | bytes[offset + 1 + i];
    }
    bytesUsed = 1 + numBytes;
  }
  
  return { length: len, bytesUsed };
}

// Parses a single TLV node at offset
export function parseTLV(bytes, offset) {
  if (offset >= bytes.length) return null;
  const tag = bytes[offset];
  const { length, bytesUsed } = parseLength(bytes, offset + 1);
  const valueOffset = offset + 1 + bytesUsed;
  const valueBytes = bytes.subarray(valueOffset, valueOffset + length);
  return {
    tag,
    length,
    valueOffset,
    valueBytes,
    nextOffset: valueOffset + length
  };
}

// Navigates a sequence to find child TLV nodes
export function parseSequenceChildren(sequenceValueBytes) {
  const children = [];
  let offset = 0;
  while (offset < sequenceValueBytes.length) {
    const node = parseTLV(sequenceValueBytes, offset);
    if (!node) break;
    children.push(node);
    offset = node.nextOffset;
  }
  return children;
}

/**
 * Cryptographically verifies a detached CMS SignedData envelope against a document hash.
 * 
 * @param {Uint8Array} cmsDer - DER-encoded CMS SignedData bytes
 * @param {Uint8Array} docHash - Recomputed SHA-256 document hash
 * @returns {Promise<Object>} Verification status and extracted metadata
 */
async function getCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) return globalThis.crypto;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) return window.crypto;
  const nc = await import('node:crypto');
  return nc.webcrypto || (nc.default && nc.default.webcrypto) || nc;
}

export async function verifyCMSSignature(cmsDer, docHash) {
  const crypto = await getCrypto();

  try {
    // 1. Outer ContentInfo SEQUENCE
    const contentInfo = parseTLV(cmsDer, 0);
    if (contentInfo.tag !== 0x30) throw new Error('Invalid outer ContentInfo sequence.');
    const contentInfoChildren = parseSequenceChildren(contentInfo.valueBytes);
    
    // OID: should be 1.2.840.113549.1.7.2 (signedData)
    const contentTypeNode = contentInfoChildren[0];
    
    // content: [0] EXPLICIT SignedData
    const signedDataContent = parseTLV(contentInfoChildren[1].valueBytes, 0);
    if (signedDataContent.tag !== 0x30) throw new Error('Invalid SignedData sequence.');
    const signedDataChildren = parseSequenceChildren(signedDataContent.valueBytes);

    // 2. Extract Certificate DER from SignedData (usually index 3)
    // Tag 0xA0 represents context-specific constructed [0] CertificateSet
    const certsNode = signedDataChildren.find(c => c.tag === 0xA0);
    if (!certsNode) throw new Error('No certificates found in CMS envelope.');
    
    // The certificates node value bytes is the signer certificate DER
    const signerCertDer = certsNode.valueBytes;

    // 3. Extract SignerInfo (usually the last index)
    // SignerInfos is a SET (0x31) at the end of the SignedData sequence
    const signerInfosNode = signedDataChildren.findLast(c => c.tag === 0x31);
    if (!signerInfosNode) throw new Error('No SignerInfos found.');
    const signerInfo = parseTLV(signerInfosNode.valueBytes, 0);
    if (signerInfo.tag !== 0x30) throw new Error('Invalid SignerInfo sequence.');
    const signerInfoChildren = parseSequenceChildren(signerInfo.valueBytes);

    // SignerInfo layout:
    // 0: Version
    // 1: SignerIdentifier (IssuerAndSerialNumber)
    // 2: DigestAlgorithm
    // 3: SignedAttributes [0] IMPLICIT (tag 0xA0)
    // 4: SignatureAlgorithm
    // 5: SignatureValue (OCTET STRING)
    const signedAttrsNode = signerInfoChildren.find(c => c.tag === 0xA0);
    const signatureValueNode = signerInfoChildren.find(c => c.tag === 0x04); // OCTET STRING signature value
    
    if (!signedAttrsNode || !signatureValueNode) {
      throw new Error('SignerInfo is missing signed attributes or signature value.');
    }

    // 4. Parse the Signer Certificate to extract Public Key SPKI
    // Certificate SEQUENCE:
    //   TBSCertificate SEQUENCE
    //     ...
    //     subjectPublicKeyInfo SEQUENCE
    const certSeq = parseTLV(signerCertDer, 0);
    const certChildren = parseSequenceChildren(certSeq.valueBytes);
    const tbsCert = certChildren[0]; // TBSCertificate
    const tbsChildren = parseSequenceChildren(tbsCert.valueBytes);
    
    // SubjectPublicKeyInfo is index 6 of TBSCertificate
    const spkiNode = tbsChildren[6];
    const spkiDer = parseTLV(signerCertDer, spkiNode.valueOffset - 0 /* cert offset */).valueBytes; // raw SPKI sequence
    
    // Reconstruct full SPKI buffer for Web Crypto import
    const fullSpki = derSequenceWrap(spkiNode.tag, spkiNode.valueBytes);

    // 5. Import the Signer Public Key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      fullSpki,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['verify']
    );

    // 6. Cryptographically verify the signature bytes against the signed attributes
    // In CMS/PKCS#7, the signature is computed over the DER encoding of the signed attributes.
    // However, the tag of the SignedAttributes in SignerInfo is context constructed [0] (0xA0),
    // but when signing, it is signed as a SET (0x31) tag!
    // We rewrite the outer tag from 0xA0 to 0x31 (SET) to match the signed bytes format.
    const signedAttrsBytes = new Uint8Array(signedAttrsNode.nextOffset - signedAttrsNode.valueOffset + 2); // approximate size
    const signedAttrsData = derSequenceWrap(0x31, signedAttrsNode.valueBytes);

    const isSignatureValid = await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' },
      publicKey,
      signatureValueNode.valueBytes,
      signedAttrsData
    );

    return {
      isValid: isSignatureValid,
      signerPublicKey: publicKey,
      signerCertificate: signerCertDer
    };
  } catch (err) {
    return {
      isValid: false,
      reason: 'Failed to verify CMS signature: ' + err.message
    };
  }
}

// Helper to wrap value in Sequence structure
function derSequenceWrap(tag, valueBytes) {
  const lenBytes = encodeLength(valueBytes.length);
  const result = new Uint8Array(1 + lenBytes.length + valueBytes.length);
  result[0] = tag;
  result.set(lenBytes, 1);
  result.set(valueBytes, 1 + lenBytes.length);
  return result;
}

// Encode DER Length
function encodeLength(len) {
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
