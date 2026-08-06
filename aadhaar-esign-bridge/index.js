/**
 * @dottedice/aadhaar-esign-bridge
 * Aadhaar eSign ASP Gateway XML request compiler and response parser.
 * Compliant with CCA India e-Sign Specifications v2.1.
 */

/**
 * Compiles the `<Esign>` request XML payload.
 * @param {Object} params - Gateway options
 * @returns {string} Compiled XML string
 */
export function compileEsignRequestXML(params) {
  const {
    aspId,
    txnId,
    timestamp = new Date().toISOString(),
    signatureClass = '3', // e.g. Class 3 OTP/Biometric
    preferredAuthMode = 'OTP', // 'OTP' or 'BIO' (Biometric) or 'FMR'
    documentHashes = [] // Array of { id: 'doc1', hash: 'SHA256-HEX' }
  } = params;

  if (!aspId || !txnId) {
    throw new Error('aspId and txnId are required to compile Aadhaar eSign XML requests.');
  }

  const docNodes = documentHashes.map(doc => {
    return `<InputDoc id="${doc.id}" hashAlgorithm="SHA256">${doc.hash}</InputDoc>`;
  }).join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Esign aspId="${aspId}" ts="${timestamp}" txn="${txnId}" ver="2.1" sc="${signatureClass}" preAuthMode="${preferredAuthMode}">
  <Docs>
    ${docNodes}
  </Docs>
</Esign>`;
}

/**
 * Parses the response XML returned by the eSign Service Provider (ESP).
 * @param {string} responseXml - Raw XML response from gateway
 * @returns {Object} Parsed response metadata and signature values
 */
export function parseEsignResponseXML(responseXml) {
  // Simple XML parser wrapper for environments (browser/Node) without heavy dependencies
  const getTagValue = (xml, tagName) => {
    const match = xml.match(new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`));
    return match ? match[1] : null;
  };

  const getAttributeValue = (xml, attrName) => {
    const match = xml.match(new RegExp(`${attrName}="([^"]+)"`));
    return match ? match[1] : null;
  };

  const status = getAttributeValue(responseXml, 'status');
  const txn = getAttributeValue(responseXml, 'txn');
  const errCode = getAttributeValue(responseXml, 'errCode');
  
  if (status === '1') {
    // Success: Extract signatures
    // The ESP returns <SignDoc id="doc1">Base64Signature</SignDoc>
    const sigMatches = [...responseXml.matchAll(/<SignDoc\s+id="([^"]+)"[^>]*>([^<]+)<\/SignDoc>/g)];
    const signatures = sigMatches.map(m => ({
      docId: m[1],
      signatureBase64: m[2].trim()
    }));

    return {
      success: true,
      txn,
      signatures,
      userCertificatePem: getTagValue(responseXml, 'UserX509Certificate')
    };
  } else {
    // Failure
    return {
      success: false,
      txn,
      errCode,
      errMsg: getTagValue(responseXml, 'ErrMsg') || 'Unknown ESP gateway error'
    };
  }
}
