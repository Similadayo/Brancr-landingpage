import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPayments = {
  payments: [
    {
      id: 1,
      order_id: 10,
      order_number: 'ORDER-10',
      payment_reference: 'PAY-1',
      amount: 5000,
      currency: 'NGN',
      status: 'pending',
      verification_status: 'pending',
      customer_name: 'Jane Doe',
      created_at: '2024-12-10T14:30:45Z',
    },
  ],
  count: 1,
  total: 1,
  limit: 20,
  offset: 0,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/app/payments',
}));

jest.mock('@/app/(tenant)/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: { business_profile: { name: 'Acme Biz' }, business_name: 'Acme Biz', name: 'Owner' } }),
}));

jest.mock('@/lib/api', () => {
  class ApiError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  return {
    ApiError,
    tenantApi: {
      payments: jest.fn(async () => mockPayments),
      payment: jest.fn(),
      verifyPayment: jest.fn(),
      disputePayment: jest.fn(),
    },
  };
});

function renderWithQueryClient(ui: React.ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('PaymentsPage', () => {
  it('renders payments heading and stats', async () => {
    const { default: PaymentsPage } = await import('@/app/(tenant)/app/payments/page');

    renderWithQueryClient(<PaymentsPage />);

    expect(screen.getAllByText('Payments')[0]).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Total Payments')).toBeTruthy());
    const matches = await screen.findAllByText('PAY-1');
    expect(matches.length).toBeGreaterThan(0);
  });
});
