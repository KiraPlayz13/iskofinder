const bcrypt = require('bcryptjs');

let dbInstance = null;

function setDatabase(db) {
    dbInstance = db;
    console.log('Database instance set in admin_accounts_api.js');
}

function getAllUsers(callback) {
    const query = 'SELECT id, username, email, location, is_admin, is_banned FROM users';
    dbInstance.all(query, [], (err, rows) => {
        callback(err, rows);
    });
}

function addUser(user, callback) {
    const { username, email, password, is_admin, location } = user;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const isAdminValue = is_admin ? 1 : 0;
    const query = 'INSERT INTO users (username, email, password, is_admin, is_banned, location) VALUES (?, ?, ?, ?, 0, ?)';
    dbInstance.run(query, [username, email, hashedPassword, isAdminValue, location], function(err) {
        callback(err, this ? this.lastID : null);
    });
}

function updateUser(userId, user, callback) {
    const { username, email, password, is_admin, location } = user;

    // Check if username already exists for another user
    const checkQuery = 'SELECT id FROM users WHERE username = ? AND id != ?';
    dbInstance.get(checkQuery, [username, userId], (err, row) => {
        if (err) {
            callback(err);
            return;
        }
        if (row) {
            callback(new Error('Username already exists'));
            return;
        }

        // Prepare update query and parameters
        let query = 'UPDATE users SET username = ?, email = ?, is_admin = ?, location = ?';
        const params = [username, email, is_admin ? 1 : 0, location];

        if (password) {
            const hashedPassword = bcrypt.hashSync(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        dbInstance.run(query, params, function(updateErr) {
            callback(updateErr, this ? this.changes : 0);
        });
    });
}

function deleteUser(userId, callback) {
    const query = 'DELETE FROM users WHERE id = ?';
    dbInstance.run(query, [userId], function(err) {
        callback(err, this ? this.changes : 0);
    });
}

function banUser(userId, ban, callback) {
    const isBannedValue = ban ? 1 : 0;
    const query = 'UPDATE users SET is_banned = ? WHERE id = ?';
    dbInstance.run(query, [isBannedValue, userId], function(err) {
        callback(err, this ? this.changes : 0);
    });
}

module.exports = {
    setDatabase,
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    banUser
};
