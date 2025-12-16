/**
 * PDF Parser Utility with Multiple Extraction Methods
 * Uses pdf-parse as primary, pdf2json as fallback
 */

let cachedParser = null;
let cachedPdf2Json = null;

// Method 1: pdf-parse
const getPdfParser = async () => {
  if (cachedParser) {
    return cachedParser;
  }

  try {
    console.log('[PDF Parser] Loading pdf-parse module...');
    const pdfParse = require('pdf-parse');

    let parser = null;
    if (typeof pdfParse === 'function') {
      parser = pdfParse;
    } else if (typeof pdfParse.default === 'function') {
      parser = pdfParse.default;
    } else {
      throw new Error('pdf-parse module does not export a function');
    }

    cachedParser = parser;
    console.log('[PDF Parser] pdf-parse loaded successfully');
    return cachedParser;
  } catch (error) {
    console.error('[PDF Parser] Failed to load pdf-parse:', error.message);
    return null;
  }
};

// Method 2: pdf2json (fallback)
const getPdf2JsonParser = async () => {
  if (cachedPdf2Json) {
    return cachedPdf2Json;
  }

  try {
    console.log('[PDF Parser] Loading pdf2json module...');
    const PDFParser = require('pdf2json');
    cachedPdf2Json = PDFParser;
    console.log('[PDF Parser] pdf2json loaded successfully');
    return cachedPdf2Json;
  } catch (error) {
    console.error('[PDF Parser] Failed to load pdf2json:', error.message);
    return null;
  }
};

// Method 1: Try pdf-parse
const parsePdfWithPdfParse = async (buffer) => {
  const parser = await getPdfParser();
  if (!parser) throw new Error('pdf-parse not available');

  console.log('[PDF Parser] Attempting extraction with pdf-parse...');
  const result = await parser(buffer);

  if (!result.text || result.text.trim().length === 0) {
    throw new Error('No text extracted by pdf-parse');
  }

  console.log('[PDF Parser] pdf-parse extracted', result.text.length, 'characters');
  return {
    text: result.text.trim(),
    pages: result.numpages,
    method: 'pdf-parse'
  };
};

// Method 2: Try pdf2json
const parsePdfWithPdf2Json = async (buffer) => {
  return new Promise((resolve, reject) => {
    const PDFParser = cachedPdf2Json || require('pdf2json');
    console.log('[PDF Parser] Attempting extraction with pdf2json...');

    const pdfParser = new PDFParser(null, true);

    pdfParser.on('pdfParser_dataError', (error) => {
      console.error('[PDF Parser] pdf2json error:', error.message);
      reject(new Error(`pdf2json failed: ${error.message}`));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        if (!pdfData || !pdfData.Pages || pdfData.Pages.length === 0) {
          reject(new Error('No pages found in PDF'));
          return;
        }

        // Extract text from pages
        let extractedText = '';
        pdfData.Pages.forEach((page) => {
          if (page.Texts) {
            page.Texts.forEach((textObj) => {
              if (textObj.R && textObj.R[0] && textObj.R[0].T) {
                const decodedText = decodeURIComponent(textObj.R[0].T);
                extractedText += decodedText + ' ';
              }
            });
            extractedText += '\n';
          }
        });

        if (!extractedText || extractedText.trim().length === 0) {
          reject(new Error('No text extracted by pdf2json'));
          return;
        }

        console.log('[PDF Parser] pdf2json extracted', extractedText.length, 'characters');
        resolve({
          text: extractedText.trim(),
          pages: pdfData.Pages.length,
          method: 'pdf2json'
        });
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
};

const parsePdfBuffer = async (buffer) => {
  if (!buffer) {
    throw new Error('No buffer provided');
  }

  if (!(buffer instanceof Buffer)) {
    throw new Error('Input must be a Buffer');
  }

  if (buffer.length === 0) {
    throw new Error('Buffer is empty');
  }

  console.log('[PDF Parser] Starting PDF extraction, buffer size:', buffer.length);

  // Try pdf-parse first (primary method)
  try {
    const result = await parsePdfWithPdfParse(buffer);
    console.log('[PDF Parser] Extraction successful using pdf-parse');
    return result;
  } catch (error1) {
    console.warn('[PDF Parser] pdf-parse failed:', error1.message);

    // Try pdf2json as fallback
    try {
      const result = await parsePdfWithPdf2Json(buffer);
      console.log('[PDF Parser] Extraction successful using pdf2json (fallback)');
      return result;
    } catch (error2) {
      console.error('[PDF Parser] pdf2json also failed:', error2.message);

      // If both fail, provide helpful error
      const errors = [
        `Primary method (pdf-parse): ${error1.message}`,
        `Fallback method (pdf2json): ${error2.message}`
      ];

      throw new Error(
        'Could not extract text from PDF. Tried 2 methods:\n' +
        errors.join('\n') +
        '\n\nPlease ensure your PDF contains text (not scanned/image-based) or use Paste Text instead.'
      );
    }
  }
};

module.exports = {
  parsePdfBuffer,
  getPdfParser,
};
