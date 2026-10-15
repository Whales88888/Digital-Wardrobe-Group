import type { DataSource, QueryRunner } from 'typeorm';
import { DatabaseThrottlerStorage } from './database-throttler.storage';

describe('DatabaseThrottlerStorage', () => {
  let query: jest.Mock;
  let queryRunner: jest.Mocked<Pick<
    QueryRunner,
    | 'connect'
    | 'startTransaction'
    | 'query'
    | 'commitTransaction'
    | 'rollbackTransaction'
    | 'release'
  >> & Pick<QueryRunner, 'isTransactionActive'>;
  let storage: DatabaseThrottlerStorage;

  beforeEach(() => {
    query = jest.fn();
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      query,
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      isTransactionActive: true,
    };
    const dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as DataSource;
    storage = new DatabaseThrottlerStorage(dataSource);
  });

  it('records allowed requests in a shared sliding window', async () => {
    query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ total_hits: 0, time_to_expire: 0 }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ total_hits: 1, time_to_expire: 60 }]);

    await expect(
      storage.increment('client-key', 60_000, 5, 0, 'default'),
    ).resolves.toEqual({
      totalHits: 1,
      timeToExpire: 60,
      isBlocked: false,
      timeToBlockExpire: 0,
    });

    expect(query).toHaveBeenCalledTimes(6);
    expect(query.mock.calls[0][0]).toContain('ON DUPLICATE KEY UPDATE');
    expect(query.mock.calls[1][0]).toContain('FOR UPDATE');
    expect(query.mock.calls[2][1]).toEqual(['client-key', 'default', -60_000_000]);
    expect(query.mock.calls[4][0]).toContain('INSERT INTO rate_limit_hits');
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('blocks requests after the configured limit without adding another hit', async () => {
    query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ total_hits: '5', time_to_expire: '42' }]);

    await expect(
      storage.increment('client-key', 60_000, 5, 0, 'default'),
    ).resolves.toEqual({
      totalHits: 6,
      timeToExpire: 42,
      isBlocked: true,
      timeToBlockExpire: 42,
    });
    expect(query).toHaveBeenCalledTimes(4);
  });

  it('rolls back and fails explicitly if the counter cannot be read', async () => {
    query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([]);

    await expect(
      storage.increment('client-key', 60_000, 5, 0, 'default'),
    ).rejects.toThrow('Rate limit counter was not available after increment');
    expect(queryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('supports non-zero block durations without rejecting the request', async () => {
    query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ total_hits: '5', time_to_expire: '42' }]);

    await expect(
      storage.increment('client-key', 60_000, 5, 10_000, 'default'),
    ).resolves.toEqual({
      totalHits: 6,
      timeToExpire: 42,
      isBlocked: true,
      timeToBlockExpire: 42,
    });
    expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(queryRunner.release).toHaveBeenCalledTimes(1);
  });
});
