import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickAddSimple from '@/app/(tenant)/components/quick-add/QuickAddSimple';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const originalFetch = global.fetch;

describe('QuickAdd initialIndustry prop', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  };

  it('uses initialIndustry when provided and posts to correct parse endpoint', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [{ name: 'Fried Rice', price: 4000 }] });

    renderWithQuery(<QuickAddSimple initialIndustry="menu" />);

    const textarea = screen.getByLabelText(/Paste your text/i);
    await act(async () => {
      await userEvent.type(textarea, 'Fried Rice - ₦4,000');
    });

    const parseBtn = screen.getByRole('button', { name: /Parse/i });
    await act(async () => {
      await userEvent.click(parseBtn);
    });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.some((c: any[]) => String(c[0]).includes('/api/tenant/menu/parse'))).toBeTruthy();
    });
  });
});
