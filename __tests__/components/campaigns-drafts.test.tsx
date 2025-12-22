import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampaignsPage from '@/app/(tenant)/app/campaigns/page';
import { tenantApi } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    getDrafts: jest.fn(),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
    scheduledPosts: jest.fn().mockResolvedValue({ data: [] }),
    campaignStats: jest.fn().mockResolvedValue({ scheduled: 0, published: 0, draft: 0 }),
  },
}));

describe('Campaigns drafts list', () => {
  beforeEach(() => {
    (tenantApi.getDrafts as jest.Mock).mockReset();
    (tenantApi.getDraft as jest.Mock).mockReset();
    (tenantApi.deleteDraft as jest.Mock).mockReset();
    localStorage.removeItem('drafts-local-compose.post');
  });

  const renderWithQuery = (ui: React.ReactElement) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
  };

  it('shows a local-only draft when server has none', async () => {
    (tenantApi.getDrafts as jest.Mock).mockResolvedValue({ drafts: [] });
    const snapshot = { content: { caption: 'Local draft caption' }, draftId: 'local-123', updatedAt: Date.now() };
    localStorage.setItem('drafts-local-compose.post', JSON.stringify(snapshot));

    renderWithQuery(<CampaignsPage />);

    // Switch to Drafts tab
    const draftsTab = screen.getByRole('button', { name: /Drafts/i });
    await act(async () => {
      await userEvent.click(draftsTab);
    });

    // Should show the local draft
    expect(await screen.findByText(/Local draft caption/i)).toBeInTheDocument();
    // Label should indicate it's saved locally
    expect(screen.getByText(/Saved locally/i)).toBeInTheDocument();
  });
});