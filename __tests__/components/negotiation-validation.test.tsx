import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ServiceForm from '@/app/(tenant)/components/services/ServiceForm';
import { tenantApi, ApiError } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    createService: jest.fn(),
    updateService: jest.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(message: string, status: number, body: any) {
      super(message);
      (this as any).status = status;
      (this as any).body = body;
    }
  },
}));

describe('Negotiation validation in ServiceForm', () => {
  beforeEach(() => {
    (tenantApi.createService as jest.Mock).mockReset();
    (tenantApi.updateService as jest.Mock).mockReset();
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  };

  it('shows min/max when range selected and disables submit when empty', async () => {
    renderWithQuery(<ServiceForm />);

    // Open negotiation select and choose 'Allow negotiation within a range'
    const selectButton = screen.getByRole('button', { name: /Use tenant default/i });
    await act(async () => {
      await userEvent.click(selectButton);
    });
    const rangeOption = await screen.findByRole('button', { name: /Allow negotiation within a range/i });
    await act(async () => {
      await userEvent.click(rangeOption);
    });

    // Min/Max inputs should be visible
    expect(screen.getByLabelText(/Min Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Price/i)).toBeInTheDocument();

    // Submit should be disabled because validation errors exist
    const submit = screen.getByRole('button', { name: /Create Service|Update Service/i });
    expect(submit).toBeDisabled();

    // Fill invalid values: min > max
    const min = screen.getByLabelText(/Min Price/i);
    const max = screen.getByLabelText(/Max Price/i);
    await act(async () => {
      await userEvent.type(min, '200');
      await userEvent.type(max, '100');
    });

    // Inline error appears
    expect(await screen.findByText(/Min must be less than or equal to Max/i)).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('shows server field error inline when API returns field error', async () => {
    // Mock createService to throw ApiError with field error
    (tenantApi.createService as jest.Mock).mockRejectedValue(new (ApiError as any)('Bad request', 400, { field: 'negotiation_min_price', error: 'Minimum is too low' }));

    renderWithQuery(<ServiceForm />);

    // Select range and fill valid min/max
    const selectButton = screen.getByRole('button', { name: /Use tenant default/i });
    await act(async () => {
      await userEvent.click(selectButton);
    });
    const rangeOption = await screen.findByRole('button', { name: /Allow negotiation within a range/i });
    await act(async () => {
      await userEvent.click(rangeOption);
    });

    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Min Price/i), '50');
      await userEvent.type(screen.getByLabelText(/Max Price/i), '100');
    });

    // Submit — trigger form submit directly (button may still be disabled due to client-side validation)
    const submit = screen.getByRole('button', { name: /Create Service|Update Service/i });
    const form = submit?.closest('form') as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    // Server-side field error appears inline
    expect(await screen.findByText(/Minimum is too low/i)).toBeInTheDocument();
  });

  it('clears server-side negotiation error when user corrects inputs', async () => {
    (tenantApi.createService as jest.Mock).mockRejectedValue(new (ApiError as any)('Bad request', 400, { field: 'negotiation_min_price', error: 'Minimum is too low' }));

    renderWithQuery(<ServiceForm />);

    // Select range and set initial values
    const selectButton = screen.getByRole('button', { name: /Use tenant default/i });
    await act(async () => {
      await userEvent.click(selectButton);
    });
    const rangeOption = await screen.findByRole('button', { name: /Allow negotiation within a range/i });
    await act(async () => {
      await userEvent.click(rangeOption);
    });

    const min = screen.getByLabelText(/Min Price/i);
    const max = screen.getByLabelText(/Max Price/i);

    await act(async () => {
      await userEvent.type(min, '10');
      await userEvent.type(max, '100');
    });

    // Submit to trigger server-side field error
    const submit = screen.getByRole('button', { name: /Create Service|Update Service/i });
    const form = submit?.closest('form') as HTMLFormElement;
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(await screen.findByText(/Minimum is too low/i)).toBeInTheDocument();

    // User corrects the min value - the client validation should clear the previous server error
    await act(async () => {
      await userEvent.clear(min);
      await userEvent.type(min, '50');
    });

    await waitFor(() => {
      expect(screen.queryByText(/Minimum is too low/i)).not.toBeInTheDocument();
    });

    // With no validation errors the submit button should be enabled
    expect(screen.getByRole('button', { name: /Create Service|Update Service/i })).not.toBeDisabled();
  });
});