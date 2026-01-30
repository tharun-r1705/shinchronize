const pdfParse = require('pdf-parse');

/**
 * Validate PDF magic bytes (%PDF-)
 * @param {Buffer} buffer - PDF file buffer
 * @returns {boolean}
 */
function isValidPDFBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
    return false;
  }
  // Check for PDF magic bytes: %PDF-
  const header = buffer.slice(0, 5).toString('ascii');
  return header === '%PDF-';
}

/**
 * Check if PDF might be password-protected
 * @param {Buffer} buffer - PDF file buffer
 * @returns {boolean}
 */
function isPasswordProtected(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return false;
  const content = buffer.toString('latin1');
  // Look for encryption indicators
  return content.includes('/Encrypt') && content.includes('/Filter');
}

/**
 * Extract text from PDF buffer with comprehensive error handling
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfBuffer) {
  // Validate input
  if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF buffer provided. Expected a Buffer object.');
  }

  // Check buffer size
  if (pdfBuffer.length === 0) {
    throw new Error('PDF buffer is empty. Cannot extract text from an empty file.');
  }

  // Check file size limit (10MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (pdfBuffer.length > MAX_SIZE) {
    throw new Error(`PDF file is too large (${(pdfBuffer.length / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is 10MB.`);
  }

  // Validate PDF magic bytes
  if (!isValidPDFBuffer(pdfBuffer)) {
    throw new Error('Invalid PDF file format. The file does not appear to be a valid PDF (missing %PDF- header).');
  }

  // Check for password protection
  if (isPasswordProtected(pdfBuffer)) {
    throw new Error('PDF is password-protected or encrypted. Please provide an unprotected PDF file.');
  }

  try {
    // Parse PDF
    const data = await pdfParse(pdfBuffer);
    
    // Check if text extraction was successful
    if (!data || !data.text) {
      throw new Error('PDF parsing succeeded but no text could be extracted. The PDF might be image-based or corrupted.');
    }

    const extractedText = data.text.trim();
    
    // Check if we got meaningful content
    if (extractedText.length === 0) {
      throw new Error('PDF contains no extractable text. The PDF might be image-based (scanned) or empty.');
    }

    // Warn if text is suspiciously short (might indicate issues)
    if (extractedText.length < 50) {
      console.warn('[PDF Extractor] Warning: Extracted text is very short (<50 chars). PDF might have extraction issues.');
    }

    return extractedText;

  } catch (error) {
    // Handle specific pdf-parse errors
    if (error.message.includes('PDF parsing succeeded')) {
      throw error; // Re-throw our custom errors
    }
    
    if (error.message.includes('Invalid PDF structure') || 
        error.message.includes('PDF header') ||
        error.message.includes('startxref')) {
      throw new Error('PDF file is corrupted or has an invalid structure. Please verify the file integrity.');
    }

    if (error.message.includes('password') || 
        error.message.includes('encrypted') ||
        error.message.includes('Encrypt')) {
      throw new Error('PDF is password-protected or encrypted. Please provide an unprotected PDF file.');
    }

    if (error.message.includes('stream') || error.message.includes('decode')) {
      throw new Error('PDF contains unsupported encoding or compression. The file might be corrupted or use unsupported features.');
    }

    // Generic error fallback
    throw new Error(`Failed to extract text from PDF: ${error.message}. Please ensure the file is a valid, unprotected PDF.`);
  }
}

module.exports = {
  extractTextFromPDF,
  isValidPDFBuffer,
  isPasswordProtected,
};
