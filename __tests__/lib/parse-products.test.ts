import { parseText } from '@/lib/parse-products';

describe('parseText', () => {
  it('parses name and NGN price with symbol', () => {
    const items = parseText('Jollof Rice - ₦3,500');
    expect(items.length).toBe(1);
    expect(items[0].name).toMatch(/Jollof Rice/i);
    expect(items[0].price).toBe(3500);
    expect(items[0].currency).toBe('NGN');
  });

  it('parses lines with missing price', () => {
    const items = parseText('Delivery available');
    expect(items.length).toBe(1);
    expect(items[0].price).toBeNull();
  });

  it('parses multiple lines', () => {
    const items = parseText('Jollof Rice - ₦3,500\nFried Rice - ₦4,000');
    expect(items.length).toBe(2);
    expect(items[1].price).toBe(4000);
  });
});