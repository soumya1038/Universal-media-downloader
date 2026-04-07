import sqlite3 from 'sqlite3';
import path from 'path';
import config from '../config/index.js';

const storagePath = path.resolve(config.storage.downloadPath, '..', 'database.sqlite');
const db = new sqlite3.Database(storagePath, (err) => {
  if (err) {
    console.error('Failed to open database', err);
  }
});

// A wrapper to emulate pg.query's `{ rows: [...] }` return format
// and convert $1, $2 arguments to sqlite ? variables.
export const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    // Convert PostgreSQL parameters ($1, $2) to SQLite (?)
    const sqliteText = text.replace(/\$\d+/g, '?');

    db.all(sqliteText, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve({ rows: rows || [] });
    });
  });
};

export default {
  query
};
