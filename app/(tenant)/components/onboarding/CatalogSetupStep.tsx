'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import ParsedItemsReview from '../quick-add/ParsedItemsReview';

type CatalogSetupStepProps = {
    onComplete: (step: 'catalog_setup', data: any) => void;
    onSkip?: () => void;
    onBack?: () => void;
    isSubmitting: boolean;
    industryId?: number;
    initialData?: any;
};

// Map industry IDs to types (products, menu, services)
// Since we don't have the full industry object here, we'll try to guess based on ID or default to 'products'
// In a resilient app, we might pass the full industry object or string from previous steps
// For now, let's allow the user to select the type if we can't be sure, or default to generic
const INDUSTRIES = [
    { value: 'products', label: 'Products' },
    { value: 'menu', label: 'Menu Items' },
    { value: 'services', label: 'Services' },
];

export function CatalogSetupStep({
    onComplete,
    onSkip,
    onBack,
    isSubmitting,
    industryId,
}: CatalogSetupStepProps) {
    // Default to products for E-commerce, but allow selection
    const [type, setType] = useState<string>('products');
    const [text, setText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState<any[] | null>(null);

    // Job state for file upload
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<string | null>(null);

    const handleParse = async () => {
        if (!text.trim()) return toast.error('Paste some text to parse');
        try {
            setParsing(true);
            const res = await fetch(`/api/tenant/${type}/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source: 'paste' }),
            });
            if (!res.ok) throw new Error('Parse failed');
            const data = await res.json();
            setParsed(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Parse error:', e);
            toast.error('Failed to parse input');
        } finally {
            setParsing(false);
        }
    };

    const handleItemsSaved = () => {
        // When items are saved from the review component
        onComplete('catalog_setup', { imported: true, type });
    };

    // If parsed data is available, show the review component
    // We reuse the existing ParsedItemsReview component
    if (parsed) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Review Items</h2>
                    <button
                        onClick={() => setParsed(null)}
                        className="text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                        Start Over
                    </button>
                </div>
                <ParsedItemsReview
                    items={parsed}
                    industry={type}
                    onSaved={handleItemsSaved}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="text-2xl">📦</div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                            Quick Add: Paste your offerings
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                            Paste your list of products, menu items, or services. We&apos;ll automatically add them to your workspace.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                    What are you adding?
                </label>
                <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                        <button
                            key={ind.value}
                            type="button"
                            onClick={() => setType(ind.value)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${type === ind.value
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {ind.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="quick-add-text" className="block text-sm font-semibold text-gray-900 mb-2">
                    Paste your text
                </label>
                <textarea
                    id="quick-add-text"
                    rows={8}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                        type === 'menu'
                            ? 'Jollof Rice – ₦3,500\nFried Rice – ₦4,000\nGrilled Chicken – ₦6,500'
                            : type === 'services'
                                ? 'Website Design – ₦50,000\nSEO Consultation – ₦25,000'
                                : 'T-shirt – 3500 NGN\nMug – 1500 NGN\nNotebook – 2500 NGN'
                    }
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none font-mono"
                />
                <p className="mt-2 text-xs text-gray-500">
                    Or upload a file (CSV, TXT, PDF) to extract items.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleParse}
                    disabled={parsing || !text.trim()}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {parsing ? (
                        <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Parsing...
                        </>
                    ) : (
                        <>
                            Parse Items
                        </>
                    )}
                </button>
                <label className="flex-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
                    <input type="file" accept=".csv,.txt,.docx,.pdf" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const form = new FormData();
                        form.append('file', file);
                        try {
                            setParsing(true);
                            const res = await fetch(`/api/tenant/${type}/parse/file`, { method: 'POST', body: form });

                            // Handle async processing (202 Accepted)
                            if (res.status === 202) {
                                const body = await res.json();
                                const jId = body?.job_id;
                                if (jId) {
                                    setJobId(jId);
                                    setJobStatus('pending');
                                    toast.success('File upload started. Processing...');

                                    // Poll for status
                                    let attempt = 0;
                                    const maxAttempts = 30;

                                    while (true) {
                                        await new Promise(r => setTimeout(r, 1000));
                                        const jobRes = await fetch(`/api/tenant/${type}/parse/jobs/${jId}`);
                                        if (!jobRes.ok) break;
                                        const jobData = await jobRes.json();
                                        setJobStatus(jobData.status);

                                        if (jobData.status === 'done') {
                                            setParsed(Array.isArray(jobData.result) ? jobData.result : []);
                                            setJobId(null);
                                            toast.success('File parsed successfully!');
                                            break;
                                        }
                                        if (jobData.status === 'failed') {
                                            toast.error('File parsing failed.');
                                            setJobId(null);
                                            break;
                                        }
                                        attempt++;
                                        if (attempt > maxAttempts) {
                                            toast.error('Parsing timed out.');
                                            setJobId(null);
                                            break;
                                        }
                                    }
                                }
                            } else if (res.ok) {
                                const data = await res.json();
                                setParsed(Array.isArray(data) ? data : []);
                                toast.success('File parsed successfully!');
                            } else {
                                throw new Error('Upload failed');
                            }
                        } catch (err) {
                            console.error(err);
                            toast.error('Failed to upload file');
                        } finally {
                            setParsing(false);
                        }
                    }} />
                    Upload File
                </label>
            </div>

            {jobId && (
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                        <p className="text-sm text-blue-800">Processing file... ({jobStatus})</p>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {onSkip && (
                        <button
                            type="button"
                            onClick={onSkip}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
                        >
                            Skip for now
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
