const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/scholarships_new.db', (err) => {
    if (err) {
        console.error('Failed to connect to scholarships_new.db:', err.message);
        process.exit(1);
    }
    console.log('Connected to scholarships_new.db');
});

db.serialize(() => {
    db.run(`ALTER TABLE scholarships ADD COLUMN location TEXT`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('Column "location" already exists in scholarships table.');
            } else {
                console.error('Failed to add location column:', err.message);
                process.exit(1);
            }
        } else {
            console.log('Successfully added "location" column to scholarships table.');
        }
    });
});

db.close();
