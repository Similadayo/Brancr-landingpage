import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DraftsModal from '@/app/(tenant)/components/posting/DraftsModal';
import { tenantApi } from '@/lib/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    getDrafts: jest.fn(),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
  },
}));

afterEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

it('shows local-only drafts when server returns none', async () => {
  (tenantApi.getDrafts as jest.Mock).mockResolvedValue({ drafts: [] });
  const snapshot = { content: { caption: 'Local only draft' }, draftId: 'local-1', updatedAt: Date.now() };
  localStorage.setItem('drafts-local-compose.post', JSON.stringify(snapshot));

  renderWithQuery(<DraftsModal open={true} onClose={() => {}} keyName="compose.post" onRestore={() => {}} onDiscard={() => {}} />);

  expect(await screen.findByText(/Local only draft/i)).toBeInTheDocument();
  // label indicates it's saved locally
  expect(screen.getByText(/Saved locally/i)).toBeInTheDocument();
});