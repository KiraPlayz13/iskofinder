const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/accounts.db', (err) => {
    if (err) {
        console.error('Failed to connect to accounts.db:', err.message);
        process.exit(1);
    }
});

db.all("PRAGMA table_info(users);", [], (err, rows) => {
    if (err) {
        console.error('Error querying table info:', err.message);
    } else {
        console.log('Users table schema:');
        rows.forEach(row => {
            console.log(`${row.cid}: ${row.name} (${row.type})`);
        });
    }
    db.close();
});
