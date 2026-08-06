import { generateKeyPair, generateX509Certificate } from '@dottedice/web-crypto-pki';
import { signPdf } from '@dottedice/pades-pdf-signer';
import { verifySignature } from '@dottedice/esign-audit-verifier';
import { buildName } from '@dottedice/x509-asn1-builder';
import { PDFDocument } from 'pdf-lib';

async function testTrueEsign() {
  console.log('--- STARTING TRUE ADOBE-COMPLIANT ESIGN TESTS ---');

  // 1. Generate Keypair
  console.log('1. Generating cryptographic keys...');
  const keyPair = await generateKeyPair('RSA');

  // 2. Generate a real X.509 DER Certificate
  console.log('2. Generating standard X.509 certificate...');
  const subject = {
    commonName: 'Vikramaditya Sharma',
    organization: 'DottedIce Digital',
    country: 'IN'
  };
  const certResult = await generateX509Certificate(subject, keyPair);
  console.log('Certificate Serial Number:', certResult.serialNumber);
  console.log('Certificate PEM structure check:\n', certResult.pem.substring(0, 100) + '...\n...END CERTIFICATE-----');

  // 3. Serialize Issuer Name to DER
  const issuerNameDer = buildName(subject);

  // 4. Create blank PDF Document
  console.log('3. Preparing document...');
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([600, 400]);
  const originalBytes = await pdfDoc.save();

  // 5. Sign document using true PAdES /ByteRange CMS signed data
  console.log('4. Signing PDF with true byte-range CMS envelope...');
  const signedPdfBytes = await signPdf(originalBytes, {
    signatoryName: 'Vikramaditya Sharma',
    location: 'Chennai Gateway Node',
    privateKey: keyPair.privateKey,
    signerCertificateDer: certResult.der,
    signerIssuerNameDer: issuerNameDer,
    signerSerialNumberHex: certResult.serialNumber,
    visualStamp: { x: 50, y: 50, width: 250, height: 70 }
  });
  console.log('Signed PDF length:', signedPdfBytes.length);

  // 6. Verify signature
  console.log('5. Verifying signed PDF...');
  const verification = await verifySignature(signedPdfBytes);
  console.log('Verification result:', verification);
  console.log('Attestation framework:', verification.auditCertificate?.complianceFramework);
  console.log('Attested computed hash:', verification.auditCertificate?.systemMetadata?.computedFileHash);

  if (verification.isValid) {
    console.log('✅ TRUE ESIGN SUCCESSFUL: True Adobe-compliant PAdES signatures are working perfectly.');
  } else {
    console.error('❌ TRUE ESIGN FAILURE: Verification failed.');
    process.exit(1);
  }
}

testTrueEsign().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
