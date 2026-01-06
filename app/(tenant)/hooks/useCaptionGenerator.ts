import { useState } from 'react';
import { tenantApi, GenerateCaptionResponse, GenerateCaptionOptions } from '@/lib/api';

export function useCaptionGenerator() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async (options: GenerateCaptionOptions): Promise<GenerateCaptionResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await tenantApi.generateCaption(options);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to generate caption');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const generateFromKeywords = async (
        keywords: string,
        platform: string,
        mediaType: string,
        imageUrls?: string[]
    ) => {
        setLoading(true);
        setError(null);
        try {
            const res = await tenantApi.generateCaptionFromKeywords(keywords, platform, mediaType, imageUrls);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to generate from keywords');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const rephrase = async (caption: string, platform: string, mediaType: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await tenantApi.rephraseCaption(caption, platform, mediaType);
            return res;
        } catch (err: any) {
            setError(err.message || 'Failed to rephrase caption');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, generate, generateFromKeywords, rephrase };
}
