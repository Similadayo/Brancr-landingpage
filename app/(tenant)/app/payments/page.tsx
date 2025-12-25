"use client";

import { useMemo, useState } from "react";
import { usePayments, useVerifyPayment, useDisputePayment, type Payment } from "../../hooks/usePayments";
import { MagnifyingGlassIcon, FunnelIcon, CreditCardIcon, XIcon, CheckCircleIcon, AlertIcon } from "../../components/icons";
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

	const payments = useMemo(() => paymentsData?.payments || [], [paymentsData?.payments]);
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

	const getStatusBadge = (status: Payment["status"]) => {
		switch (status) {
			case "pending":
				return "badge-warning";
			case "verified":
				return "badge-success";
			case "confirmed":
				return "badge-info";
			case "disputed":
			case "failed":
				return "badge-error";
			default:
				return "badge-gray";
		}
	};

	const getVerificationStatusBadge = (status: Payment["verification_status"]) => {
		switch (status) {
			case "pending":
				return "badge-warning";
			case "verified":
				return "badge-success";
			case "disputed":
				return "badge-error";
			default:
				return "badge-gray";
		}
	};

	// Unified filter options - combining status and verification into one filter
	const filterOptions = useMemo(() => [
		{ value: "", label: "All Payments", status: undefined, verification: undefined },
		{ value: "pending_verification", label: "Pending Verification", status: undefined, verification: "pending" },
		{ value: "verified", label: "Verified", status: "verified", verification: "verified" },
		{ value: "confirmed", label: "Confirmed", status: "confirmed", verification: undefined },
		{ value: "disputed", label: "Disputed", status: "disputed", verification: "disputed" },
		{ value: "failed", label: "Failed", status: "failed", verification: undefined },
	], []);

	const activeFilter = useMemo(() => {
		if (statusFilter && verificationFilter) {
			return filterOptions.find(opt => opt.status === statusFilter && opt.verification === verificationFilter)?.value || "";
		}
		if (statusFilter) {
			return filterOptions.find(opt => opt.status === statusFilter && !opt.verification)?.value || "";
		}
		if (verificationFilter) {
			return filterOptions.find(opt => !opt.status && opt.verification === verificationFilter)?.value || "";
		}
		return "";
	}, [statusFilter, verificationFilter, filterOptions]);

	const handleFilterChange = (value: string) => {
		const option = filterOptions.find(opt => opt.value === value);
		if (option) {
			setStatusFilter(option.status);
			setVerificationFilter(option.verification);
		}
	};

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

	const stats = useMemo(() => {
		return {
			total: count,
			pendingVerification: payments.filter((p) => p.verification_status === "pending").length,
			verified: payments.filter((p) => p.verification_status === "verified").length,
		};
	}, [count, payments]);

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Modern Hero Section */}
			<div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-6 shadow-xl dark:border-gray-700 dark:from-primary-dark dark:via-primary-dark/95 dark:to-primary-dark/90 sm:p-8 md:p-10">
				<div className="absolute inset-0 opacity-10">
					<div className="absolute inset-0" style={{
						backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
						backgroundSize: '40px 40px'
					}} />
				</div>
				<div className="relative z-10">
					<div className="flex items-center gap-3 mb-3">
						<CreditCardIcon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" />
						<h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">Payments</h1>
					</div>
					<p className="text-sm text-white/90 sm:text-base md:text-lg max-w-2xl">
						Verify and manage customer payments with ease
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-3">
				<div className="stat-card group">
					<div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-info-400/20 to-info-500/20 blur-2xl transition-transform group-hover:scale-150" />
					<div className="relative">
						<p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Total Payments</p>
						<p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{stats.total}</p>
					</div>
				</div>
				<div className="stat-card group">
					<div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-warning-400/20 to-warning-500/20 blur-2xl transition-transform group-hover:scale-150" />
					<div className="relative">
						<p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Pending Verification</p>
						<p className="mt-2 text-2xl font-bold text-warning-600 dark:text-warning-400 sm:text-3xl">{stats.pendingVerification}</p>
					</div>
				</div>
				<div className="stat-card group">
					<div className="absolute right-0 top-0 h-16 w-16 sm:h-20 sm:w-20 -translate-y-3 translate-x-3 sm:-translate-y-4 sm:translate-x-4 rounded-full bg-gradient-to-br from-success-400/20 to-success-500/20 blur-2xl transition-transform group-hover:scale-150" />
					<div className="relative">
						<p className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Verified</p>
						<p className="mt-2 text-2xl font-bold text-success-600 dark:text-success-400 sm:text-3xl">{stats.verified}</p>
					</div>
				</div>
			</div>

			{/* Modern Search and Filter Section */}
			<div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{/* Search */}
					<div className="relative flex-1 sm:max-w-md lg:max-w-lg">
						<MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
						<input
							type="search"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search by order number, customer name, or payment reference..."
							className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-accent dark:focus:bg-gray-600"
						/>
					</div>

					{/* Unified Filter */}
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="flex items-center gap-3">
							<FunnelIcon className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500" />
							<div className="flex-1 sm:flex-none sm:min-w-[200px]">
								<Select
									value={activeFilter}
									onChange={(value) => handleFilterChange(value as string)}
									options={filterOptions.map(opt => ({ value: opt.value, label: opt.label }))}
									searchable={false}
								/>
							</div>
						</div>
						{(query || statusFilter || verificationFilter) && (
							<button
								onClick={() => {
									setStatusFilter(undefined);
									setVerificationFilter(undefined);
									setQuery("");
								}}
								className="btn-ghost text-xs sm:text-sm w-full sm:w-auto"
							>
								Clear
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Payments Table */}
			{isLoading ? (
				<div className="space-y-4">
					<div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
					<div className="space-y-3">
						{[1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700" />
						))}
					</div>
				</div>
			) : error ? (
				<div className="card p-12 text-center">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900/30">
						<XIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
					</div>
					<p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load payments</p>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
				</div>
			) : filteredPayments.length === 0 ? (
				<div className="card p-12 text-center sm:p-16">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
						<CreditCardIcon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
					</div>
					<p className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No payments found</p>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						{query || statusFilter || verificationFilter
							? "Try adjusting your search or filters"
							: "Payments will appear here when customers make payments"}
					</p>
				</div>
			) : (
				<div className="card overflow-hidden p-0">
					<div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50 sm:px-6 sm:py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 sm:gap-3">
								<p className="text-xs font-semibold text-gray-900 dark:text-gray-100 sm:text-sm">Payment List</p>
								<span className="badge badge-gray text-[10px] sm:text-xs">{filteredPayments.length}</span>
							</div>
						</div>
					</div>

					{/* Desktop Table Header */}
					<div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400 md:grid lg:px-6">
						<div className="col-span-3">Order</div>
						<div className="col-span-3">Customer</div>
						<div className="col-span-3">Payment Reference</div>
						<div className="col-span-2 text-right">Amount</div>
						<div className="col-span-1 text-right">Actions</div>
					</div>

					<div className="divide-y divide-gray-100 dark:divide-gray-700">
						{filteredPayments.map((payment) => {
							const canAct = payment.verification_status === "pending";
							const showReceiptActions = Boolean(payment.receipt_url) || !["pending", "disputed", "failed"].includes(payment.status);
							return (
								<div key={payment.id} className="px-4 py-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30 sm:px-6">
									{/* Mobile View */}
									<div className="space-y-3 sm:hidden">
										<div className="flex flex-wrap items-center gap-2">
											<p className="text-base font-semibold text-gray-900 dark:text-gray-100">{payment.order_number}</p>
											<span className={`badge ${getStatusBadge(payment.status)}`}>{payment.status}</span>
											<span className={`badge ${getVerificationStatusBadge(payment.verification_status)}`}>
												{payment.verification_status}
											</span>
										</div>
										<div className="space-y-1.5">
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Customer: <span className="font-medium text-gray-900 dark:text-gray-100">{payment.customer_name}</span>
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-400">
												Ref: <span className="font-mono font-medium text-gray-900 dark:text-gray-100">{payment.payment_reference}</span>
											</p>
											{payment.verified_at && (
												<p className="text-xs text-gray-500 dark:text-gray-400">
													Verified: {new Date(payment.verified_at).toLocaleString()}
												</p>
											)}
										</div>
										<div className="flex items-center justify-between">
											<p className="text-lg font-bold text-gray-900 dark:text-gray-100">
												{payment.currency} {payment.amount.toLocaleString()}
											</p>
											{canAct && (
												<div className="flex gap-2">
													<button
														onClick={() => {
															setSelectedPayment(payment);
															setShowVerifyModal(true);
														}}
														className="btn-success text-xs"
													>
														Verify
													</button>
													<button
														onClick={() => {
															setSelectedPayment(payment);
															setShowDisputeModal(true);
														}}
														className="btn-danger text-xs"
													>
														Dispute
													</button>
												</div>
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

									{/* Desktop View */}
									<div className="hidden grid-cols-12 items-center gap-3 md:grid lg:gap-4">
										<div className="col-span-3 min-w-0">
											<div className="flex items-center gap-2">
												<p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{payment.order_number}</p>
												<span className={`badge ${getStatusBadge(payment.status)}`}>{payment.status}</span>
											</div>
											<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
												{new Date(payment.created_at).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
											</p>
										</div>

										<div className="col-span-3 min-w-0">
											<p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{payment.customer_name}</p>
											{payment.customer_phone && (
												<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{payment.customer_phone}</p>
											)}
											{payment.verified_at && (
												<p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
													Verified: {new Date(payment.verified_at).toLocaleString()}
												</p>
											)}
										</div>

										<div className="col-span-3 min-w-0">
											<p className="truncate font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
												{payment.payment_reference}
											</p>
											{payment.transaction_id && (
												<p className="mt-0.5 truncate font-mono text-xs text-gray-500 dark:text-gray-400">
													Txn: {payment.transaction_id}
												</p>
											)}
											<span className={`mt-1 inline-block badge ${getVerificationStatusBadge(payment.verification_status)}`}>
												{payment.verification_status}
											</span>
										</div>

										<div className="col-span-2 text-right">
											<p className="text-base font-bold text-gray-900 dark:text-gray-100">
												{payment.currency} {payment.amount.toLocaleString()}
											</p>
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
															className="btn-success text-xs"
														>
															Verify
														</button>
														<button
															onClick={() => {
																setSelectedPayment(payment);
																setShowDisputeModal(true);
															}}
															className="btn-danger text-xs"
														>
															Dispute
														</button>
													</>
												) : (
													<span className="text-xs font-medium text-gray-400 dark:text-gray-500">—</span>
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

			{/* Verify Modal */}
			{showVerifyModal && selectedPayment && (
				<div className="modal-overlay" onClick={() => {
					setShowVerifyModal(false);
					setSelectedPayment(null);
					setVerifyNotes("");
					setTransactionId("");
				}}>
					<div className="modal-content animate-scale-in w-full max-w-md mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 dark:bg-success-900/30">
									<CheckCircleIcon className="h-6 w-6 text-success-600 dark:text-success-400" />
								</div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verify Payment</h2>
							</div>
							<button
								type="button"
								onClick={() => {
									setShowVerifyModal(false);
									setSelectedPayment(null);
									setVerifyNotes("");
									setTransactionId("");
								}}
								className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
								aria-label="Close modal"
							>
								<XIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-5">
							<div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
								<p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Payment Reference</p>
								<p className="mt-1.5 font-mono text-base font-semibold text-gray-900 dark:text-gray-100">
									{selectedPayment.payment_reference}
								</p>
								<p className="mt-4 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Amount</p>
								<p className="mt-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">
									{selectedPayment.currency} {selectedPayment.amount.toLocaleString()}
								</p>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction ID (Optional)</label>
								<input
									type="text"
									value={transactionId}
									onChange={(e) => setTransactionId(e.target.value)}
									placeholder="Bank transaction ID, mobile money reference, etc."
									className="mt-2"
								/>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Notes (Optional)</label>
								<textarea
									value={verifyNotes}
									onChange={(e) => setVerifyNotes(e.target.value)}
									rows={3}
									placeholder="Additional verification notes..."
									className="mt-2"
								/>
							</div>
							<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={() => {
										setShowVerifyModal(false);
										setSelectedPayment(null);
										setVerifyNotes("");
										setTransactionId("");
									}}
									className="btn-secondary"
								>
									Cancel
								</button>
								<button onClick={handleVerify} disabled={verifyMutation.isPending} className="btn-success">
									{verifyMutation.isPending ? "Verifying..." : "Verify Payment"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Dispute Modal */}
			{showDisputeModal && selectedPayment && (
				<div className="modal-overlay" onClick={() => {
					setShowDisputeModal(false);
					setSelectedPayment(null);
					setDisputeReason("");
				}}>
					<div className="modal-content animate-scale-in w-full max-w-md mx-4 sm:mx-auto" onClick={(e) => e.stopPropagation()}>
						<div className="mb-6 flex items-center justify-between">
							<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-error-100 dark:bg-error-900/30">
								<AlertIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
							</div>
								<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dispute Payment</h2>
							</div>
							<button
								type="button"
								onClick={() => {
									setShowDisputeModal(false);
									setSelectedPayment(null);
									setDisputeReason("");
								}}
								className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
								aria-label="Close modal"
							>
								<XIcon className="h-5 w-5" />
							</button>
						</div>
						<div className="space-y-5">
							<div className="rounded-xl border border-error-200 bg-error-50 p-4 dark:border-error-800 dark:bg-error-900/20">
								<p className="text-sm font-semibold text-error-900 dark:text-error-100">Warning</p>
								<p className="mt-1.5 text-sm text-error-700 dark:text-error-300">
									Marking this payment as disputed will require manual review. Please provide a detailed reason.
								</p>
							</div>
							<div>
								<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
									Reason for Dispute <span className="text-error-600 dark:text-error-400">*</span>
								</label>
								<textarea
									required
									value={disputeReason}
									onChange={(e) => setDisputeReason(e.target.value)}
									rows={4}
									placeholder="Explain why this payment is being disputed..."
									className="mt-2"
								/>
							</div>
							<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
								<button
									type="button"
									onClick={() => {
										setShowDisputeModal(false);
										setSelectedPayment(null);
										setDisputeReason("");
									}}
									className="btn-secondary"
								>
									Cancel
								</button>
								<button
									onClick={handleDispute}
									disabled={disputeMutation.isPending || !disputeReason.trim()}
									className="btn-danger disabled:opacity-50"
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
