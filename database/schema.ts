import { z } from 'zod';
import type { DB } from './db.ts';

const schemaVersion = 4;

export function createDatabase(db: DB) {
  console.log('creating database');
  const actualSchemaVersion = getSchemaVersion(db);
  if (schemaVersion !== actualSchemaVersion) {
    createSchema(db);
  }
}

export function createSchema(db: DB) {
  db.prepare(`DROP TABLE IF EXISTS replicache_meta`).run();
  db.prepare(`DROP TABLE IF EXISTS replicache_client_group`).run();
  db.prepare(`DROP TABLE IF EXISTS replicache_client`).run();
  db.prepare(`DROP TABLE IF EXISTS list`).run();
  db.prepare(`DROP TABLE IF EXISTS share`).run();
  db.prepare(`DROP TABLE IF EXISTS item`).run();


db.prepare(
    `CREATE TABLE replicache_meta (
       key TEXT PRIMARY KEY, 
       value TEXT)`
).run();

db.prepare(
  `INSERT INTO replicache_meta (key, value)
   VALUES ('schemaVersion', ?)`
).run(JSON.stringify({schemaVersion}));

db.prepare(`CREATE TABLE replicache_client_group (
    id TEXT PRIMARY KEY NOT NULL,
    userid TEXT NOT NULL,
    cvrversion INTEGER NOT NULL,
    lastmodified DATETIME NOT NULL)`)
.run();

db.prepare(`CREATE TABLE replicache_client (
    id TEXT PRIMARY KEY NOT NULL,
    clientgroupid TEXT NOT NULL,
    lastmutationid INTEGER NOT NULL,
    lastmodified DATETIME NOT NULL)`)
.run();

db.prepare(`CREATE TABLE list (
    id TEXT PRIMARY KEY NOT NULL,
    ownerid TEXT NOT NULL,
    name TEXT NOT NULL,
    lastmodified DATETIME NOT NULL)`)
.run();

db.prepare(`CREATE TABLE share (
    id TEXT PRIMARY KEY NOT NULL,
    listid TEXT NOT NULL,
    userid TEXT NOT NULL,
    lastmodified DATETIME NOT NULL)`)
.run();

db.prepare(`CREATE TABLE item (
    id TEXT PRIMARY KEY NOT NULL,
    listid TEXT NOT NULL,
    title TEXT NOT NULL,
    complete INTEGER NOT NULL,
    ord INTEGER NOT NULL,
    lastmodified DATETIME NOT NULL)`)
.run();

}

const MetaExistsSchema = z.object({
  name: z.string().optional(),
}).optional();

const QRSchema = z.object({
  value: z.string(),
})

const MetaValueSchema = z.object({
  schemaVersion: z.coerce.number(),
}) 

function getSchemaVersion(db: DB) {
  console.log(db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='replicache_meta'`).get())
  const metaExists = MetaExistsSchema.parse(
    db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='replicache_meta'`).get()
  );
  
  if (!metaExists?.name) { // Check on .name because metaExists is an object and not an array
    return 0;
  }
console.log(db.prepare(
  `SELECT value FROM replicache_meta WHERE key = 'schemaVersion'`
).get())
  const qr = QRSchema.parse(db.prepare(
    `SELECT value FROM replicache_meta WHERE key = 'schemaVersion'`
  ).get());
  
  return MetaValueSchema.parse(JSON.parse(qr.value)).schemaVersion; // Check on .value similarly as above
}