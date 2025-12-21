import React from 'react';
import { render, act, screen } from '@testing-library/react';
import useAutosaveDraft from '@/app/(tenant)/hooks/useDrafts';
import { tenantApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    createDraft: jest.fn(),
    updateDraft: jest.fn(),
    getDrafts: jest.fn(),
    getDraft: jest.fn(),
  },
}));

function TestComponent({ keyProp, debounceMs = 200 }: { keyProp: string; debounceMs?: number }) {
  const hook = useAutosaveDraft({ key: keyProp, debounceMs });
  return (
    <div>
      <button onClick={() => hook.setContent({ foo: 'bar' })}>set</button>
      <div data-testid="status">{hook.status}</div>
      <div data-testid="id">{hook.draftId}</div>
    </div>
  );
}

describe('useAutosaveDraft', () => {
  beforeEach(() => {
    // use real timers so promise microtasks run naturally in tests
    jest.useRealTimers();
    (tenantApi.createDraft as jest.Mock).mockReset();
    (tenantApi.updateDraft as jest.Mock).mockReset();
    (tenantApi.getDrafts as jest.Mock).mockReset();
    (tenantApi.getDraft as jest.Mock).mockReset();
    // default updateDraft to resolve so following update cycle doesn't throw in tests
    (tenantApi.updateDraft as jest.Mock).mockResolvedValue({ id: 'du', updated_at: new Date().toISOString() });
  });

  afterEach(() => {
    // nothing special to clean up when using real timers
  });

  it('creates a draft after debounce', async () => {
    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'd1', updated_at: new Date().toISOString() });
    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');
    // trigger the change and wait for the debounce to elapse
    await act(async () => {
      btn.click();
      // debounceMs in TestComponent defaults to 200; wait slightly more
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(tenantApi.createDraft).toHaveBeenCalled();
    // Wait until the status becomes 'saved'
    await screen.findByText('saved');
    expect(screen.getByTestId('id').textContent).toBe('d1');
  });

  it('updates an existing draft', async () => {
    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'd2', updated_at: new Date().toISOString() });
    (tenantApi.updateDraft as jest.Mock).mockResolvedValue({ id: 'd2', updated_at: new Date().toISOString() });
    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');
    // initial create
    await act(async () => {
      btn.click();
      await new Promise((r) => setTimeout(r, 30));
    });
    // second update
    await act(async () => {
      btn.click();
      await new Promise((r) => setTimeout(r, 30));
    });
    expect(tenantApi.updateDraft).toHaveBeenCalled();
  });

  it('calls onRemoteNewer when remote is newer', async () => {
    const remote = { id: 'd3', updated_at: new Date(Date.now() + 60000).toISOString(), content: { foo: 'baz' } };
    (tenantApi.getDrafts as jest.Mock).mockResolvedValue({ drafts: [remote] });
    const onRemoteNewer = jest.fn();
    function RemoteTest() {
      useAutosaveDraft({ key: 'compose.post', debounceMs: 200, onRemoteNewer });
      return null;
    }
    render(<RemoteTest />);
    // ensure initial fetch resolves
    await act(async () => { await Promise.resolve(); });
    expect(onRemoteNewer).toHaveBeenCalled();
  });
});
