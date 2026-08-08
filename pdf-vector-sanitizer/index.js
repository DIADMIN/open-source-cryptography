/**
 * @dottedice/pdf-vector-sanitizer
 * PDF text stream vector sanitizer and secure redaction engine.
 */

import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';

// Decompress zlib/deflate bytes using native DecompressionStream
async function decompressFlate(bytes) {
  const ds = new DecompressionStream('deflate');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const response = new Response(ds.readable);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// Compress zlib/deflate bytes using native CompressionStream
async function compressFlate(bytes) {
  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const response = new Response(cs.readable);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// Helper to determine if a stream is flate compressed
function isFlateCompressed(stream) {
  const filter = stream.dict.lookup(PDFName.of('Filter'));
  if (!filter) return false;
  if (filter === PDFName.of('FlateDecode')) return true;
  if (typeof filter.asArray === 'function') {
    return filter.asArray().includes(PDFName.of('FlateDecode'));
  }
  return false;
}

/**
 * Sanitizes a PDF document by stripping or replacing underlying text characters 
 * inside the PDF page content streams to prevent copy-paste and text extraction leaks.
 * Supports both uncompressed and FlateDecode compressed streams.
 * 
 * @param {Uint8Array} pdfBytes - Original PDF bytes
 * @param {Array<string>} searchPhrases - Text strings to strip out
 * @returns {Promise<Uint8Array>} Sanitized PDF bytes
 */
export async function sanitizePdfText(pdfBytes, searchPhrases = []) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const contentsRef = page.node.get(PDFName.of('Contents'));
    if (!contentsRef) continue;

    const streams = page.node.lookup(PDFName.of('Contents'));
    const streamList = streams instanceof Array ? streams : [streams];

    for (const stream of streamList) {
      if (!(stream instanceof PDFRawStream)) continue;

      const isCompressed = isFlateCompressed(stream);
      let rawBytes = stream.contents;
      
      if (isCompressed) {
        try {
          rawBytes = await decompressFlate(rawBytes);
        } catch (err) {
          throw new Error('Failed to decompress PDF page content stream: ' + err.message);
        }
      }

      const contentText = new TextDecoder('latin1').decode(rawBytes);

      // Process Tj and TJ operators to find and sanitize target phrases
      let sanitizedText = contentText;
      for (const phrase of searchPhrases) {
        const literalRegex = new RegExp(`\\(([^)]*${phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[^)]*)\\)\\s*Tj`, 'gi');
        sanitizedText = sanitizedText.replace(literalRegex, (match, textGroup) => {
          const masked = '*'.repeat(textGroup.length);
          return `(${masked}) Tj`;
        });

        const bracketRegex = new RegExp(`\\[([^\\]]*${phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[^\\]]*)\\]\\s*TJ`, 'gi');
        sanitizedText = sanitizedText.replace(bracketRegex, (match, arrayGroup) => {
          const maskedArray = arrayGroup.replace(/\(([^)]+)\)/g, (m, g) => `(${'*'.repeat(g.length)})`);
          return `[${maskedArray}] TJ`;
        });
      }

      let newBytes = new TextEncoder().encode(sanitizedText);
      if (isCompressed) {
        try {
          newBytes = await compressFlate(newBytes);
        } catch (err) {
          throw new Error('Failed to compress sanitized PDF page content stream: ' + err.message);
        }
      }
      
      stream.contents = newBytes;
    }
  }

  return await pdfDoc.save({ useObjectStreams: false });
}
