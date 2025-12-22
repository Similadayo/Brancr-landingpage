import ocrFromFile from '@/lib/ocr';

describe('ocrFromFile', () => {
  it('returns a string (may be empty) when no provider configured', async () => {
    const file = new File(['Hello world'], 'note.txt', { type: 'text/plain' });
    const txt = await ocrFromFile(file);
    expect(typeof txt).toBe('string');
  });
});