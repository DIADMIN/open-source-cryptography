/**
 * @dottedice/pdf-vector-sanitizer
 * PDF text stream vector sanitizer and secure redaction engine.
 */

import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';

/**
 * Sanitizes a PDF document by stripping or replacing underlying text characters 
 * inside the PDF page content streams to prevent copy-paste and text extraction leaks.
 * 
 * @param {Uint8Array} pdfBytes - Original PDF bytes
 * @param {Array<string>} searchPhrases - Text strings to strip out
 * @returns {Promise<Uint8Array>} Sanitized PDF bytes
 */
export async function sanitizePdfText(pdfBytes, searchPhrases = []) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    // 1. Get the page content stream(s)
    const contentsRef = page.node.get(PDFName.of('Contents'));
    if (!contentsRef) continue;

    // Resolve contents streams (could be a single stream or an array of streams)
    const streams = page.node.lookup(PDFName.of('Contents'));
    const streamList = streams instanceof Array ? streams : [streams];

    for (const stream of streamList) {
      if (!(stream instanceof PDFRawStream)) continue;

      // 2. Decode the raw PDF page content stream bytes to string
      const rawBytes = stream.contents;
      const contentText = new TextDecoder('latin1').decode(rawBytes);

      // 3. Process Tj and TJ operators to find and sanitize target phrases
      let sanitizedText = contentText;
      for (const phrase of searchPhrases) {
        // Build regexes to capture parenthesized strings in Tj or TJ operators
        // E.g. (sensitive data) Tj or [(sens) -10 (itive)] TJ
        // Simple case: literal parenthesis substitution
        const literalRegex = new RegExp(`\\(([^)]*${phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[^)]*)\\)\\s*Tj`, 'gi');
        
        sanitizedText = sanitizedText.replace(literalRegex, (match, textGroup) => {
          // Replace sensitive characters with asterisks
          const masked = '*'.repeat(textGroup.length);
          return `(${masked}) Tj`;
        });

        // Also clean up inside array TJ brackets
        const bracketRegex = new RegExp(`\\[([^\\]]*${phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}[^\\]]*)\\]\\s*TJ`, 'gi');
        sanitizedText = sanitizedText.replace(bracketRegex, (match, arrayGroup) => {
          // Mask parenthesized text blocks inside the array
          const maskedArray = arrayGroup.replace(/\(([^)]+)\)/g, (m, g) => `(${'*'.repeat(g.length)})`);
          return `[${maskedArray}] TJ`;
        });
      }

      // 4. Update the content stream with the sanitized text
      const newBytes = new TextEncoder().encode(sanitizedText);
      stream.contents = newBytes;
    }
  }

  // Save the sanitized document without object streams to ensure serialization is written
  return await pdfDoc.save({ useObjectStreams: false });
}
