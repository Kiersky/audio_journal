// dao.js
const log = require('electron-log');
const database = require('./db');

/**
 * Data Access Object for the audio journal app
 * Handles all database operations for entries and tags
 */
class JournalDAO {
    /**
     * Get the database instance
     * @returns {sqlite3.Database}
     */
    _db() {
        return database.get();
    }

    // ============ ENTRY OPERATIONS ============

    /**
     * Create a new journal entry
     * @param {Object} entryData - Entry data object
     * @param {string} entryData.title - Entry title
     * @param {string} entryData.audioPath - Path to audio file
     * @param {number} entryData.duration - Audio duration in seconds
     * @param {string} [entryData.transcript] - Optional transcript
     * @returns {Promise<number>} ID of the newly created entry
     */
    createEntry(entryData) {
        const { title, audioPath, duration, transcript } = entryData;

        return new Promise((resolve, reject) => {
            this._db().run(
                `INSERT INTO entries (title, audio_path, duration, transcript) 
         VALUES (?, ?, ?, ?)`,
                [title, audioPath, duration, transcript],
                function (err) {
                    if (err) {
                        log.error('Error creating entry:', err.message);
                        reject(err);
                    } else {
                        log.info(`Created new entry with ID: ${this.lastID}`);
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    /**
     * Get all journal entries
     * @param {Object} [options] - Query options
     * @param {string} [options.sortBy='created_at'] - Field to sort by
     * @param {string} [options.order='DESC'] - Sort order (ASC or DESC)
     * @param {number} [options.limit] - Max number of entries to return
     * @returns {Promise<Array>} Array of entry objects
     */
    getAllEntries(options = {}) {
        const {
            sortBy = 'created_at',
            order = 'DESC',
            limit
        } = options;

        // Validate sort field to prevent SQL injection
        const validSortFields = ['created_at', 'modified_at', 'title', 'duration'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

        // Validate order to prevent SQL injection
        const sortOrder = (order === 'ASC') ? 'ASC' : 'DESC';

        // Build query
        let query = `SELECT * FROM entries ORDER BY ${sortField} ${sortOrder}`;
        const params = [];

        // Add limit if specified
        if (limit && Number.isInteger(limit) && limit > 0) {
            query += ' LIMIT ?';
            params.push(limit);
        }

        return new Promise((resolve, reject) => {
            this._db().all(query, params, (err, rows) => {
                if (err) {
                    log.error('Error getting entries:', err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Get a specific entry by ID
     * @param {number} id - Entry ID
     * @param {boolean} [includeTags=false] - Whether to include associated tags
     * @returns {Promise<Object>} Entry object with optional tags array
     */
    getEntry(id, includeTags = false) {
        return new Promise((resolve, reject) => {
            this._db().get(
                `SELECT * FROM entries WHERE id = ?`,
                [id],
                async (err, entry) => {
                    if (err) {
                        log.error(`Error getting entry ${id}:`, err.message);
                        reject(err);
                        return;
                    }

                    if (!entry) {
                        resolve(null);
                        return;
                    }

                    // Include tags if requested
                    if (includeTags) {
                        try {
                            entry.tags = await this.getTagsForEntry(id);
                        } catch (tagErr) {
                            log.warn(`Error getting tags for entry ${id}:`, tagErr.message);
                            entry.tags = [];
                        }
                    }

                    resolve(entry);
                }
            );
        });
    }

    /**
     * Update an existing entry
     * @param {Object} entryData - Entry data with ID
     * @returns {Promise<Object>} Result with changes count
     */
    updateEntry(entryData) {
        const { id, title, transcript } = entryData;

        return new Promise((resolve, reject) => {
            this._db().run(
                `UPDATE entries 
         SET title = ?, transcript = ?, modified_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
                [title, transcript, id],
                function (err) {
                    if (err) {
                        log.error(`Error updating entry ${id}:`, err.message);
                        reject(err);
                    } else {
                        log.info(`Updated entry ${id}, changes: ${this.changes}`);
                        resolve({ id, changes: this.changes });
                    }
                }
            );
        });
    }

    /**
     * Delete an entry by ID
     * @param {number} id - Entry ID
     * @returns {Promise<Object>} Result with changes count
     */
    deleteEntry(id) {
        return new Promise((resolve, reject) => {
            this._db().run(
                `DELETE FROM entries WHERE id = ?`,
                [id],
                function (err) {
                    if (err) {
                        log.error(`Error deleting entry ${id}:`, err.message);
                        reject(err);
                    } else {
                        log.info(`Deleted entry ${id}, changes: ${this.changes}`);
                        resolve({ changes: this.changes });
                    }
                }
            );
        });
    }

    /**
     * Search entries by keyword in title or transcript
     * @param {string} keyword - Search keyword
     * @returns {Promise<Array>} Array of matching entries
     */
    searchEntries(keyword) {
        const searchTerm = `%${keyword}%`;

        return new Promise((resolve, reject) => {
            this._db().all(
                `SELECT * FROM entries 
         WHERE title LIKE ? OR transcript LIKE ?
         ORDER BY created_at DESC`,
                [searchTerm, searchTerm],
                (err, rows) => {
                    if (err) {
                        log.error('Error searching entries:', err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    // ============ TAG OPERATIONS ============

    /**
     * Create a new tag or get existing tag ID
     * @param {string} name - Tag name
     * @returns {Promise<number>} ID of the created or existing tag
     */
    createTag(name) {
        return new Promise((resolve, reject) => {
            this._db().run(
                `INSERT INTO tags (name) VALUES (?)`,
                [name],
                function (err) {
                    if (err) {
                        // Handle uniqueness constraint - get existing tag
                        if (err.message.includes('UNIQUE constraint failed')) {
                            this._db().get(
                                `SELECT id FROM tags WHERE name = ?`,
                                [name],
                                (getErr, row) => {
                                    if (getErr) {
                                        reject(getErr);
                                    } else {
                                        resolve(row.id);
                                    }
                                }
                            );
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve(this.lastID);
                    }
                }.bind(this)
            );
        });
    }

    /**
     * Get all available tags
     * @returns {Promise<Array>} Array of tag objects
     */
    getAllTags() {
        return new Promise((resolve, reject) => {
            this._db().all(
                `SELECT * FROM tags ORDER BY name`,
                [],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    /**
     * Tag an entry
     * @param {number} entryId - Entry ID
     * @param {number} tagId - Tag ID
     * @returns {Promise<boolean>} Success indicator
     */
    tagEntry(entryId, tagId) {
        return new Promise((resolve, reject) => {
            this._db().run(
                `INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) VALUES (?, ?)`,
                [entryId, tagId],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    /**
     * Remove a tag from an entry
     * @param {number} entryId - Entry ID
     * @param {number} tagId - Tag ID
     * @returns {Promise<boolean>} Success indicator
     */
    untagEntry(entryId, tagId) {
        return new Promise((resolve, reject) => {
            this._db().run(
                `DELETE FROM entry_tags WHERE entry_id = ? AND tag_id = ?`,
                [entryId, tagId],
                function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    /**
     * Get all tags for an entry
     * @param {number} entryId - Entry ID
     * @returns {Promise<Array>} Array of tag objects
     */
    getTagsForEntry(entryId) {
        return new Promise((resolve, reject) => {
            this._db().all(
                `SELECT t.* FROM tags t
         JOIN entry_tags et ON t.id = et.tag_id
         WHERE et.entry_id = ?
         ORDER BY t.name`,
                [entryId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    /**
     * Get all entries with a specific tag
     * @param {number} tagId - Tag ID
     * @returns {Promise<Array>} Array of entry objects
     */
    getEntriesWithTag(tagId) {
        return new Promise((resolve, reject) => {
            this._db().all(
                `SELECT e.* FROM entries e
         JOIN entry_tags et ON e.id = et.entry_id
         WHERE et.tag_id = ?
         ORDER BY e.created_at DESC`,
                [tagId],
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                }
            );
        });
    }

    /**
     * Perform a transaction with multiple operations
     * @param {Function} operations - Function containing database operations
     * @returns {Promise<any>} Result of the transaction
     */
    async transaction(operations) {
        return new Promise((resolve, reject) => {
            const db = this._db();

            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                try {
                    // Execute the operations function, passing this DAO instance
                    const result = operations(this);

                    db.run('COMMIT', (err) => {
                        if (err) {
                            log.error('Error committing transaction:', err.message);
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                } catch (err) {
                    db.run('ROLLBACK');
                    reject(err);
                }
            });
        });
    }
}

// Export a singleton instance
module.exports = new JournalDAO();