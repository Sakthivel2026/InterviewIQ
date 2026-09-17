import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';

export const extractTextFromFile = async (filePath: string, mimeType: string): Promise<string> => {
  const buffer = fs.readFileSync(filePath);

  if (mimeType.includes('pdf') || filePath.endsWith('.pdf')) {
    const pdfData = await pdfParse(buffer);
    return pdfData.text || '';
  }

  if (mimeType.includes('word') || mimeType.includes('document') || filePath.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // Text / fallback
  return buffer.toString('utf-8');
};
