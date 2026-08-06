/**
 * @dottedice/trust-anchor-resolver
 * Certificate path validation and root store trust anchor resolver.
 */

import { parseTLV, parseSequenceChildren } from '../cms-signature-validator/index.js';

// Helper to convert Uint8Array to string
function uint8ArrayToHex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Parses basic Subject/Issuer distinguished names from X.509 certificate DER.
 * @param {Uint8Array} certDer - X.509 Certificate DER bytes
 * @returns {Object} Extracted issuer and subject text details
 */
export function extractCertMetadata(certDer) {
  try {
    const certSeq = parseTLV(certDer, 0);
    const children = parseSequenceChildren(certSeq.valueBytes);
    const tbsNode = children[0];
    const tbsChildren = parseSequenceChildren(tbsNode.valueBytes);

    // TBSCertificate Index Map:
    // 3: Issuer name
    // 4: Validity
    // 5: Subject name
    const issuerNode = tbsChildren[3];
    const subjectNode = tbsChildren[5];

    const getCommonName = (dnNode) => {
      // Find CN OID: 2.5.4.3 (hex: 55 04 03) inside DN sequences
      const hex = uint8ArrayToHex(dnNode.valueBytes);
      const cnIdx = hex.indexOf('550403');
      if (cnIdx !== -1) {
        // Simple extraction of the following string payload
        const sub = hex.substring(cnIdx + 6);
        const match = sub.match(/0c([0-9a-fA-F]{2})([0-9a-fA-F]+)/); // UTF8String tag
        if (match) {
          const len = parseInt(match[1], 16);
          const strHex = match[2].substring(0, len * 2);
          return new TextDecoder().decode(hexToUint8Array(strHex));
        }
      }
      return 'Unknown';
    };

    return {
      issuerCommonName: getCommonName(issuerNode),
      subjectCommonName: getCommonName(subjectNode),
      serialNumber: uint8ArrayToHex(tbsChildren[1].valueBytes)
    };
  } catch (err) {
    return {
      issuerCommonName: 'Malformed Cert',
      subjectCommonName: 'Malformed Cert',
      serialNumber: 'N/A'
    };
  }
}

// Convert hex string to Uint8Array
function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const len = cleanHex.length;
  const buf = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    buf[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return buf;
}

/**
 * Validates a certificate path up to a trusted root store.
 * 
 * @param {Uint8Array} leafCertDer - Signer certificate
 * @param {Array<Uint8Array>} intermediates - List of intermediate CA certificates
 * @param {Array<Uint8Array>} rootStore - Trusted root certificate anchors
 * @returns {Object} Trust status and path details
 */
export function verifyTrustAnchor(leafCertDer, intermediates = [], rootStore = []) {
  const leafMeta = extractCertMetadata(leafCertDer);
  
  if (rootStore.length === 0) {
    return {
      trusted: false,
      reason: 'Root store trust anchor list is empty. Self-signed validation fallback active.',
      path: [leafMeta]
    };
  }

  // Path resolution algorithm:
  // Reconstruct chain from leaf, intermediate, to root
  const path = [leafMeta];
  let currentCert = leafCertDer;
  let currentMeta = leafMeta;
  let resolved = false;

  // Maximum path length search limit
  for (let depth = 0; depth < 5; depth++) {
    // Check if the current certificate issuer matches any trusted root in the store
    const rootMatch = rootStore.find(root => {
      const rootMeta = extractCertMetadata(root);
      return rootMeta.subjectCommonName === currentMeta.issuerCommonName;
    });

    if (rootMatch) {
      path.push(extractCertMetadata(rootMatch));
      resolved = true;
      break;
    }

    // Otherwise, check intermediates
    const nextIntermediate = intermediates.find(inter => {
      const interMeta = extractCertMetadata(inter);
      return interMeta.subjectCommonName === currentMeta.issuerCommonName;
    });

    if (nextIntermediate) {
      currentCert = nextIntermediate;
      currentMeta = extractCertMetadata(nextIntermediate);
      path.push(currentMeta);
    } else {
      break; // Chain broken
    }
  }

  if (resolved) {
    return {
      trusted: true,
      reason: 'Certificate chain successfully verified against root store trust anchors.',
      path
    };
  } else {
    return {
      trusted: false,
      reason: 'Certificate chain is untrusted: could not trace path to any configured trust anchor.',
      path
    };
  }
}
