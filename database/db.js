// db.js
const sqlite3 = require('sqlite3').verbose();
const { app } = require('electron');
const path = require('path');
const log = require('electron-log');
const schema = require('./schema');

class Database {
    constructor() {
        this.db = null;
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const userDataPath = app.getPath('userData');
            const dbPath = path.join(userDataPath, 'journal.db');

            log.info('Initializing database at:', dbPath);

            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    log.error('Database initialization error:', err.message);
                    reject(err);
                    return;
                }

                log.info('Connected to the SQLite database');

                // Create tables using schema definitions
                schema.createTables(this.db)
                    .then(() => {
                        log.info('Database schema initialized');
                        resolve(this.db);
                    })
                    .catch(error => {
                        log.error('Schema initialization error:', error.message);
                        reject(error);
                    });
            });
        });
    }

    get() {
        return this.db;
    }

    close() {
        if (this.db) {
            return new Promise((resolve, reject) => {
                this.db.close(err => {
                    if (err) {
                        log.error('Error closing database:', err.message);
                        reject(err);
                    } else {
                        log.info('Database connection closed');
                        this.db = null;
                        resolve();
                    }
                });
            });
        }
        return Promise.resolve();
    }
}

// Create a singleton instance
const database = new Database();
module.exports = database;