// Low-level config and utilities for Postgres.

import pg from 'pg';
import type {Pool, QueryResult} from 'pg';
import {createDatabase} from './schema.ts';

const pool = getPool();

async function getPool() {
  const global = globalThis as unknown as {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _pool: Pool;
  };
  if (!global._pool) {
    global._pool = await initPool();
  }
  return global._pool;
}

async function initPool() {
  console.log('creating global pool');

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Required env var DATABASE_URL not set');
  }

  const ssl =
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : undefined;
  const pool = new pg.Pool({
    connectionString: url,
    ssl,
  });

  // the pool will emit an error on behalf of any idle clients
  // it contains if a backend error or network partition happens
  pool.on('error', err => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
  pool.on('connect', async client => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await client.query(
      'SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL SERIALIZABLE',
    );
    await client.query('SET enable_seqscan=off');
  });

  await withExecutorAndPool(async executor => {
    await transactWithExecutor(executor, async executor => {
      await createDatabase(executor);
    });
  }, pool);

  return pool;
}

export async function withExecutor<R>(f: (executor: Executor) => R) {
  const p = await pool;
  return withExecutorAndPool(f, p);
}

async function withExecutorAndPool<R>(
  f: (executor: Executor) => R,
  p: Pool,
): Promise<R> {
  const client = await p.connect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executor = async (sql: string, params?: any[]) => {
    try {
      console.log('Running query', sql, params);
      return await client.query(sql, params);
    } catch (e) {
      console.warn(`Error executing SQL: ${e}`);
      throw e;
    }
  };

  try {
    return await f(executor);
  } finally {
    client.release();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Executor = (sql: string, params?: any[]) => Promise<QueryResult>;
export type TransactionBodyFn<R> = (executor: Executor) => Promise<R>;

/**
 * Invokes a supplied function within a transaction.
 * @param body Function to invoke. If this throws, the transaction will be rolled
 * back. The thrown error will be re-thrown.
 */
export async function transact<R>(body: TransactionBodyFn<R>) {
  return await withExecutor(async executor => {
    return await transactWithExecutor(executor, body);
  });
}

async function transactWithExecutor<R>(
  executor: Executor,
  body: TransactionBodyFn<R>,
) {
  for (let i = 0; i < 10; i++) {
    try {
      await executor('begin');
      try {
        const r = await body(executor);
        await executor('commit');
        return r;
      } catch (e) {
        console.log(`caught error ${e} - rolling back`);
        await executor('rollback');
        throw e;
      }
    } catch (e) {
      if (shouldRetryTransaction(e)) {
        console.log(
          `Retrying transaction due to error ${e} - attempt number ${i}`,
        );
        continue;
      }
      throw e;
    }
  }
  throw new Error('Tried to execute transacation too many times. Giving up.');
}

// Because we are using SERIALIZABLE isolation level, we need to be prepared to retry transactions.
// stackoverflow.com/questions/60339223/node-js-transaction-coflicts-in-postgresql-optimistic-concurrency-control-and
function shouldRetryTransaction(err: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const code = typeof err === 'object' ? String((err as any).code) : null;
  return code === '40001' || code === '40P01';
}
