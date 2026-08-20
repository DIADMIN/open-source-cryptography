/**
 * KryptonSig Platform & KryptonPDF End-to-End Test Suite
 */

import { createServer } from './api/server.js';
import { TokenProvisioner } from './provisioning/index.js';
import { KryptonSigClient } from '../krypton-pdf-client/index.js';
import { PDFDocument } from 'pdf-lib';

async function runPlatformTests() {
  console.log('--- STARTING KRYPTONSIG PLATFORM & KRYPTONPDF INTEGRATION TESTS ---\n');

  // 1. Start REST API Gateway on port 4001
  const PORT = 4001;
  const server = createServer();
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`1. KryptonSig REST API Gateway started on http://localhost:${PORT}`);

  try {
    // 2. Hardware Token Provisioning Engine Handshake
    console.log('\n2. Testing Hardware Token Provisioning Engine...');
    const provisioner = new TokenProvisioner({ isSimulation: true });
    const device = await provisioner.connectDevice();
    console.log(`   Connected Device: ${device.name} (Serial: ${device.serial})`);

    const provisionResult = await provisioner.initializeToken('123456', '87654321', 'Ananya Roy');
    console.log(`   Provision Status: ${provisionResult.status}`);
    console.log(`   Issued Cert Serial: ${provisionResult.certificate.serialNumber}`);

    // 3. Test KryptonPDF Client Integration
    console.log('\n3. Executing KryptonPDF Integration Workflow via API...');
    const client = new KryptonSigClient({ baseUrl: `http://localhost:${PORT}/api/v1` });

    // Generate mock PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont('Helvetica');
    page.drawText('CONFIDENTIAL_DATA: 9876543210', { x: 50, y: 300, font, size: 12 });
    const originalPdfBytes = await pdfDoc.save();
    console.log(`   Original PDF generated (Bytes: ${originalPdfBytes.length})`);

    // A. KryptonPDF calls API to sanitize document
    console.log('   A. KryptonPDF requesting PII sanitization via API...');
    const sanitizedBytes = await client.sanitizePdf(originalPdfBytes, ['9876543210']);
    console.log(`      Sanitized PDF received (Bytes: ${sanitizedBytes.length})`);

    // B. KryptonPDF calls API to sign document
    console.log('   B. KryptonPDF requesting document signing via API...');
    const signResult = await client.signPdf(originalPdfBytes, {
      signerName: 'Ananya Roy',
      location: 'KryptonPDF Desktop Session',
      stripText: ['9876543210']
    });
    console.log(`      Signed PDF received (Bytes: ${signResult.signedPdfBytes.length})`);
    console.log(`      Signer: ${signResult.signerName}, Serial: ${signResult.serialNumberHex}`);

    // C. KryptonPDF calls API to verify signed document
    console.log('   C. KryptonPDF requesting cryptographic verification via API...');
    const verification = await client.verifyPdf(signResult.signedPdfBytes);
    console.log('      Verification Result:', {
      isValid: verification.isValid,
      tamperFree: verification.tamperFree,
      signatureVerified: verification.signatureVerified,
      trustChainTrusted: verification.trustChainTrusted,
      admissibilityReference: verification.auditTrail.admissibilityReference
    });

    if (!verification.isValid || !verification.signatureVerified) {
      throw new Error('Verification failed in KryptonPDF test workflow!');
    }

    console.log('\n✅ KRYPTONSIG PLATFORM & KRYPTONPDF WORKFLOW TEST PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    console.log('\nGateway server shut down.');
  }
}

runPlatformTests().catch(err => {
  console.error('\n❌ Platform Test Suite Crashed:', err);
  process.exit(1);
});
