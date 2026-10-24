const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const databasePath = path.join(__dirname, 'timeslot.db');
const db = new sqlite3.Database(databasePath);

const ready = new Promise((resolve, reject) => {
  db.run(
    `CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      service_name TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (appointment_date, appointment_time)
    )`,
    (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    }
  );
});

module.exports = { db, ready };
