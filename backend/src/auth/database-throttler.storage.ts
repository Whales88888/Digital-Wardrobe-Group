import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { DataSource, QueryRunner } from 'typeorm';

interface CounterRow {
  total_hits: number | string;
  time_to_expire: number | string;
}

interface CounterRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class DatabaseThrottlerStorage implements ThrottlerStorage {
  private callsSinceCleanup = 0;
  private readonly logger = new Logger(DatabaseThrottlerStorage.name);

  constructor(@Inject('DATA_SOURCE') private readonly dataSource: DataSource) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<CounterRecord> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await this.lockCounter(queryRunner, key, throttlerName);
      await queryRunner.query(
        `DELETE FROM rate_limit_hits
         WHERE rate_limit_key = ? AND throttler_name = ?
           AND hit_at <= TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3))`,
        [key, throttlerName, -ttl * 1000],
      );

      const current = await this.readCounter(queryRunner, key, throttlerName, ttl);
      const currentHits = Number(current.total_hits);
      const isBlocked = currentHits >= limit;
      if (!isBlocked) {
        await queryRunner.query(
          `INSERT INTO rate_limit_hits (rate_limit_key, throttler_name, hit_at)
           VALUES (?, ?, UTC_TIMESTAMP(3))`,
          [key, throttlerName],
        );
      }

      const result = isBlocked
        ? current
        : await this.readCounter(queryRunner, key, throttlerName, ttl);
      const totalHits = Number(result.total_hits) + (isBlocked ? 1 : 0);
      const timeToExpire = Number(result.time_to_expire);

      await queryRunner.commitTransaction();
      const record = {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: isBlocked ? timeToExpire : 0,
      };
      await this.cleanupPeriodically();
      return record;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async lockCounter(
    queryRunner: QueryRunner,
    key: string,
    throttlerName: string,
  ): Promise<void> {
    await queryRunner.query(
      `INSERT INTO rate_limit_counters (rate_limit_key, throttler_name, last_seen_at)
       VALUES (?, ?, UTC_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE last_seen_at = UTC_TIMESTAMP(3)`,
      [key, throttlerName],
    );
    await queryRunner.query(
      `SELECT rate_limit_key
       FROM rate_limit_counters
       WHERE rate_limit_key = ? AND throttler_name = ?
       FOR UPDATE`,
      [key, throttlerName],
    );
  }

  private async readCounter(
    queryRunner: QueryRunner,
    key: string,
    throttlerName: string,
    ttl: number,
  ): Promise<CounterRow> {
    const rows = (await queryRunner.query(
      `SELECT COUNT(*) AS total_hits,
         COALESCE(GREATEST(
           0,
           CEIL(TIMESTAMPDIFF(
             MICROSECOND,
             UTC_TIMESTAMP(3),
             TIMESTAMPADD(MICROSECOND, ?, MIN(hit_at))
           ) / 1000000)
         ), 0) AS time_to_expire
       FROM rate_limit_hits
       WHERE rate_limit_key = ? AND throttler_name = ?
         AND hit_at > TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3))`,
      [ttl * 1000, key, throttlerName, -ttl * 1000],
    )) as CounterRow[];
    const row = rows[0];
    if (!row) {
      throw new Error('Rate limit counter was not available after increment');
    }
    return row;
  }

  private async cleanupPeriodically(): Promise<void> {
    this.callsSinceCleanup += 1;
    if (this.callsSinceCleanup < 100) return;
    this.callsSinceCleanup = 0;

    const oneDayInMicroseconds = -24 * 60 * 60 * 1_000_000;
    try {
      await this.dataSource.query(
        `DELETE FROM rate_limit_hits
         WHERE hit_at <= TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3))
         LIMIT 1000`,
        [oneDayInMicroseconds],
      );
      await this.dataSource.query(
        `DELETE FROM rate_limit_counters
         WHERE last_seen_at <= TIMESTAMPADD(MICROSECOND, ?, UTC_TIMESTAMP(3))
           AND NOT EXISTS (
             SELECT 1 FROM rate_limit_hits
             WHERE rate_limit_hits.rate_limit_key = rate_limit_counters.rate_limit_key
               AND rate_limit_hits.throttler_name = rate_limit_counters.throttler_name
           )
         LIMIT 1000`,
        [oneDayInMicroseconds],
      );
    } catch (error) {
      this.logger.error(
        'Could not clean expired rate-limit rows',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
