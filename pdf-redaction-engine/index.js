/**
 * @dottedice/pdf-redaction-engine
 * Client-side PDF content redaction utility.
 */

import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Redacts coordinate-based regions in a PDF by drawing solid boxes.
 * Note: Complete programmatic text extraction sanitization requires stripping underlying content streams.
 * 
 * @param {Uint8Array} pdfBytes - Original PDF bytes
 * @param {Array<Object>} redactions - List of areas to redact: { pageIndex, x, y, width, height, color }
 * @returns {Promise<Uint8Array>} Redacted PDF bytes
 */
export async function redactPdf(pdfBytes, redactions = []) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const area of redactions) {
    const {
      pageIndex = 0,
      x = 0,
      y = 0,
      width = 100,
      height = 20,
      color = { r: 0, g: 0, b: 0 } // Default blackbox
    } = area;

    if (pageIndex < 0 || pageIndex >= pages.length) {
      continue;
    }

    const page = pages[pageIndex];

    // Draw solid redaction rectangle over the text coordinates
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(color.r, color.g, color.b),
    });
  }

  // Remove original metadata info dictionary keys that might contain sensitive attributes
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setCreator('');
  pdfDoc.setKeywords([]);

  return await pdfDoc.save();
}
