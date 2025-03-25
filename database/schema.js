// schema.js
const log = require('electron-log');

/**
 * Creates all required tables for the audio journal application
 * @param {sqlite3.Database} db - The SQLite database instance
 * @returns {Promise} A promise that resolves when all tables are created
 */
function createTables(db) {
    return new Promise((resolve, reject) => {
        // Run all table creation in a transaction
        db.serialize(() => {
            // Start transaction
            db.run('BEGIN TRANSACTION');

            // Create entries table - main journal entries
            db.run(`CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        audio_path TEXT NOT NULL,
        duration INTEGER,
        transcript TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`, handleError);

            // Create tags table - for categorizing entries
            db.run(`CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )`, handleError);

            // Create junction table for entries and tags
            db.run(`CREATE TABLE IF NOT EXISTS entry_tags (
        entry_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (entry_id, tag_id),
        FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      )`, handleError);

            // Helper function to handle errors
            function handleError(err) {
                if (err) {
                    db.run('ROLLBACK');
                    log.error('Error creating tables:', err.message);
                    reject(err);
                }
            }

            // Commit transaction if no errors occurred
            db.run('COMMIT', function (err) {
                if (err) {
                    log.error('Error committing schema transaction:', err.message);
                    reject(err);
                } else {
                    log.info('All tables created successfully');
                    resolve();
                }
            });
        });
    });
}

module.exports = {
    createTables
};