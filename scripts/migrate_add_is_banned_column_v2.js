const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/accounts.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to accounts.db');
});

db.serialize(() => {
    // Check if is_banned column exists
    db.all("PRAGMA table_info(users);", (err, rows) => {
        if (err) {
            console.error('Error getting table info:', err.message);
            return;
        }
        const columnExists = rows.some(row => row.name === 'is_banned');
        if (columnExists) {
            console.log('Column is_banned already exists.');
            db.close();
        } else {
            // Add is_banned column
            db.run("ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;", (err) => {
                if (err) {
                    console.error('Error adding is_banned column:', err.message);
                } else {
                    console.log('Added is_banned column to users table.');
                }
                db.close();
            });
        }
    });
});
