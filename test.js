import { DocumentPipeline, KeyManager, Verifier } from '@dottedice/trust-shield-sdk';
import { PDFDocument } from 'pdf-lib';

async function testSDK() {
  console.log('--- STARTING TRUST-SHIELD-SDK INTEGRATION TESTS ---');

  // 1. Generate keys & credentials (using KeyManager)
  console.log('1. Generating keys and certificate using KeyManager...');
  const { keyPair, cert } = await KeyManager.generateCertKeyPair('Vikramaditya Sharma');
  console.log('   Certificate Serial:', cert.serialNumber);

  // 2. Prepare mock PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont('Helvetica');
  page.drawText('CONFIDENTIAL_DATA: 9876543210', { x: 50, y: 300, font, size: 12 });
  const originalBytes = await pdfDoc.save();
  console.log('   Original PDF generated (contains sensitive text: "CONFIDENTIAL_DATA: 9876543210").');

  // 3. Process signing & sanitization through DocumentPipeline
  console.log('2. Running DocumentPipeline (Sanitize + PAdES Sign)...');
  const signedPdfBytes = await DocumentPipeline.input(originalBytes)
    .sanitize({ stripText: ['9876543210'] })
    .sign({
      signerName: 'Vikramaditya Sharma',
      location: 'Chennai Office',
      signerKey: keyPair.privateKey,
      certificate: cert.der,
      serialNumberHex: cert.serialNumber
    })
    .execute();
  console.log('   Document successfully processed. Signed PDF length:', signedPdfBytes.length);

  // 4. Verify using Verifier
  console.log('3. Verifying signed PDF using SDK Verifier...');
  const result = await Verifier.verifyPdf(signedPdfBytes, {
    trustRoots: [cert.der]
  });

  console.log('   Verification result:', result);

  if (!result.isValid || !result.tamperFree || !result.signatureVerified || !result.trustChainTrusted) {
    console.error('❌ SDK INTEGRATION TEST FAILED.');
    process.exit(1);
  }
  console.log('   ✅ Cryptographic verification and trust path resolved.');

  // 5. APDU Policy checks
  console.log('4. Checking USB APDU policy rules...');
  const selectFileApdu = new Uint8Array([0x00, 0xA4, 0x00, 0x00]);
  const selectResult = KeyManager.auditAPDU(selectFileApdu);
  console.log(`   APDU command allowed: ${selectResult.instruction}`);

  const forbiddenApdu = new Uint8Array([0x90, 0x99, 0x00, 0x00]);
  try {
    KeyManager.auditAPDU(forbiddenApdu);
    console.error('❌ POLICY GUARD FAILURE: Allowed proprietary class.');
    process.exit(1);
  } catch (err) {
    console.log('   ✅ APDU Policy Guard correctly blocked proprietary APDU:', err.message);
  }

  console.log('\n✅ ALL SDK INTEGRATION TESTS PASSED SUCCESSFULLY!');
}

testSDK().catch(err => {
  console.error('Integration test crashed:', err);
  process.exit(1);
});
