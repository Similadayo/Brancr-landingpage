import { useState } from 'react';
import { tenantApi, ParsedItem } from '@/lib/api';

export function useProductParser() {
    const [loading, setLoading] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const parse = async (rawInput: string): Promise<ParsedItem[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await tenantApi.parseProducts(rawInput);
            setParsedItems(res);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to parse products');
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, parsedItems, parse, setParsedItems };
}
