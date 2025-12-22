export type ParsedItem = {
  name: string;
  price?: number | null;
  currency?: string | null;
  type?: string | null;
  confidence?: number;
  raw?: string;
};

const currencySymbols: Record<string,string> = {
  '₦': 'NGN',
  'NGN': 'NGN',
  '$': 'USD',
  'USD': 'USD',
  '£': 'GBP',
  'GBP': 'GBP',
};

function parsePrice(str: string): { price: number | null; currency: string | null } {
  if (!str) return { price: null, currency: null };
  // Remove non-numeric except dot and comma and currency symbols
  // Look for currency symbol
  const symbolMatch = str.match(/[₦$£]|NGN|USD|GBP/i);
  let currency: string | null = null;
  if (symbolMatch) {
    const sym = symbolMatch[0];
    currency = currencySymbols[sym] || currencySymbols[sym.toUpperCase()] || null;
  }

  // Try to find numeric sequence
  const numMatch = str.replace(/,/g, '').match(/(\d+\.?\d*)/);
  const price = numMatch ? Number(numMatch[1]) : null;
  return { price, currency };
}

export function parseText(text: string): ParsedItem[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: ParsedItem[] = [];

  for (const raw of lines) {
    // Attempt common patterns: "Name - ₦3,500" or "Name – ₦3,500" or "Name, 3500"
    const parts = raw.split(/[-–—\t]/).map(p => p.trim()).filter(Boolean);
    let name = parts[0] || raw;
    let priceCandidate = parts.length > 1 ? parts.slice(1).join(' ') : '';

    // If line ends with price only e.g., "Jollof Rice ₦3,500"
    if (!priceCandidate) {
      const tailMatch = raw.match(/(.*)\s+([₦$£]?\s?[0-9,]+(?:\.[0-9]+)?\s*(?:NGN|USD|GBP)?)$/i);
      if (tailMatch) {
        name = tailMatch[1].trim();
        priceCandidate = tailMatch[2].trim();
      }
    }

    const { price, currency } = parsePrice(priceCandidate);

    // If no price found and second part not price, try to find any number in whole line
    let finalPrice = price;
    let finalCurrency = currency;
    if (finalPrice === null) {
      const anyNum = raw.replace(/,/g, '').match(/([₦$£]?\s*\d+[\d\.]*)(?:\s*(NGN|USD|GBP))?/i);
      if (anyNum) {
        const p = anyNum[1].replace(/[₦$£\s]/g, '');
        finalPrice = Number(p);
        finalCurrency = (anyNum[2] || finalCurrency) ?? null;
      }
    }

    const confidence = finalPrice !== null ? 0.95 : 0.6;

    results.push({ name, price: finalPrice, currency: finalCurrency ?? null, type: 'menu_item', confidence, raw });
  }



  return results;
}
