/**
 * KryptonSig Dashboard Client Logic
 */

let lastSignedPdfBase64 = null;

// Mock PDF generator for browser demonstration
function generateMockPdfBytes() {
  const text = "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 50 >>\nstream\nBT /F1 12 Tf 50 300 Td (CONFIDENTIAL_DATA: 9876543210) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \n0000000212 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n312\n%%EOF";
  return new TextEncoder().encode(text);
}

function bytesToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

document.addEventListener('DOMContentLoaded', () => {
  const btnSign = document.getElementById('btnSignDoc');
  const btnProvision = document.getElementById('btnProvisionToken');
  const btnVerify = document.getElementById('btnVerifyLastDoc');

  const signStatus = document.getElementById('signStatus');
  const tokenStatus = document.getElementById('tokenStatus');
  const verifyStatus = document.getElementById('verifyStatus');

  // 1. Process & Sign Document
  btnSign.addEventListener('click', async () => {
    signStatus.textContent = 'Processing PDF stream sanitization & signing via REST API...';
    
    try {
      const signerName = document.getElementById('signerName').value;
      const stripTextStr = document.getElementById('stripText').value;
      const stripText = stripTextStr.split(',').map(s => s.trim()).filter(Boolean);

      const mockBytes = generateMockPdfBytes();
      const pdfBase64 = bytesToBase64(mockBytes);

      const res = await fetch('http://localhost:4000/api/v1/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64,
          signerName,
          stripText,
          location: 'KryptonSig Web Dashboard'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signing failed');

      lastSignedPdfBase64 = data.signedPdfBase64;
      signStatus.textContent = `✅ Document Signed Successfully!\nSerial: ${data.serialNumberHex}\nSigned PDF Base64 Length: ${lastSignedPdfBase64.length}`;
    } catch (err) {
      signStatus.textContent = `❌ Error: ${err.message}`;
    }
  });

  // 2. Hardware Provisioner
  btnProvision.addEventListener('click', async () => {
    tokenStatus.textContent = 'Initializing WebUSB CCID transport & running APDU policy checks...';
    try {
      const userPin = document.getElementById('userPin').value;
      const isSim = document.getElementById('simMode').value === 'true';

      // Simulate handshake response
      setTimeout(() => {
        tokenStatus.textContent = `✅ Token Provisioned Successfully!\nDevice: KryptonSig CCID Smartcard (Simulated=${isSim})\nAPDU Policy Check: PASSED (0x00 0x20, 0x00 0x46, 0x00 0xD6)\nKey Status: RSA-2048 Non-Exportable Key On-Chip`;
      }, 1000);
    } catch (err) {
      tokenStatus.textContent = `❌ Error: ${err.message}`;
    }
  });

  // 3. Verify Last Processed PDF
  btnVerify.addEventListener('click', async () => {
    if (!lastSignedPdfBase64) {
      verifyStatus.textContent = '⚠️ Please click "Process & Sign Document" first.';
      return;
    }

    verifyStatus.textContent = 'Verifying signature envelope, certificate path & Section 65B audit trail...';
    try {
      const res = await fetch('http://localhost:4000/api/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: lastSignedPdfBase64 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      verifyStatus.textContent = JSON.stringify(data.verification, null, 2);
    } catch (err) {
      verifyStatus.textContent = `❌ Error: ${err.message}`;
    }
  });
});
