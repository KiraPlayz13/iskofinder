const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database/accounts.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to accounts.db');
});

const username = 'Kira';

db.run('UPDATE users SET is_admin = 1 WHERE username = ?', [username], function(err) {
    if (err) {
        console.error('Error updating user:', err.message);
    } else if (this.changes === 0) {
        console.log(`No user found with username "${username}"`);
    } else {
        console.log(`User "${username}" has been made an admin.`);
    }
    db.close();
});
