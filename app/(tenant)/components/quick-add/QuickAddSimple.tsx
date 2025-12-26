'use client';

import React, { useState } from 'react';
import ParsedItemsReview from './ParsedItemsReview';
import Select from '../ui/Select';
import { toast } from 'react-hot-toast';

const INDUSTRIES = [
	{ value: 'products', label: 'Products' },
	{ value: 'menu', label: 'Menu' },
	{ value: 'services', label: 'Services' },
	{ value: 'offers', label: 'Offers' },
];

export default function QuickAddSimple({ initialIndustry }: { initialIndustry?: string } = {}) {
	const [industry, setIndustry] = useState<string>(initialIndustry || 'products');

	React.useEffect(() => {
		if (initialIndustry) setIndustry(initialIndustry);
	}, [initialIndustry]);
	const [text, setText] = useState('');
	const [parsing, setParsing] = useState(false);
	const [parsed, setParsed] = useState<any[] | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<string | null>(null);

	const handleParse = async () => {
		if (!text.trim()) return toast.error('Paste some text to parse');
		try {
			setParsing(true);
			const res = await fetch(`/api/tenant/${industry}/parse`, {
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

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
			{/* Hero Section */}
			<div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
					<div className="max-w-3xl mx-auto text-center">
						<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
							Quick Add — Paste or Upload
						</h1>
						<p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
							Paste product lines, menu items, or price lists and we will extract items for you automatically.
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				<div className="space-y-8">
					{/* Input Section */}
					<div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
						<div className="p-6 sm:p-8 space-y-6">
							<div>
								<label htmlFor="quick-add-text" className="block text-sm font-semibold text-gray-900 mb-2">
									Paste your text
								</label>
								<textarea
									id="quick-add-text"
									rows={10}
									value={text}
									onChange={(e) => setText(e.target.value)}
									placeholder={
										industry === 'menu' 
											? 'Jollof Rice – ₦3,500\nFried Rice – ₦4,000\nGrilled Chicken – ₦6,500\nPounded Yam – ₦2,500\nEgusi Soup – ₦4,500'
											: industry === 'services'
											? 'Website Design – ₦50,000\nSocial Media Management – ₦30,000\nSEO Consultation – ₦25,000\nContent Writing – ₦15,000'
											: 'T-shirt – 3500 NGN\nMug – 1500 NGN\nNotebook – 2500 NGN\nPen – 500 NGN'
									}
									className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none font-mono"
								/>
								<p className="mt-2 text-xs text-gray-500">
									Enter each item on a new line. Include name and price (e.g., &quot;Item Name – Price&quot; or &quot;Item Name - Price&quot;)
								</p>
							</div>

							<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-gray-100">
								<button 
									onClick={handleParse} 
									disabled={parsing || !text.trim()} 
									className="flex-1 sm:flex-none sm:min-w-[140px] rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:from-primary/95 hover:to-primary/85 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-primary/25 flex items-center justify-center gap-2"
								>
									{parsing ? (
										<>
											<svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											Parsing…
										</>
									) : (
										<>
											<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
											</svg>
											Parse
										</>
									)}
								</button>
								<label className="flex-1 sm:flex-none inline-flex items-center gap-2 justify-center rounded-xl border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 cursor-pointer hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
									<input type="file" accept=".csv,.txt,.docx" className="hidden" onChange={async (e) => {
					const file = e.target.files?.[0];
					if (!file) return;
					const form = new FormData();
					form.append('file', file);
					try {
						setParsing(true);
						const res = await fetch(`/api/tenant/${industry}/parse/file`, { method: 'POST', body: form });
						if (res.status === 202) {
							const body = await res.json();
							const jobId = body?.job_id;
							if (jobId) {
								setJobId(jobId);
								setJobStatus('pending');
								// poll job status
								let attempt = 0;
								let delay = 200; // start shorter for responsiveness
								const maxAttempts = 30;
								// eslint-disable-next-line no-constant-condition
								while (true) {
									const jobRes = await fetch(`/api/tenant/${industry}/parse/jobs/${jobId}`);
									if (!jobRes.ok) {
										toast.error('Failed to check job status');
										setJobStatus('error');
										break;
									}
									const jobData = await jobRes.json();
									setJobStatus(jobData.status);
									if (jobData.status === 'done') {
										setParsed(Array.isArray(jobData.result) ? jobData.result : []);
										break;
									}
									if (jobData.status === 'failed') {
										toast.error('File parse failed');
										break;
									}
									attempt += 1;
									if (attempt >= maxAttempts) {
										toast.error('Parsing timed out');
										setJobStatus('timeout');
										break;
									}
									// exponential backoff
									await new Promise((r) => setTimeout(r, delay + Math.floor(Math.random() * 200)));
									delay = Math.min(8000, delay * 2);
								}
								setJobId(null);
								setJobStatus(null);
							}
						} else {
							if (!res.ok) throw new Error('Upload failed');
							const data = await res.json();
							setParsed(Array.isArray(data) ? data : []);
						}
					} catch (err) {
						console.error(err);
						toast.error('Failed to upload file');
					} finally {
						setParsing(false);
					}
				}} />
									<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
									</svg>
									Choose File
								</label>
							</div>
						</div>
					</div>

					{/* Job Status */}
					{jobId && (
						<div className="rounded-xl border border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 shadow-sm">
							<div className="flex items-center gap-3">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-yellow-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-yellow-900">Parsing file in progress</p>
									<p className="text-xs text-yellow-700 mt-0.5">
										Job ID: <span className="font-mono">{jobId}</span> • Status: <strong className="capitalize">{jobStatus}</strong>
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Results Section */}
					{parsed ? (
						<ParsedItemsReview items={parsed} industry={industry} onSaved={() => setParsed(null)} />
					) : (
						<div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-12 sm:p-16 text-center">
							<div className="max-w-md mx-auto">
								<div className="mb-4 flex justify-center">
									<div className="rounded-full bg-gray-100 p-4">
										<svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
										</svg>
									</div>
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">No parsed items yet</h3>
								<p className="text-sm text-gray-600">
									Paste your text above or upload a file to extract items automatically. We&apos;ll parse product names, prices, and other details for you.
								</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
