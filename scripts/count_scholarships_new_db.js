const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/scholarships_new.db', (err) => {
    if (err) {
        console.error('Failed to connect to scholarships_new.db:', err.message);
        process.exit(1);
    }
    console.log('Connected to scholarships_new.db');
});

db.get('SELECT COUNT(*) AS count FROM scholarships', (err, row) => {
    if (err) {
        console.error('Error querying scholarships count:', err.message);
    } else {
        console.log('Number of scholarships in scholarships_new.db:', row.count);
    }
    db.close();
});
