import Database from 'better-sqlite3';
export type { Database as DB } from 'better-sqlite3'
export const db = new Database('replmix.db');
db.pragma('journal_mode = WAL');