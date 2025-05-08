const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('database/scholarships.db', (err) => {
    if (err) {
        console.error('Failed to connect to scholarships.db:', err.message);
        process.exit(1);
    }
    console.log('Connected to scholarships.db');
});

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error fetching tables:', err.message);
            return;
        }
        console.log('Tables in scholarships.db:');
        tables.forEach(table => {
            console.log(' -', table.name);
        });

        // For each table, print schema
        tables.forEach(table => {
            db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
                if (err) {
                    console.error(`Error fetching schema for table ${table.name}:`, err.message);
                    return;
                }
                console.log(`Schema for table ${table.name}:`);
                columns.forEach(col => {
                    console.log(`  ${col.cid}: ${col.name} (${col.type})${col.pk ? ' PRIMARY KEY' : ''}`);
                });
            });
        });

        // Count scholarships in main table (assuming table name is scholarships)
        db.get("SELECT COUNT(*) AS count FROM scholarships", (err, row) => {
            if (err) {
                console.error('Error counting scholarships:', err.message);
            } else {
                console.log(`Total scholarships count: ${row.count}`);
            }
            db.close();
        });
    });
});
