const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/accounts.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
});

db.all('SELECT username FROM users', [], (err, rows) => {
    if (err) {
        console.error('Error querying users:', err.message);
        process.exit(1);
    }
    console.log('Users in accounts.db:');
    rows.forEach(row => {
        console.log(row.username);
    });
    db.close();
});
