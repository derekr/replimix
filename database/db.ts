import Database from 'better-sqlite3';
import type { Database as DBType } from 'better-sqlite3'
export type DB = DBType;
export const db = new Database('replmix.db');
db.pragma('journal_mode = WAL');

export type TransactionBodyFn<R> = (db: DB) => R;

// NOTE: Missing retry logic from pg demo
export function transact<R>(body: TransactionBodyFn<R>): R {
  db.prepare('begin').run();
      try {
        const r = body(db);
        db.prepare('commit').run();
        return r;
      } catch (e) {
        console.log(`caught error ${e} - rolling back`);
        db.prepare('rollback').run();
        throw e;
      }
}