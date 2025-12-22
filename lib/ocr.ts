export async function ocrFromFile(file: File): Promise<string> {
  const provider = process.env.OCR_PROVIDER || 'none';

  // If provider configured to 'google', try using @google-cloud/vision
  if (provider === 'google') {
      try {
      // Lazy require so we don't force dependency in environments without it
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();
      const buffer = Buffer.from(await (file as any).arrayBuffer());
      const [result] = await client.textDetection(buffer);
      const detections = result.textAnnotations;
      return detections && detections[0] ? detections[0].description || '' : '';
    } catch (e) {
      console.error('Google Vision OCR failed:', e);
      // fall through to text fallback
    }
  }

    if (provider === 'tesseract') {
    try {
      const Tesseract = require('tesseract.js');
      const buffer = Buffer.from(await (file as any).arrayBuffer());
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return text || '';
    } catch (e) {
      console.error('Tesseract OCR failed:', e);
    }
  }

  // Default fallback: if the file is already text (tests), return its text, otherwise empty string
  try {
    const txt = await (file as any).text();
    if (txt) return txt;
    // Fallback: try arrayBuffer and decode
    try {
      const buf = Buffer.from(await (file as any).arrayBuffer());
      const s = buf.toString('utf8');
      return s || '';
    } catch (e) {
      return '';
    }
  } catch (e) {
    try {
      const buf = Buffer.from(await (file as any).arrayBuffer());
      return buf.toString('utf8') || '';
    } catch (err) {
      return '';
    }
  }
}

export default ocrFromFile;
