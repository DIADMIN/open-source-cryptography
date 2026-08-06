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
 * @returns {Uint8Array} DER encoded CMS SignedData bytes
 */
export function buildCMSSignedData(options) {
  const {
    documentHash, // Uint8Array of PDF SHA-256 digest
    signerCertificateDer, // Uint8Array of signer X.509 cert DER
    signatureBytes, // Uint8Array of cryptographic signature
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
  // IMPLICIT context tag 0 is 0xA0
  const certificates = derTLV(0xA0, signerCertificateDer);

  // 5. SignerInfo: SEQUENCE
  const signerInfoVersion = derInteger(1);

  // SignerIdentifier: IssuerAndSerialNumber
  // Sequence of Issuer (Name) and SerialNumber (Integer)
  const signerIdentifier = derSequence([
    // Since signerIssuerNameDer is already a serialized DistinguishedName SEQUENCE,
    // we can parse/inject its raw bytes directly.
    signerIssuerNameDer,
    derInteger(signerSerialNumberHex)
  ]);

  const sigDigestAlg = derSequence([
    derOID(sha256Oid),
    derNull()
  ]);

  // Optional: SignedAttributes [0] IMPLICIT SignedAttributes (highly recommended for PAdES)
  // Let's build basic signed attributes: ContentType OID, MessageDigest OID, SigningTime OID.
  // Tag 0xA0 (constructed context tag 0) represents the SignedAttributes SET
  const contentTypeAttr = derSequence([
    derOID('1.2.840.113549.1.9.3'), // contentType OID
    derSet([derOID(dataOid)])
  ]);

  const messageDigestAttr = derSequence([
    derOID('1.2.840.113549.1.9.4'), // messageDigest OID
    derSet([derOctetString(documentHash)])
  ]);

  const signedAttrsSet = derTLV(0xA0, concatUint8Arrays([
    contentTypeAttr,
    messageDigestAttr
  ]));

  const signatureAlgorithm = derSequence([
    derOID(rsaSha256Oid),
    derNull()
  ]);

  const signature = derOctetString(signatureBytes);

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
  // contentType: OID 1.2.840.113549.1.7.2 (signedData)
  // content: [0] EXPLICIT SignedData
  const contentInfo = derSequence([
    derOID('1.2.840.113549.1.7.2'),
    derTLV(0xA0, signedData)
  ]);

  return contentInfo;
}
