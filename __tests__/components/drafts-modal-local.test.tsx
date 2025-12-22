import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DraftsModal from '@/app/(tenant)/components/posting/DraftsModal';
import { tenantApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({ tenantApi: { getDrafts: jest.fn(), deleteDraft: jest.fn() } }));

describe('DraftsModal local-only snapshot', () => {
  beforeEach(() => {
    (tenantApi.getDrafts as jest.Mock).mockResolvedValue({ drafts: [] });
    localStorage.clear();
  });

  it('shows saved locally badge and discards local snapshot without calling API', async () => {
    const keyName = 'compose.post';
    const snap = { draftId: 'local-1', content: { caption: 'local content' }, updatedAt: Date.now() };
    localStorage.setItem(`drafts-local-${keyName}`, JSON.stringify(snap));

    const onRestore = jest.fn();
    const onDiscard = jest.fn();

    render(<DraftsModal open={true} onClose={() => {}} onRestore={onRestore} onDiscard={onDiscard} autoRestoreSingle={false} keyName={keyName} />);

    // Wait for draft to be listed
    expect(await screen.findByText(/Saved locally/i)).toBeInTheDocument();

    // Click Discard -> opens confirm
    const discardBtn = screen.getByRole('button', { name: /Discard/i });
    await act(async () => userEvent.click(discardBtn));

    // Confirm modal appears
    expect(await screen.findByText(/Discard draft/i)).toBeInTheDocument();
    // multiple 'Discard' buttons exist (list + confirm). pick the confirmation button (the last one)
    const discardButtons = await screen.findAllByRole('button', { name: /Discard/i });
    expect(discardButtons.length).toBeGreaterThanOrEqual(2);
    const confirm = discardButtons[discardButtons.length - 1];
    await act(async () => userEvent.click(confirm));

    // localStorage key should be removed and tenantApi.deleteDraft not called
    await waitFor(() => {
      expect(localStorage.getItem(`drafts-local-${keyName}`)).toBeNull();
      expect(tenantApi.deleteDraft).not.toHaveBeenCalled();
    });
  });
});
