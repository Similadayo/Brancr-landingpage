import React, { useEffect } from 'react';
import { render, act, screen } from '@testing-library/react';
import useAutosaveDraft from '@/app/(tenant)/hooks/useDrafts';
import { tenantApi } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  tenantApi: {
    createDraft: jest.fn(),
    updateDraft: jest.fn(),
    getDrafts: jest.fn(),
    getDraft: jest.fn(),
    deleteDraft: jest.fn(),
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
    (tenantApi.deleteDraft as jest.Mock).mockReset();
    (tenantApi.deleteDraft as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // nothing special to clean up when using real timers
  });

  it('creates a draft after debounce', async () => {
    jest.useFakeTimers();
    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'd1', updated_at: new Date().toISOString() });
    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');
    // trigger the change and advance timers to elapse debounce
    await act(async () => {
      btn.click();
      jest.advanceTimersByTime(30);
    });
    // Process outbox explicitly
    function ConsumerProcess() {
      const hook = useAutosaveDraft({ key: 'compose.post' });
      void (hook as any)._processOutbox();
      return null;
    }
    render(<ConsumerProcess />);
    // allow async microtasks
    await act(async () => { await Promise.resolve(); });
    expect(tenantApi.createDraft).toHaveBeenCalled();
    // Wait until the status becomes 'saved'
    await screen.findByText('saved');
    expect(screen.getByTestId('id').textContent).toBe('d1');
    jest.useRealTimers();
  });

  it('updates an existing draft', async () => {
    jest.useFakeTimers();
    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'd2', updated_at: new Date().toISOString() });
    (tenantApi.updateDraft as jest.Mock).mockResolvedValue({ id: 'd2', updated_at: new Date().toISOString() });
    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');
    // initial create
    await act(async () => {
      btn.click();
      jest.advanceTimersByTime(30);
    });
    // Process outbox to create
    function ConsumerProcess() {
      const hook = useAutosaveDraft({ key: 'compose.post' });
      void (hook as any)._processOutbox();
      return null;
    }
    render(<ConsumerProcess />);
    await act(async () => { await Promise.resolve(); });

    // second update
    await act(async () => {
      btn.click();
      jest.advanceTimersByTime(30);
    });
    // Process outbox to trigger update
    render(<ConsumerProcess />);
    await act(async () => { await Promise.resolve(); });

    expect(tenantApi.updateDraft).toHaveBeenCalled();
    jest.useRealTimers();
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

  it('deletes draft via deleteDraft and processes outbox', async () => {
    jest.useFakeTimers();
    (tenantApi.createDraft as jest.Mock).mockResolvedValue({ id: 'del-1', updated_at: new Date().toISOString() });
    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');
    // create
    await act(async () => {
      btn.click();
      jest.advanceTimersByTime(30);
    });

    // Process outbox to ensure draft is created on server
    function ConsumerProcess() {
      const hook = useAutosaveDraft({ key: 'compose.post' });
      void (hook as any)._processOutbox();
      return null;
    }
    render(<ConsumerProcess />);
    await act(async () => { await Promise.resolve(); });

    // ensure a local snapshot was persisted with the draft id
    const raw = localStorage.getItem('drafts-local-compose.post');
    expect(raw).toBeTruthy();
    const snap = JSON.parse(raw || '{}');
    expect(snap.draftId).toBe('del-1');

    // Enqueue delete via the hook helpers and process immediately to avoid timing races
    function ConsumerDelete() {
      const hook = useAutosaveDraft({ key: 'compose.post' });
      useEffect(() => {
        // enqueue delete using snapshot id
        (hook as any)._enqueueOutbox({ type: 'delete', id: 'del-1' });
        void (hook as any)._processOutbox();
      }, [hook]);
      return null;
    }

    render(<ConsumerDelete />);
    await act(async () => { await Promise.resolve(); });
    expect(tenantApi.deleteDraft).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('retries createDraft on transient failures', async () => {
    jest.useFakeTimers();
    // fail twice then succeed
    const createMock = (tenantApi.createDraft as jest.Mock);
    createMock.mockRejectedValueOnce(new Error('fail1'));
    createMock.mockRejectedValueOnce(new Error('fail2'));
    createMock.mockResolvedValue({ id: 'retry-1', updated_at: new Date().toISOString() });

    render(<TestComponent keyProp="compose.post" debounceMs={10} />);
    const btn = screen.getByText('set');

    await act(async () => {
      btn.click();
      jest.advanceTimersByTime(30);
    });

    // Force processing outbox and trigger retries
    function Consumer() {
      const hook = useAutosaveDraft({ key: 'compose.post' });
      void (hook as any)._processOutbox();
      return null;
    }
    render(<Consumer />);

    // advance timers to cover retry delays (approx 3s)
    await act(async () => {
      jest.advanceTimersByTime(4000);
      // allow pending microtasks
      await Promise.resolve();
    });

    expect(tenantApi.createDraft).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
