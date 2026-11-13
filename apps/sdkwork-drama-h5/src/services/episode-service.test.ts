import { describe, expect, it } from 'vitest';
import type { Episode, EpisodePageData } from '@sdkwork/drama-app-sdk';

import {
  createEpisodeService,
  EpisodeValidationError,
  statusCounts,
  type EpisodeApiPort,
} from './episode-service';

const episode = (id: string, status: Episode['status'] = 'draft'): Episode => ({
  id,
  tenantId: '100001',
  title: `Episode ${id}`,
  synopsis: null,
  status,
  createdAt: '2026-11-13T00:00:00Z',
  updatedAt: '2026-11-13T00:00:00Z',
});

function fakePort(): EpisodeApiPort & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async list(params) {
      calls.push(`list:${params?.pageSize ?? ''}:${params?.cursor ?? ''}`);
      const page: EpisodePageData = {
        items: [episode('1')],
        pageInfo: { mode: 'cursor', hasMore: true, nextCursor: '1' },
      };
      return page;
    },
    async create(body) {
      calls.push(`create:${body.title}`);
      return episode('2');
    },
    async update(id, body) {
      calls.push(`update:${id}:${body.title ?? ''}`);
      return { ...episode(id), title: body.title ?? '' };
    },
    async delete(id) {
      calls.push(`delete:${id}`);
    },
    async publish(id) {
      calls.push(`publish:${id}`);
      return episode(id, 'published');
    },
  };
}

describe('episode service', () => {
  it('lists with the default cursor page size', async () => {
    const port = fakePort();
    const service = createEpisodeService(port);
    const page = await service.list();
    expect(page.items).toHaveLength(1);
    expect(port.calls).toEqual(['list:20:']);
  });

  it('passes a cursor through for load-more', async () => {
    const port = fakePort();
    await createEpisodeService(port).list('42');
    expect(port.calls).toEqual(['list:20:42']);
  });

  it('trims drafts and rejects blank titles', async () => {
    const port = fakePort();
    const service = createEpisodeService(port);
    const created = await service.create({ title: '  Pilot  ', synopsis: '  ' });
    expect(created.id).toBe('2');
    expect(port.calls).toEqual(['create:Pilot']);
    await expect(service.create({ title: '   ', synopsis: '' })).rejects.toBeInstanceOf(
      EpisodeValidationError,
    );
  });

  it('publishes through the SDK port', async () => {
    const port = fakePort();
    const published = await createEpisodeService(port).publish('9');
    expect(published.status).toBe('published');
    expect(port.calls).toEqual(['publish:9']);
  });

  it('counts statuses for the overview', () => {
    const counts = statusCounts([
      episode('1', 'draft'),
      episode('2', 'draft'),
      episode('3', 'published'),
    ]);
    expect(counts).toEqual({ total: 3, draft: 2, published: 1, retired: 0 });
  });
});
