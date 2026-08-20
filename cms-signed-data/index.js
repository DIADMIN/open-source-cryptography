/**
 * @dottedice/cms-signed-data
 * Zero-dependency Cryptographic Message Syntax (CMS) / PKCS#7 SignedData builder.
 */

import {
  derSequence,
  derSet,
  derOID,
  derInteger,
  derOctetString,
  derNull,
  derTLV,
  concatUint8Arrays
} from '../x509-asn1-builder/index.js';

/**
 * Builds a detached CMS SignedData envelope (PKCS#7) for PDF signatures.
 * RFC 5652 / ETSI EN 319 132 compliant detached layout.
 * 
 * @param {Object} options - Configuration parameters
 * @returns {Promise<Uint8Array>} DER encoded CMS SignedData bytes
 */
export async function buildCMSSignedData(options) {
  const {
    documentHash, // Uint8Array of PDF SHA-256 digest
    signerCertificateDer, // Uint8Array of signer X.509 cert DER
    signatureBytes: inputSignatureBytes, // Optional fallback signature
    privateKey, // Cryptographic private key for signing signedAttributes
    signerIssuerNameDer, // Uint8Array of serialized DistinguishedName of cert issuer
    signerSerialNumberHex // Hex string serial number of cert
  } = options;

  const sha256Oid = '2.16.840.1.101.3.4.2.1';
  const dataOid = '1.2.840.113549.1.7.1';
  const rsaSha256Oid = '1.2.840.113549.1.1.11';
  
  // 1. Version: CMSVersion = 1
  const version = derInteger(1);

  // 2. DigestAlgorithms: SET of DigestAlgorithmIdentifier
  const digestAlgorithm = derSequence([
    derOID(sha256Oid),
    derNull()
  ]);
  const digestAlgorithms = derSet([digestAlgorithm]);

  // 3. EncapsulatedContentInfo
  // Sequence of eContentType (data OID) and optional [0] EXPLICIT eContent (omitted for detached sigs)
  const encapContentInfo = derSequence([
    derOID(dataOid)
  ]);

  // 4. Certificates: [0] IMPLICIT CertificateSet (SET of Certificate DERs)
  const certificates = derTLV(0xA0, signerCertificateDer);

  // 5. SignerInfo: SEQUENCE
  const signerInfoVersion = derInteger(1);

  // SignerIdentifier: IssuerAndSerialNumber
  // Sequence of Issuer (Name) and SerialNumber (Integer)
  const signerIdentifier = derSequence([
    signerIssuerNameDer,
    derInteger(signerSerialNumberHex)
  ]);

  const sigDigestAlg = derSequence([
    derOID(sha256Oid),
    derNull()
  ]);

  // SignedAttributes: SET of Attribute
  // In PKCS#7/CMS, if signedAttributes are present, we MUST include:
  // - ContentType: OID of encapsulated content type (data OID)
  // - MessageDigest: SHA-256 hash of the encapsulated content (document hash)
  const contentTypeAttr = derSequence([
    derOID('1.2.840.113549.1.9.3'), // contentType OID
    derSet([derOID(dataOid)])
  ]);

  const messageDigestAttr = derSequence([
    derOID('1.2.840.113549.1.9.4'), // messageDigest OID
    derSet([derOctetString(documentHash)])
  ]);

  // The collection of attributes wrapped in the context-specific tag [0] (0xA0) for SignerInfo
  const signedAttrsSet = derTLV(0xA0, concatUint8Arrays([
    contentTypeAttr,
    messageDigestAttr
  ]));

  // Standard-compliant signature calculation requires signing the SET representation (tag 0x31)
  let finalSignatureBytes = inputSignatureBytes || new Uint8Array(256);
  if (privateKey) {
    const crypto = (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) ? globalThis.crypto : (typeof window !== 'undefined' ? window.crypto : (await import('node:crypto')).webcrypto);
    const signedAttrsData = derTLV(0x31, concatUint8Arrays([
      contentTypeAttr,
      messageDigestAttr
    ]));
    
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      signedAttrsData
    );
    finalSignatureBytes = new Uint8Array(signatureBuffer);
  }

  const signatureAlgorithm = derSequence([
    derOID(rsaSha256Oid),
    derNull()
  ]);

  const signature = derOctetString(finalSignatureBytes);

  const signerInfo = derSequence([
    signerInfoVersion,
    signerIdentifier,
    sigDigestAlg,
    signedAttrsSet,
    signatureAlgorithm,
    signature
  ]);

  const signerInfos = derSet([signerInfo]);

  // 6. SignedData SEQUENCE
  const signedData = derSequence([
    version,
    digestAlgorithms,
    encapContentInfo,
    certificates,
    signerInfos
  ]);

  // 7. Outer ContentInfo SEQUENCE
  const contentInfo = derSequence([
    derOID('1.2.840.113549.1.7.2'),
    derTLV(0xA0, signedData)
  ]);

  return contentInfo;
}
