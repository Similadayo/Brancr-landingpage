import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParsedItemsReview from '@/app/(tenant)/components/quick-add/ParsedItemsReview';
import { tenantApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({ tenantApi: { createMenuItem: jest.fn() } }));

describe('ParsedItemsReview create menu items', () => {
  beforeEach(() => {
    (tenantApi.createMenuItem as jest.Mock).mockReset();
  });

  it('asks for confirmation and calls createMenuItem when confirmed', async () => {
    const items = [{ name: 'Jollof', price: 3500, description: 'Tasty' }];
    render(<ParsedItemsReview items={items as any} industry="menu" onSaved={() => {}} />);

    // Create button
    const createBtn = screen.getByRole('button', { name: /Create products/i });
    await act(async () => userEvent.click(createBtn));

    // Confirm modal appears
    expect(await screen.findByText(/Are you sure you want to create 1 item/i)).toBeInTheDocument();

    // multiple 'Create' buttons exist (action + confirm). pick the confirm button (the last one)
    const createButtons = await screen.findAllByRole('button', { name: /Create/i });
    expect(createButtons.length).toBeGreaterThanOrEqual(2);
    const confirm = createButtons[createButtons.length - 1];
    await act(async () => userEvent.click(confirm));

    await waitFor(() => {
      expect(tenantApi.createMenuItem).toHaveBeenCalled();
    });
  });
});
