const { PDFParse } = require('pdf-parse');

/**
 * Extract text from PDF buffer
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfBuffer) {
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF buffer provided');
  }

  const parser = new PDFParse({ data: pdfBuffer });
  
  try {
    const result = await parser.getText();
    return result.text || '';
  } catch (error) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  } finally {
    // Always call destroy() to free memory
    await parser.destroy();
  }
}

module.exports = {
  extractTextFromPDF,
};
