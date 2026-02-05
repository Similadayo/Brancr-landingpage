import { useState } from 'react';
import { tenantApi, ParsedItem } from '@/lib/api';

export function useProductParser() {
    const [loading, setLoading] = useState(false);
    const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const parse = async (rawInput: string, industry?: string): Promise<ParsedItem[]> => {
        setLoading(true);
        setError(null);
        try {
            const res = await tenantApi.parseProducts(rawInput, industry);
            setParsedItems(res);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to parse products');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const parseFile = async (file: File, industry?: string): Promise<ParsedItem[]> => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (industry) {
                formData.append('industry', industry);
            }
            const res = await tenantApi.parseProductsFile(formData);
            setParsedItems(res);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to parse file');
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, parsedItems, parse, parseFile, setParsedItems };
}
