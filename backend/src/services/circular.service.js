const mammoth = require('mammoth');
const path = require('path');

/**
 * Parses a .docx file using mammoth and returns HTML string.
 * @param {string} filePath - absolute path to the uploaded .docx file
 * @returns {Promise<string>} HTML content
 */
const parseDocxToHtml = async (filePath) => {
  const result = await mammoth.convertToHtml({ path: filePath });
  if (result.messages && result.messages.length > 0) {
    result.messages.forEach((m) => {
      if (m.type === 'warning') console.warn('mammoth warning:', m.message);
    });
  }
  return result.value;
};

/**
 * Returns true if the file is a Word document based on mimetype or extension.
 */
const isWordDocument = (file) => {
  const wordMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  return wordMimes.includes(file.mimetype) || ext === '.docx' || ext === '.doc';
};

module.exports = { parseDocxToHtml, isWordDocument };
