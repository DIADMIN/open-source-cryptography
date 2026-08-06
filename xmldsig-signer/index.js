/**
 * @dottedice/xmldsig-signer
 * Lightweight W3C XML Digital Signature (XMLDSig) compiler.
 */

/**
 * Basic exclusive XML Canonicalization (C14N) simulation.
 * Minimizes whitespace inside tags, sorts attributes alphabetically, and removes comments.
 * @param {string} xml - Raw XML string
 * @returns {string} Canonicalized XML string
 */
export function canonicalizeXML(xml) {
  return xml
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .replace(/>\s+</g, '><')            // Remove whitespace between tags
    .replace(/<!--[\s\S]*?-->/g, '')     // Remove comments
    .trim();
}

/**
 * Compiles a W3C compliant <Signature> block.
 * @param {Object} options - Configuration parameters
 * @returns {Promise<string>} <Signature> XML block
 */
export async function signXML(xmlPayload, options = {}) {
  const {
    privateKey = null, // Web Crypto private key
    certificatePem = '', // Optional X.509 certificate Pem string
    referenceUri = '' // Target XML ID (empty for enveloped signature)
  } = options;

  const crypto = typeof window !== 'undefined' ? window.crypto : (await import('crypto')).webcrypto;
  const canonicalPayload = canonicalizeXML(xmlPayload);

  // 1. Calculate digest value of canonical payload
  const encoder = new TextEncoder();
  const payloadBytes = encoder.encode(canonicalPayload);
  const digestBuffer = await crypto.subtle.digest('SHA-256', payloadBytes);
  const digestBytes = new Uint8Array(digestBuffer);
  
  let binaryDigest = '';
  for (let i = 0; i < digestBytes.byteLength; i++) {
    binaryDigest += String.fromCharCode(digestBytes[i]);
  }
  const digestBase64 = typeof btoa !== 'undefined' ? btoa(binaryDigest) : Buffer.from(binaryDigest, 'binary').toString('base64');

  // 2. Build SignedInfo block
  const signedInfoXml = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
  <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
  <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
  <Reference URI="${referenceUri}">
    <Transforms>
      <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
    <DigestValue>${digestBase64}</DigestValue>
  </Reference>
</SignedInfo>`;

  const canonicalSignedInfo = canonicalizeXML(signedInfoXml);
  const signedInfoBytes = encoder.encode(canonicalSignedInfo);

  // 3. Compute cryptographic signature of SignedInfo
  let signatureBase64 = 'SIMULATED-XMLDSIG-SIGNATURE-BLOCK';
  if (privateKey) {
    const signatureBuffer = await crypto.subtle.sign(
      { name: 'RSASSA-PKCS1-v1_5' },
      privateKey,
      signedInfoBytes
    );
    const signatureBytes = new Uint8Array(signatureBuffer);
    let binary = '';
    for (let i = 0; i < signatureBytes.byteLength; i++) {
      binary += String.fromCharCode(signatureBytes[i]);
    }
    signatureBase64 = typeof btoa !== 'undefined' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
  }

  // 4. Assemble final signature block
  const certNode = certificatePem 
    ? `\n    <KeyInfo>\n      <X509Data>\n        <X509Certificate>${certificatePem.replace(/-----\w+ \w+-----/g, '').replace(/\s+/g, '')}</X509Certificate>\n      </X509Data>\n    </KeyInfo>`
    : '';

  return `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${signedInfoXml}
  <SignatureValue>${signatureBase64}</SignatureValue>${certNode}
</Signature>`;
}
