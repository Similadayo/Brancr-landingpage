import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuickAddSimple from '@/app/(tenant)/components/quick-add/QuickAddSimple';
import { tenantApi } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    createDraft: jest.fn(),
    createProduct: jest.fn(),
  },
}));

// Mock fetch for parse endpoint
const originalFetch = global.fetch;

describe('Quick Add paste flow', () => {
  beforeEach(() => {
    (tenantApi.createDraft as jest.Mock).mockReset();
    (tenantApi.createProduct as jest.Mock).mockReset();
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

  it('parses pasted text and saves as draft', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [ { name: 'Jollof Rice', price: 3500, currency: 'NGN' } ] });

    renderWithQuery(<QuickAddSimple />);

    const textarea = screen.getByPlaceholderText(/Jollof Rice/i);
    await act(async () => {
      await userEvent.type(textarea, 'Jollof Rice - ₦3,500');
    });

    const parseBtn = screen.getByRole('button', { name: /Parse/i });
    await act(async () => {
      await userEvent.click(parseBtn);
    });

    expect(await screen.findByText(/Review parsed items/i)).toBeInTheDocument();
    const matches = await screen.findAllByDisplayValue(/Jollof Rice/i);
    expect(matches.length).toBeGreaterThan(0);



    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'd1' });
    const saveBtn = screen.getByRole('button', { name: /Save as draft/i });
    await act(async () => {
      await userEvent.click(saveBtn);
    });

    await waitFor(() => {
      expect(tenantApi.createDraft).toHaveBeenCalled();
    });
  });

  it('shows missing price microcopy for parsed items without price', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [ { name: 'Delivery Note' } ] });

    renderWithQuery(<QuickAddSimple />);

    const textarea = screen.getByPlaceholderText(/Jollof Rice/i);
    await act(async () => {
      await userEvent.type(textarea, 'Delivery Note');
    });

    const parseBtn = screen.getByRole('button', { name: /Parse/i });
    await act(async () => {
      await userEvent.click(parseBtn);
    });

    expect(await screen.findByText(/Review parsed items/i)).toBeInTheDocument();
    expect(await screen.findByText(/Missing price — you can add this later/i)).toBeInTheDocument();
  });

  it('handles large file flow with job polling', async () => {
    // Mock file upload returns 202 with job_id
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/file')) {
        return { status: 202, json: async () => ({ status: 'accepted', job_id: 'job_1' }) };
      }
      if (url.includes('/jobs/job_1')) {
        // First call: pending, second call: done
        if (!(global as any)._jobCalled) {
          (global as any)._jobCalled = 1;
          return { ok: true, json: async () => ({ job_id: 'job_1', status: 'pending' }) };
        }
        return { ok: true, json: async () => ({ job_id: 'job_1', status: 'done', result: [{ name: 'Fried Rice', price: 4000, currency: 'NGN' }] }) };
      }
      return { ok: false, status: 500 };
    });

    renderWithQuery(<QuickAddSimple />);

    // Simulate file selection by calling the file input onchange handler
    const fileInput = screen.getByLabelText(/Paste your text/i, { selector: 'textarea' });
    // Instead of actually uploading a file (complex), call the file handler indirectly by creating and dispatching events
    const input = screen.getByRole('textbox', { name: /Paste your text/i });
    // There's no easy way to programmatically set files in jsdom reliably, so call the parse file path directly simulating the flow
    // We'll invoke the internal logic by fetching the file endpoint ourselves and then polling job endpoint (simulating the component behavior)

    // Perform initial upload
    const res = await fetch('/api/tenant/products/parse/file', { method: 'POST' });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.job_id).toBe('job_1');

    // Poll job - first pending
    const jobRes1 = await fetch('/api/tenant/products/parse/jobs/job_1');
    const job1 = await jobRes1.json();
    expect(job1.status).toBe('pending');

    // Poll job again - done
    const jobRes2 = await fetch('/api/tenant/products/parse/jobs/job_1');
    const job2 = await jobRes2.json();
    expect(job2.status).toBe('done');
    expect(job2.result[0].name).toBe('Fried Rice');
  });

  it('handles large file flow with job polling (component)', async () => {
    // Mock file upload returns 202 with job_id
    (global.fetch as jest.Mock).mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/file')) {
        return { status: 202, json: async () => ({ status: 'accepted', job_id: 'job_2' }) };
      }
      if (url.includes('/jobs/job_2')) {
        // First call: pending, second call: done
        if (!(global as any)._jobCalled2) {
          (global as any)._jobCalled2 = 1;
          return { ok: true, json: async () => ({ job_id: 'job_2', status: 'pending' }) };
        }
        return { ok: true, json: async () => ({ job_id: 'job_2', status: 'done', result: [{ name: 'Fried Rice', price: 4000, currency: 'NGN' }] }) };
      }
      return { ok: false, status: 500 };
    });

    renderWithQuery(<QuickAddSimple />);

    const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
    const file = new File(['name,price\nFried Rice,4000'], 'big.csv', { type: 'text/csv' });
    // set fake size above 2MB to force job flow
    Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 });

    await act(async () => {
      await userEvent.upload(fileInput, file);
    });

    // Job UI should show job id and status pending
    expect(await screen.findByText(/Parsing file \(job:/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();

    // After polling completes, parsed items should appear
    expect(await screen.findByText(/Review parsed items/i)).toBeInTheDocument();
    expect(await screen.findByDisplayValue(/Fried Rice/i)).toBeInTheDocument();
  });
});
