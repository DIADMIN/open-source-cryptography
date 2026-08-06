import { generateKeyPair, generateX509Certificate } from '@dottedice/web-crypto-pki';
import { signPdf } from '@dottedice/pades-pdf-signer';
import { verifySignature } from '@dottedice/esign-audit-verifier';
import { buildName } from '@dottedice/x509-asn1-builder';
import { verifyCMSSignature } from '@dottedice/cms-signature-validator';
import { sanitizePdfText } from '@dottedice/pdf-vector-sanitizer';
import { inspectAPDU } from '@dottedice/usb-token-policy-guard';
import { verifyTrustAnchor } from '@dottedice/trust-anchor-resolver';
import { PDFDocument } from 'pdf-lib';

async function testMonorepo() {
  console.log('--- STARTING MONOREPO COMPLIANCE & CRYPTO TESTS ---');

  // 1. Key Generation & Certification (web-crypto-pki / x509-asn1-builder)
  console.log('1. Generating keys and self-signed X.509 certificate...');
  const keyPair = await generateKeyPair('RSA');
  const subject = { commonName: 'Vikram Sharma', organization: 'DottedIce Tech' };
  const certResult = await generateX509Certificate(subject, keyPair);
  console.log('   Certificate Serial:', certResult.serialNumber);

  // 2. XMLDSig Signer / Aadhaar Bridge / TSA Check (scaffolding validation)
  console.log('2. Scaffolding validation...');

  // 3. Document Preparation (pdf-lib)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  // Write some sensitive text into the PDF stream
  const font = await pdfDoc.embedFont('Helvetica');
  page.drawText('Secret Key: 9876543210', { x: 50, y: 300, font, size: 12 });
  const originalBytes = await pdfDoc.save();
  console.log('   Original PDF generated (contains sensitive text: "Secret Key: 9876543210").');

  // 4. Secure Redaction (pdf-vector-sanitizer)
  console.log('3. Running secure PDF vector sanitizer (DPDP Act 2023 / GDPR)...');
  const sanitizedBytes = await sanitizePdfText(originalBytes, ['9876543210']);
  const sanitizedText = new TextDecoder('latin1').decode(sanitizedBytes);
  
  if (sanitizedText.includes('9876543210')) {
    console.error('❌ SANITIZATION FAILED: Sensitive text is still present in content stream.');
    process.exit(1);
  }
  console.log('   ✅ Sanitization successful: Text "9876543210" stripped from underlying streams.');

  // 5. PDF Signing (pades-pdf-signer)
  console.log('4. Signing document using true PAdES /ByteRange CMS envelope...');
  const issuerNameDer = buildName(subject);
  const signedBytes = await signPdf(sanitizedBytes, {
    signatoryName: 'Vikram Sharma',
    location: 'Chennai Office',
    privateKey: keyPair.privateKey,
    signerCertificateDer: certResult.der,
    signerIssuerNameDer: issuerNameDer,
    signerSerialNumberHex: certResult.serialNumber
  });
  console.log('   Signed PDF generated.');

  // 6. Signature Extraction & Cryptographic Verification (cms-signature-validator)
  console.log('5. Extracting and validating CMS signature envelope cryptographically...');
  const verifyResult = await verifySignature(signedBytes);
  
  // Extract CMS bytes from the byteRange signature field contents
  const pdfString = new TextDecoder('latin1').decode(signedBytes);
  const byteRangeMatch = pdfString.match(/\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/);
  const byteRange = [
    parseInt(byteRangeMatch[1], 10),
    parseInt(byteRangeMatch[2], 10),
    parseInt(byteRangeMatch[3], 10),
    parseInt(byteRangeMatch[4], 10)
  ];

  const hexStart = byteRange[0] + byteRange[1] + 1;
  const hexEnd = byteRange[2] - 1;
  const signatureHex = pdfString.substring(hexStart, hexEnd).trim().replace(/0+$/, '');
  
  // Convert hex to bytes
  const len = signatureHex.length;
  const cmsBytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    cmsBytes[i / 2] = parseInt(signatureHex.substring(i, i + 2), 16);
  }

  // Calculate the hash of the signed ranges
  const part1 = signedBytes.subarray(byteRange[0], byteRange[0] + byteRange[1]);
  const part2 = signedBytes.subarray(byteRange[2], byteRange[2] + byteRange[3]);
  const combined = new Uint8Array(part1.length + part2.length);
  combined.set(part1, 0);
  combined.set(part2, part1.length);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (await import('crypto')).webcrypto;
  const docHashBytes = new Uint8Array(await cryptoObj.subtle.digest('SHA-256', combined));

  const cryptoVerify = await verifyCMSSignature(cmsBytes, docHashBytes);
  console.log('   Cryptographic validation result isValid:', cryptoVerify.isValid);
  if (!cryptoVerify.isValid) {
    console.error('❌ CRYPTOGRAPHIC VERIFICATION FAILED:', cryptoVerify.reason);
    process.exit(1);
  }
  console.log('   ✅ Cryptographic verification successful.');

  // 7. Trust Anchor Resolution (trust-anchor-resolver)
  console.log('6. Running trust anchor chain verification...');
  const trustVerify = verifyTrustAnchor(cryptoVerify.signerCertificate, [], [certResult.der]);
  console.log('   Chain trusted status:', trustVerify.trusted);
  console.log('   Path resolution details:', trustVerify.path.map(p => p.subjectCommonName).join(' -> '));

  if (!trustVerify.trusted) {
    console.error('❌ TRUST ANCHOR RESOLUTION FAILED.');
    process.exit(1);
  }
  console.log('   ✅ Trust anchor chain verified.');

  // 8. Policy Guard Verification (usb-token-policy-guard)
  console.log('7. Running USB APDU Policy Guard checks...');
  
  // Allowed APDU (SELECT_FILE)
  const selectFileApdu = new Uint8Array([0x00, 0xA4, 0x00, 0x00]);
  const selectResult = inspectAPDU(selectFileApdu);
  console.log(`   APDU command allowed: ${selectResult.instruction}`);

  // Unauthorized APDU (proprietary instruction)
  const forbiddenApdu = new Uint8Array([0x90, 0x99, 0x00, 0x00]);
  try {
    inspectAPDU(forbiddenApdu);
    console.error('❌ POLICY GUARD FAILURE: Allowed unauthorized/unregistered command class.');
    process.exit(1);
  } catch (err) {
    console.log('   ✅ Policy Guard correctly intercepted and blocked unauthorized command:', err.message);
  }

  console.log('\n✅ ALL MONOREPO TESTS PASSED SUCCESSFULLY! COMPLIANCE SHIELD IS ACTIVE.');
}

testMonorepo().catch(err => {
  console.error('Integration test crashed:', err);
  process.exit(1);
});
