import { describe, it, expect } from 'vitest';
import { pipelineStatus, type HealthMap } from './data';

const now = Date.now();

describe('pipelineStatus', () => {
  it('reports "connecting" before any fetch has recorded', () => {
    expect(pipelineStatus({}).status).toBe('connecting');
  });

  it('reports "live" when all recent fetches succeeded', () => {
    const h: HealthMap = {
      '/api/quote': { ok: true, at: now },
      '/api/news': { ok: true, at: now - 1000 },
    };
    const r = pipelineStatus(h);
    expect(r.status).toBe('live');
    expect(r.newest).toBe(now);
  });

  it('reports "delayed" when at least one source failed but others succeeded', () => {
    const h: HealthMap = {
      '/api/quote': { ok: true, at: now },
      '/api/history': { ok: false, at: now },
    };
    expect(pipelineStatus(h).status).toBe('delayed');
  });

  it('reports "delayed" when the freshest success is older than the stale window', () => {
    const h: HealthMap = { '/api/quote': { ok: true, at: now - 10 * 60000 } };
    expect(pipelineStatus(h, 180000).status).toBe('delayed');
  });

  it('reports "offline" when every source failed', () => {
    const h: HealthMap = {
      '/api/quote': { ok: false, at: now },
      '/api/news': { ok: false, at: now },
    };
    const r = pipelineStatus(h);
    expect(r.status).toBe('offline');
    expect(r.newest).toBeNull();
  });
});
