import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PaymentsPage from '@/app/(tenant)/app/payments/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/app/payments',
}));

jest.mock('@/app/(tenant)/providers/TenantProvider', () => ({
  useTenant: () => ({ tenant: { business_profile: { name: 'Acme Biz' }, business_name: 'Acme Biz', name: 'Owner' } }),
}));

// Provide a simple global fetch mock to satisfy page data fetching
const mockStats = {
  stats: {
    total_payments: 1,
    pending_count: 1,
    verified_count: 0,
    confirmed_count: 0,
    failed_count: 0,
    disputed_count: 0,
    total_revenue: 1000,
    pending_revenue: 1000,
    verified_revenue: 0,
    this_month_revenue: 500,
    last_month_revenue: 400,
    today_payments: 1,
    today_revenue: 1000,
  },
  recent_payments: [],
};

const mockPayments = {
  payments: [
    {
      id: 1,
      order_id: 10,
      payment_reference: 'PAY-1',
      amount: 5000,
      currency: 'NGN',
      status: 'pending',
      verification_status: 'unverified',
      created_at: '2024-12-10T14:30:45Z',
    },
  ],
  count: 1,
  total: 1,
  limit: 20,
  offset: 0,
};

global.fetch = jest.fn((url: string) => {
  if (url.includes('/stats')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) } as Response);
  }
  if (url.includes('/payments') && !url.includes('/stats')) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPayments) } as Response);
  }
  return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
}) as unknown as typeof fetch;

describe('PaymentsPage', () => {
  it('renders payments heading and stats', async () => {
    render(<PaymentsPage />);

    expect(screen.getByText('Payments')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Total Payments')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('PAY-1')).toBeTruthy());
  });
});
