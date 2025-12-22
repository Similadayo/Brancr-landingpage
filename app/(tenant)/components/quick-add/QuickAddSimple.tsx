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
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Quick Add — Paste or Upload</h1>
					<p className="mt-1 text-sm text-gray-600">Paste product lines, menu items, or price lists and we will extract items for you.</p>
				</div>
				<div className="w-48">
					<label className="block text-xs text-gray-500">Add to</label>
					<Select value={industry} onChange={(v) => setIndustry(String(v))} options={INDUSTRIES} searchable={false} />
				</div>
			</div>

			<div>
				<label htmlFor="quick-add-text" className="block text-sm font-medium text-gray-700">Paste your text</label>
				<textarea
					id="quick-add-text"
					rows={8}
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder={industry === 'menu' ? 'Jollof Rice – ₦3,500\nFried Rice – ₦4,000\nGrilled Chicken – ₦6,500' : 'T-shirt – 3500 NGN\nMug – 1500 NGN'}
					className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<div className="flex items-center gap-3">
				<button onClick={handleParse} disabled={parsing} className="rounded-md bg-primary px-4 py-2 text-white font-semibold">
					{parsing ? 'Parsing…' : 'Parse'}
				</button>
				<input type="file" accept=".csv,.txt,.docx" onChange={async (e) => {
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
			</div>

			<div>
				{jobId && (
					<div className="mb-4 rounded-md border border-gray-200 bg-yellow-50 p-3 text-sm text-gray-800">
						Parsing file (job: <span className="font-mono">{jobId}</span>) — status: <strong>{jobStatus}</strong>
					</div>
				)}
				{parsed ? (
					<ParsedItemsReview items={parsed} industry={industry} onSaved={() => setParsed(null)} />
				) : (
					<div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
						<p className="text-sm text-gray-600">No parsed items yet. Paste text or upload a small file to begin.</p>
					</div>
				)}
			</div>
		</div>
	);
}
