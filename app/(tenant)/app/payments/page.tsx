"use client";

import { useMemo, useState } from "react";
import { usePayments, useVerifyPayment, useDisputePayment, type Payment } from "../../hooks/usePayments";
import { MagnifyingGlassIcon, FunnelIcon, CreditCardIcon, XIcon } from "../../components/icons";
import { ReceiptSection } from "../../components/ReceiptSection";
import Select from "../../components/ui/Select";

export default function PaymentsPage() {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
	const [verificationFilter, setVerificationFilter] = useState<string | undefined>(undefined);
	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [showVerifyModal, setShowVerifyModal] = useState(false);
	const [showDisputeModal, setShowDisputeModal] = useState(false);
	const [verifyNotes, setVerifyNotes] = useState("");
	const [transactionId, setTransactionId] = useState("");
	const [disputeReason, setDisputeReason] = useState("");

	const { data: paymentsData, isLoading, error } = usePayments({
		status: statusFilter,
		verification_status: verificationFilter,
		limit: 50,
	});

	const verifyMutation = useVerifyPayment();
	const disputeMutation = useDisputePayment();

	const payments = paymentsData?.payments || [];
	const count = paymentsData?.count || 0;

	const filteredPayments = useMemo(() => {
		if (!query) return payments;
		const lowerQuery = query.toLowerCase();
		return payments.filter(
			(payment) =>
				payment.payment_reference.toLowerCase().includes(lowerQuery) ||
				payment.order_number.toLowerCase().includes(lowerQuery) ||
				payment.customer_name.toLowerCase().includes(lowerQuery)
		);
	}, [payments, query]);

	const getStatusColor = (status: Payment["status"]) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-700";
			case "verified":
				return "bg-green-100 text-green-700";
			case "confirmed":
				return "bg-blue-100 text-blue-700";
			case "disputed":
			case "failed":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const getVerificationStatusColor = (status: Payment["verification_status"]) => {
		switch (status) {
			case "pending":
				return "bg-yellow-100 text-yellow-700";
			case "verified":
				return "bg-green-100 text-green-700";
			case "disputed":
				return "bg-red-100 text-red-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const statusTabs = [
		{ key: undefined, label: "All", count },
		{ key: "pending", label: "Pending", count: payments.filter((p) => p.status === "pending").length },
		{ key: "verified", label: "Verified", count: payments.filter((p) => p.status === "verified").length },
		{ key: "confirmed", label: "Confirmed", count: payments.filter((p) => p.status === "confirmed").length },
		{ key: "disputed", label: "Disputed", count: payments.filter((p) => p.status === "disputed").length },
		{ key: "failed", label: "Failed", count: payments.filter((p) => p.status === "failed").length },
	] as const;

	const activeStatusKey = (statusFilter || undefined) as (typeof statusTabs)[number]["key"];

	const verificationTabs = [
		{ key: undefined, label: "All", count },
		{ key: "pending", label: "Pending", count: payments.filter((p) => p.verification_status === "pending").length },
		{ key: "verified", label: "Verified", count: payments.filter((p) => p.verification_status === "verified").length },
		{ key: "disputed", label: "Disputed", count: payments.filter((p) => p.verification_status === "disputed").length },
	] as const;

	const activeVerificationKey = (verificationFilter || undefined) as (typeof verificationTabs)[number]["key"];

	const handleVerify = async () => {
		if (!selectedPayment) return;
		try {
			await verifyMutation.mutateAsync({
				paymentId: selectedPayment.id,
				orderId: selectedPayment.order_id,
				payload: {
					transaction_id: transactionId || undefined,
					notes: verifyNotes || undefined,
				},
			});
			setShowVerifyModal(false);
			setVerifyNotes("");
			setTransactionId("");
			setSelectedPayment(null);
		} catch {
			// handled by mutation toast
		}
	};

	const handleDispute = async () => {
		if (!selectedPayment) return;
		try {
			await disputeMutation.mutateAsync({
				paymentId: selectedPayment.id,
				payload: {
					reason: disputeReason || undefined,
					notes: disputeReason || undefined,
				},
			});
			setShowDisputeModal(false);
			setDisputeReason("");
			setSelectedPayment(null);
		} catch {
			// handled by mutation toast
		}
	};


	return (
		<div className="space-y-4 sm:space-y-6">
			<header className="flex flex-col gap-3 sm:gap-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
							<CreditCardIcon className="h-5 w-5 sm:h-6 sm:w-6" />
						</div>
						<div className="min-w-0 flex-1">
							<h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">Payments</h1>
							<p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm">Verify and manage customer payments</p>
						</div>
					</div>

					<div className="relative w-full sm:max-w-sm">
						<MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:h-5 sm:w-5" />
						<input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search payments..."
							className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:pl-10"
						/>
					</div>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
				<div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
					<div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-blue-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
					<div className="relative">
						<p className="text-xs text-gray-600 sm:text-sm">Total Payments</p>
						<p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{count}</p>
					</div>
				</div>
				<div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
					<div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-yellow-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
					<div className="relative">
						<p className="text-xs text-gray-600 sm:text-sm">Pending Verification</p>
						<p className="mt-1 text-xl font-bold text-yellow-600 sm:text-2xl">
							{payments.filter((p) => p.verification_status === "pending").length}
						</p>
					</div>
				</div>
				<div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-primary/30 hover:shadow-md sm:p-4">
					<div className="absolute right-0 top-0 h-12 w-12 -translate-y-3 translate-x-3 rounded-full bg-green-50 transition-transform group-hover:scale-150 sm:h-16 sm:w-16 sm:-translate-y-4 sm:translate-x-4" />
					<div className="relative">
						<p className="text-xs text-gray-600 sm:text-sm">Verified</p>
						<p className="mt-1 text-xl font-bold text-green-600 sm:text-2xl">
							{payments.filter((p) => p.verification_status === "verified").length}
						</p>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 overflow-x-auto pb-1">
						{statusTabs.map((tab) => {
							const active = tab.key === activeStatusKey;
							return (
								<button
									key={String(tab.key ?? "all")}
									onClick={() => setStatusFilter(tab.key ?? undefined)}
									className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.98] sm:text-sm ${
										active
											? "border-primary/20 bg-primary text-white"
											: "border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:text-primary"
									}`}
								>
									<span>{tab.label}</span>
									<span className={`rounded-full px-2 py-0.5 text-[10px] font-bold sm:text-xs ${active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"}`}>
										{tab.count}
									</span>
								</button>
							);
						})}
					</div>

					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<FunnelIcon className="h-4 w-4 shrink-0 text-gray-400" />
							<div className="min-w-[220px]">
								<Select
									value={(verificationFilter || "") as any}
									onChange={(value) => setVerificationFilter(value ? String(value) : undefined)}
									options={[
										{ value: "", label: "All Verification" },
										{ value: "pending", label: "Pending" },
										{ value: "verified", label: "Verified" },
										{ value: "disputed", label: "Disputed" },
									]}
									searchable={false}
								/>
							</div>
						</div>

						<button
							onClick={() => {
							setStatusFilter(undefined);
							setVerificationFilter(undefined);
							setQuery("");
						}}
							className="self-start rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 transition hover:border-primary hover:text-primary active:scale-95 sm:self-auto"
						>
							Clear
						</button>
					</div>
				</div>
			</div>

			{isLoading ? (
				<div className="space-y-4">
					<div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
						))}
					</div>
				</div>
			) : error ? (
				<div className="rounded-xl border-2 border-rose-200 bg-rose-50 p-8 text-center">
					<XIcon className="mx-auto h-12 w-12 text-rose-400" />
					<p className="mt-3 text-sm font-semibold text-rose-900">Failed to load payments</p>
				</div>
			) : filteredPayments.length === 0 ? (
				<div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center sm:p-16">
					<CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 sm:h-16 sm:w-16" />
					<p className="mt-4 text-base font-semibold text-gray-900 sm:text-lg">No payments found</p>
					<p className="mt-2 text-xs text-gray-600 sm:text-sm">Payments will appear here when customers make payments.</p>
				</div>
			) : (
				<div className="rounded-xl border border-gray-200 bg-white shadow-sm">
					<div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
						<div className="flex items-center gap-2">
							<p className="text-sm font-semibold text-gray-900">Payments</p>
							<span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{count}</span>
						</div>
					</div>

					{/* Table header (desktop) */}
					<div className="hidden grid-cols-12 gap-3 border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500 sm:grid">
						<div className="col-span-3">Order</div>
						<div className="col-span-3">Customer</div>
						<div className="col-span-3">Payment Ref</div>
						<div className="col-span-2 text-right">Amount</div>
						<div className="col-span-1 text-right">Action</div>
					</div>

					<div className="divide-y divide-gray-100">
						{filteredPayments.map((payment) => {
							const canAct = payment.verification_status === "pending";
							const showReceiptActions = Boolean(payment.receipt_url) || !["pending", "disputed", "failed"].includes(payment.status);
							return (
								<div key={payment.id} className="px-4 py-3">
									{/* Mobile */}
									<div className="space-y-2 sm:hidden">
										<div className="flex flex-wrap items-center gap-2">
											<p className="break-words text-sm font-semibold text-gray-900">{payment.order_number}</p>
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(payment.status)}`}>{payment.status}</span>
											<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getVerificationStatusColor(payment.verification_status)}`}>{payment.verification_status}</span>
										</div>
										<p className="text-xs text-gray-600">Customer: <span className="break-words font-medium">{payment.customer_name}</span></p>
										<p className="text-xs text-gray-600">Ref: <span className="break-all font-mono font-medium">{payment.payment_reference}</span></p>
										{payment.verified_at && (
											<p className="text-xs text-gray-500">Verified: {new Date(payment.verified_at).toLocaleString()}</p>
										)}
										<div className="flex flex-col gap-2">
											<p className="text-base font-bold text-gray-900">{payment.currency} {payment.amount.toLocaleString()}</p>
											{canAct ? (
												<div className="flex flex-wrap gap-2">
													<button
														onClick={() => {
															setSelectedPayment(payment);
															setShowVerifyModal(true);
														}}
													className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-95"
												>
													Verify
												</button>
												<button
													onClick={() => {
														setSelectedPayment(payment);
														setShowDisputeModal(true);
													}}
													className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
												>
													Dispute
												</button>
											</div>
										) : (
											<span className="text-xs font-semibold text-gray-400">—</span>
										)}
										</div>
										{showReceiptActions && (
											<div className="flex justify-end">
												<ReceiptSection
													paymentId={payment.id}
													status={payment.status}
													receiptId={payment.receipt_id}
													receiptUrl={payment.receipt_url}
												/>
											</div>
										)}
									</div>

									{/* Desktop */}
									<div className="hidden grid-cols-12 items-start gap-3 sm:grid">
										<div className="col-span-3 min-w-0">
											<div className="flex items-center gap-2">
												<p className="truncate text-sm font-semibold text-gray-900">{payment.order_number}</p>
												<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(payment.status)}`}>{payment.status}</span>
												<span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getVerificationStatusColor(payment.verification_status)}`}>{payment.verification_status}</span>
											</div>
											<p className="mt-0.5 text-xs text-gray-500">{new Date(payment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
										</div>

										<div className="col-span-3 min-w-0">
											<p className="truncate text-sm font-medium text-gray-900">{payment.customer_name}</p>
											{payment.customer_phone && <p className="mt-0.5 text-xs text-gray-500">{payment.customer_phone}</p>}
											{payment.verified_at && <p className="mt-0.5 text-xs text-gray-400">Verified: {new Date(payment.verified_at).toLocaleString()}</p>}
										</div>

										<div className="col-span-3 min-w-0">
											<p className="truncate font-mono text-xs font-semibold text-gray-900">{payment.payment_reference}</p>
											{payment.transaction_id && <p className="mt-0.5 truncate font-mono text-xs text-gray-500">Txn: {payment.transaction_id}</p>}
										</div>

										<div className="col-span-2 text-right">
											<p className="text-sm font-semibold text-gray-900">{payment.currency} {payment.amount.toLocaleString()}</p>
										</div>

										<div className="col-span-1 flex justify-end">
											<div className="flex flex-col items-end gap-2">
												{canAct ? (
													<>
														<button
															onClick={() => {
																setSelectedPayment(payment);
																setShowVerifyModal(true);
															}}
														className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 active:scale-95"
													>
														Verify
													</button>
													<button
														onClick={() => {
															setSelectedPayment(payment);
															setShowDisputeModal(true);
														}}
														className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
													>
														Dispute
													</button>
												</>
												) : (
													<span className="text-xs font-semibold text-gray-400">—</span>
												)}

												{showReceiptActions && (
													<div className="w-full">
														<ReceiptSection
															paymentId={payment.id}
															status={payment.status}
															receiptId={payment.receipt_id}
															receiptUrl={payment.receipt_url}
														/>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{showVerifyModal && selectedPayment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-gray-900 sm:text-lg">Verify Payment</h2>
							<button
								type="button"
								onClick={() => {
									setShowVerifyModal(false);
									setSelectedPayment(null);
									setVerifyNotes("");
									setTransactionId("");
								}}
								className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
								aria-label="Close modal"
							>
								<XIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="rounded-lg bg-gray-50 p-4">
								<p className="text-sm text-gray-600">Payment Reference</p>
								<p className="mt-1 font-mono text-sm font-semibold text-gray-900">{selectedPayment.payment_reference}</p>
								<p className="mt-2 text-sm text-gray-600">Amount</p>
								<p className="mt-1 text-lg font-bold text-gray-900">
									{selectedPayment.currency} {selectedPayment.amount.toLocaleString()}
								</p>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700">Transaction ID (Optional)</label>
								<input
									type="text"
									value={transactionId}
									onChange={(e) => setTransactionId(e.target.value)}
									placeholder="Bank transaction ID, mobile money reference, etc."
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700">Notes (Optional)</label>
								<textarea
									value={verifyNotes}
									onChange={(e) => setVerifyNotes(e.target.value)}
									rows={3}
									placeholder="Additional verification notes..."
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
								<button
									type="button"
									onClick={() => {
										setShowVerifyModal(false);
										setSelectedPayment(null);
										setVerifyNotes("");
										setTransactionId("");
									}}
									className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
								>
									Cancel
								</button>
								<button
									onClick={handleVerify}
									disabled={verifyMutation.isPending}
									className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95 disabled:opacity-50 sm:shadow-md"
								>
									{verifyMutation.isPending ? "Verifying..." : "Verify Payment"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showDisputeModal && selectedPayment && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-xl sm:p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-base font-semibold text-gray-900 sm:text-lg">Dispute Payment</h2>
							<button
								type="button"
								onClick={() => {
									setShowDisputeModal(false);
									setSelectedPayment(null);
									setDisputeReason("");
								}}
								className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 active:scale-95"
								aria-label="Close modal"
							>
								<XIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="rounded-lg bg-red-50 p-4">
								<p className="text-sm font-semibold text-red-900">Warning</p>
								<p className="mt-1 text-sm text-red-700">Marking this payment as disputed will require manual review. Please provide a reason.</p>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700">Reason for Dispute *</label>
								<textarea
									required
									value={disputeReason}
									onChange={(e) => setDisputeReason(e.target.value)}
									rows={4}
									placeholder="Explain why this payment is being disputed..."
									className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
								/>
							</div>
							<div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
								<button
									type="button"
									onClick={() => {
										setShowDisputeModal(false);
										setSelectedPayment(null);
										setDisputeReason("");
									}}
									className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary active:scale-95"
								>
									Cancel
								</button>
								<button
									onClick={handleDispute}
									disabled={disputeMutation.isPending || !disputeReason.trim()}
									className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-50 sm:shadow-md"
								>
									{disputeMutation.isPending ? "Processing..." : "Mark as Disputed"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

