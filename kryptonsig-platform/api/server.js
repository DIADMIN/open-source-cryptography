/**
 * KryptonSig REST API Gateway
 * Zero-dependency HTTP server wrapping @dottedice/trust-shield-sdk and low-level modules.
 */

import http from 'http';
import { DocumentPipeline, KeyManager, Verifier } from '@dottedice/trust-shield-sdk';

const PORT = process.env.PORT || 4000;

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

export function createServer() {
  return http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    try {
      // 1. Health check
      if (req.method === 'GET' && pathname === '/api/v1/health') {
        return sendResponse(res, 200, {
          status: 'UP',
          service: 'KryptonSig REST API Gateway',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        });
      }

      // 2. Sanitize PII
      if (req.method === 'POST' && pathname === '/api/v1/sanitize') {
        const body = await parseJsonBody(req);
        if (!body.pdfBase64) return sendResponse(res, 400, { error: 'Missing pdfBase64 parameter.' });

        const originalBytes = Buffer.from(body.pdfBase64, 'base64');
        const stripPhrases = body.stripText || [];

        const sanitizedPdfBytes = await DocumentPipeline.input(originalBytes)
          .sanitize({ stripText: stripPhrases })
          .execute();

        return sendResponse(res, 200, {
          status: 'SUCCESS',
          sanitizedPdfBase64: Buffer.from(sanitizedPdfBytes).toString('base64'),
          originalLength: originalBytes.length,
          sanitizedLength: sanitizedPdfBytes.length
        });
      }

      // 3. Process & Sign Document
      if (req.method === 'POST' && pathname === '/api/v1/sign') {
        const body = await parseJsonBody(req);
        if (!body.pdfBase64 || !body.signerName) {
          return sendResponse(res, 400, { error: 'Missing required parameters: pdfBase64, signerName.' });
        }

        const pdfBytes = Buffer.from(body.pdfBase64, 'base64');

        // Generate temporary key & cert if not provided
        let keyPair, cert;
        if (body.signerKey && body.certificate) {
          keyPair = { privateKey: body.signerKey };
          cert = { der: body.certificate, serialNumber: body.serialNumberHex || '0102030405060708' };
        } else {
          const generated = await KeyManager.generateCertKeyPair(body.signerName);
          keyPair = generated.keyPair;
          cert = generated.cert;
        }

        const signedPdfBytes = await DocumentPipeline.input(pdfBytes)
          .sanitize({ stripText: body.stripText || [] })
          .sign({
            signerName: body.signerName,
            location: body.location || 'KryptonSig Gateway',
            signerKey: keyPair.privateKey,
            certificate: cert.der,
            serialNumberHex: cert.serialNumber
          })
          .execute();

        return sendResponse(res, 200, {
          status: 'SUCCESS',
          signedPdfBase64: Buffer.from(signedPdfBytes).toString('base64'),
          signerName: body.signerName,
          serialNumberHex: cert.serialNumber
        });
      }

      // 4. Verify Document
      if (req.method === 'POST' && pathname === '/api/v1/verify') {
        const body = await parseJsonBody(req);
        if (!body.pdfBase64) return sendResponse(res, 400, { error: 'Missing pdfBase64 parameter.' });

        const pdfBytes = Buffer.from(body.pdfBase64, 'base64');
        const verificationResult = await Verifier.verifyPdf(pdfBytes);

        return sendResponse(res, 200, {
          status: 'SUCCESS',
          verification: verificationResult
        });
      }

      return sendResponse(res, 404, { error: 'Endpoint not found.' });
    } catch (err) {
      return sendResponse(res, 500, { error: 'Internal Server Error', message: err.message });
    }
  });
}

// Start server directly if invoked as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`🚀 KryptonSig REST API Gateway listening on http://localhost:${PORT}`);
  });
}
