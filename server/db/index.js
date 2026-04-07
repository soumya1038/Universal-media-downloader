import Database from 'better-sqlite3';
import path from 'path';
import config from '../config/index.js';

const storagePath = path.resolve(config.storage.downloadPath, '..', 'database.sqlite');
const db = new Database(storagePath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// A wrapper to emulate pg.query's `{ rows: [...] }` return format
// and convert $1, $2 arguments to sqlite ? variables.
export const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      // Convert PostgreSQL parameters ($1, $2) to SQLite (?)
      const sqliteText = text.replace(/\$\d+/g, '?');

      // Check if it's a SELECT query
      if (sqliteText.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = db.prepare(sqliteText);
        const rows = stmt.all(...params);
        resolve({ rows: rows || [] });
      } else {
        // INSERT, UPDATE, DELETE, CREATE, etc.
        const stmt = db.prepare(sqliteText);
        const info = stmt.run(...params);
        resolve({ rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid });
      }
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  query
};
