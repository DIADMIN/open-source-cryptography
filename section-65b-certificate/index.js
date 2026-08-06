/**
 * @dottedice/section-65b-certificate
 * Indian Evidence Act Section 65B / BSA 2023 compliant legal declaration generator.
 */

/**
 * Generates a formatted legal declaration text under Section 65B of the Indian Evidence Act 1872
 * (now Section 63 of the Bharatiya Sakshya Adhiniyam 2023).
 * 
 * @param {Object} details - Declaration metadata
 * @returns {string} Fully formatted text declaration
 */
export function generateSection65BDeclaration(details) {
  const {
    declarantName,
    declarantDesignation,
    organizationName,
    computerDescription = 'Secure Local Client Workstation',
    osDetails = 'Modern Client Operating System',
    documentName,
    documentHash,
    hashAlgorithm = 'SHA-256',
    date = new Date().toLocaleDateString(),
    location = 'New Delhi, India'
  } = details;

  if (!declarantName || !declarantDesignation || !documentHash || !documentName) {
    throw new Error('declarantName, declarantDesignation, documentName, and documentHash are required to compile Section 65B declarations.');
  }

  return `FORM FOR THE ADMISSIBILITY OF ELECTRONIC RECORDS
(Under Section 65B of the Indian Evidence Act, 1872 / Section 63 of the Bharatiya Sakshya Adhiniyam, 2023)

I, ${declarantName}, holding the position of ${declarantDesignation} at ${organizationName || 'DottedIce Network'}, do hereby solemnly affirm and state as follows:

1. I am in lawful command of the computer systems and network components located at ${organizationName || 'DottedIce Network'} which run and operate the computer resource described as:
   - System/Device: ${computerDescription}
   - OS/Platform: ${osDetails}

2. The electronic record titled "${documentName}" has been produced by the computer system described above during the period when the computer was used regularly to store or process information for the purposes of activities regularly carried on over that period.

3. Throughout the material period, the computer system was operating properly, and the accuracy of the electronic record's contents has not been affected by any system malfunction, interruption, or tampering.

4. The electronic record was processed and printed/exported in the ordinary course of active business operations.

5. I have verified the cryptographic integrity of the electronic record and certify the following parameters:
   - Document Title: ${documentName}
   - Computed Digest: ${documentHash}
   - Hash Algorithm: ${hashAlgorithm}
   - Timestamp of Verification: ${date}

6. The details given above are true to the best of my knowledge, information, and belief.

Declared at: ${location}
Date: ${date}

Declarant Signature:
___________________________
Name: ${declarantName}
Designation: ${declarantDesignation}
`;
}
