const API_BASE_URL = 'http://localhost:3000';

// Read token from URL query parameter and store in sessionStorage if present
const urlParams = new URLSearchParams(window.location.search);
const urlToken = urlParams.get('token');
if (urlToken) {
    sessionStorage.setItem('authToken', urlToken);
}

let authToken = sessionStorage.getItem('authToken');

const usersTableBody = document.getElementById('usersTableBody');
const messageDiv = document.getElementById('message');
const logoutBtn = document.getElementById('logoutBtn');
const addUserForm = document.getElementById('addUserForm');
const paginationContainer = document.getElementById('paginationControls');
const passwordInput = document.getElementById('passwordInput');
const showPasswordCheckbox = document.getElementById('showPasswordCheckbox');

import { logout } from '../scripts/logout.js';

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }
}

setupLogoutButton();

if (logoutBtn) {
    console.log('Logout button found, attaching event listener.');
    logoutBtn.addEventListener('click', () => {
        console.log('Logout button clicked.');
        logout();
    });
} else {
    console.log('Logout button not found.');
}

document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'logoutBtn') {
        console.log('Logout button clicked via document listener.');
    }
});

if (!authToken) {
    window.location.href = 'login.html';
}

let usersData = [];
let currentPage = 1;
const usersPerPage = 10;

let originalUsername = null;

const cancelEditBtn = document.getElementById('cancelEditBtn');
if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        resetFormToAdd();
    });
}

if (showPasswordCheckbox && passwordInput) {
    showPasswordCheckbox.addEventListener('change', () => {
        if (showPasswordCheckbox.checked) {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });
}

async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('loadUsers response status:', response.status);
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.error('Failed to load users:', errorData);
                throw new Error(errorData.error || 'Failed to load users');
            } else {
                const errorText = await response.text();
                console.error('Failed to load users (non-JSON):', errorText);
                throw new Error('Failed to load users: ' + errorText);
            }
        }
        usersData = await response.json();
        renderUsers();
        renderPaginationControls();
    } catch (error) {
        console.error('Error in loadUsers:', error);
        messageDiv.textContent = 'Error loading users: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

function renderUsers() {
    usersTableBody.innerHTML = '';

    const totalPages = Math.ceil(usersData.length / usersPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToShow = usersData.slice(startIndex, endIndex);

    usersToShow.forEach(user => {
        const tr = document.createElement('tr');

        const usernameTd = document.createElement('td');
        usernameTd.textContent = user.username;
        tr.appendChild(usernameTd);

        const emailTd = document.createElement('td');
        emailTd.textContent = user.email || '';
        tr.appendChild(emailTd);

        const locationTd = document.createElement('td');
        locationTd.textContent = user.location || '';
        tr.appendChild(locationTd);

        const adminTd = document.createElement('td');
        adminTd.textContent = user.is_admin ? 'Yes' : 'No';
        tr.appendChild(adminTd);

        const bannedTd = document.createElement('td');
        bannedTd.textContent = user.is_banned ? 'Yes' : 'No';
        tr.appendChild(bannedTd);

        const actionsTd = document.createElement('td');

        if (user.username !== sessionStorage.getItem('username')) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'user-actions-container';

            // Toggle admin button
            const toggleAdminBtn = document.createElement('button');
            toggleAdminBtn.textContent = user.is_admin ? 'Revoke Admin' : 'Make Admin';
            toggleAdminBtn.className = 'btn-toggle-admin';
            toggleAdminBtn.style.minWidth = '100px';
            toggleAdminBtn.addEventListener('click', () => toggleAdmin(user.id, !user.is_admin));
            buttonsContainer.appendChild(toggleAdminBtn);

            // Ban/unban button
            const banBtn = document.createElement('button');
            banBtn.textContent = user.is_banned ? 'Unban' : 'Ban';
            banBtn.className = 'btn-ban';
            banBtn.style.minWidth = '100px';
            banBtn.addEventListener('click', () => toggleBan(user.id, !user.is_banned));
            buttonsContainer.appendChild(banBtn);

            // Edit button
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            // Match minWidth, padding, margin to other buttons to avoid overlap
            editBtn.style.minWidth = '100px';
            editBtn.style.backgroundColor = '#6b7280';  // grey background
            editBtn.style.color = 'white';
            editBtn.style.padding = '0.4rem 0.8rem';  // reduced padding to match other buttons
            editBtn.style.borderRadius = '6px';
            editBtn.style.fontWeight = '700';
            editBtn.style.fontSize = '0.9rem';
            editBtn.style.border = 'none';  // remove border
            editBtn.style.cursor = 'pointer';
            editBtn.style.boxShadow = '0 3px 6px rgba(107, 114, 128, 0.4)';  // subtle grey shadow
            editBtn.style.transition = 'background-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease';
            editBtn.style.margin = '0 0 0 4px';  // margin-left 4px, no right margin to avoid overlap
            editBtn.addEventListener('mouseenter', () => {
                editBtn.style.backgroundColor = '#4b5563';  // darker grey on hover
                editBtn.style.color = 'white';
                editBtn.style.boxShadow = '0 6px 12px rgba(75, 85, 99, 0.6)';
            });
            editBtn.addEventListener('mouseleave', () => {
                editBtn.style.backgroundColor = '#6b7280';
                editBtn.style.color = 'white';
                editBtn.style.boxShadow = '0 3px 6px rgba(107, 114, 128, 0.4)';
            });
            editBtn.addEventListener('click', () => editUser(user));
            buttonsContainer.appendChild(editBtn);

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-delete';
            deleteBtn.style.minWidth = '100px';
            deleteBtn.addEventListener('click', () => deleteUser(user.id));
            buttonsContainer.appendChild(deleteBtn);

            actionsTd.appendChild(buttonsContainer);
        } else {
            actionsTd.textContent = 'N/A';
        }

        tr.appendChild(actionsTd);
        usersTableBody.appendChild(tr);
    });
}

function attachAddUserSubmitListener() {
    addUserForm.removeEventListener('submit', handleEditUserSubmit);
    addUserForm.addEventListener('submit', handleAddUserSubmit);
}

function attachEditUserSubmitListener(userId) {
    addUserForm.removeEventListener('submit', handleAddUserSubmit);
    addUserForm.addEventListener('submit', (e) => handleEditUserSubmit(e, userId), { once: true });
}

function resetFormToAdd() {
    addUserForm.reset();
    messageDiv.textContent = '';
    attachAddUserSubmitListener();

    // Show add new user button, hide save and cancel buttons
    const addNewUserBtn = document.getElementById('addNewUserBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (addNewUserBtn) addNewUserBtn.style.display = 'inline-block';
    if (addUserBtn) addUserBtn.style.display = 'none';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
}

function editUser(user) {
    // Store original username for comparison during edit submit
    originalUsername = user.username;

    // Populate the add user form with user data for editing
    addUserForm.username.value = user.username;
    addUserForm.email.value = user.email || '';
    addUserForm.password.value = '';
    addUserForm.is_admin.checked = user.is_admin;

    // Populate the existing location input in the form
    const locationInput = addUserForm.querySelector('input[name="location"]');
    if (locationInput) {
        locationInput.value = user.location || '';
    }

    // Change form submit handler to update user instead of add
    attachEditUserSubmitListener(user.id);

    // Show save and cancel buttons, hide add new user button
    const addNewUserBtn = document.getElementById('addNewUserBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (addNewUserBtn) addNewUserBtn.style.display = 'none';
    if (addUserBtn) addUserBtn.style.display = 'inline-block';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

    messageDiv.textContent = `Editing user: ${user.username}`;
    messageDiv.style.color = 'blue';
}

async function handleEditUserSubmit(event, userId) {
    event.preventDefault();

    const formData = new FormData(addUserForm);
    const username = formData.get('username');
    const email = formData.get('email');
    const location = formData.get('location');
    const password = formData.get('password');
    const is_admin = formData.get('is_admin') === 'on';

    if (!username) {
        messageDiv.textContent = 'Username is required.';
        messageDiv.style.color = 'red';
        return;
    }

    try {
        // Always send username and original_username in update payload
        const body = { username, original_username: originalUsername, email, location, is_admin };
        if (password) {
            body.password = password;
        }

        console.log('Update payload:', body);

        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user');
        }

        messageDiv.textContent = 'User updated successfully.';
        messageDiv.style.color = 'green';
        addUserForm.reset();
        loadUsers();

        // Restore form submit handler to add user
        attachAddUserSubmitListener();
    } catch (error) {
        messageDiv.textContent = 'Error: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

async function handleAddUserSubmit(event) {
    event.preventDefault();
    const formData = new FormData(addUserForm);
    const username = formData.get('username');
    const email = formData.get('email');
    const location = formData.get('location');
    const password = formData.get('password');
    const is_admin = formData.get('is_admin') === 'on';

    if (!username || !password) {
        messageDiv.textContent = 'Username and password are required.';
        messageDiv.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ username, email, location, password, is_admin })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add user');
        }
        messageDiv.textContent = 'User added successfully.';
        messageDiv.style.color = 'green';
        addUserForm.reset();
        loadUsers();
    } catch (error) {
        messageDiv.textContent = 'Error: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

// New functions to fix toggleBan and toggleAdmin

async function toggleBan(userId, ban) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ ban })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update ban status');
        }
        // Reload users to reflect changes
        await loadUsers();
    } catch (error) {
        console.error('Error toggling ban status:', error);
        messageDiv.textContent = 'Error toggling ban status: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

async function toggleAdmin(userId, makeAdmin) {
    try {
        // Fetch current user data to update is_admin field
        const user = usersData.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }
        const updatedUser = {
            username: user.username,
            email: user.email,
            location: user.location,
            is_admin: makeAdmin
        };
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedUser)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update admin status');
        }
        // Reload users to reflect changes
        await loadUsers();
    } catch (error) {
        console.error('Error toggling admin status:', error);
        messageDiv.textContent = 'Error toggling admin status: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const termsModal = document.getElementById('termsModal');
    const openTermsModalLink = document.getElementById('openTermsModal');
    const closeTermsModalBtn = document.getElementById('closeTermsModal');

    if (openTermsModalLink) {
        openTermsModalLink.addEventListener('click', (event) => {
            event.preventDefault();
            if (termsModal) {
                termsModal.style.display = 'block';
            }
        });
    }

    if (closeTermsModalBtn) {
        closeTermsModalBtn.addEventListener('click', () => {
            if (termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }

    // Optional: Close modal when clicking outside modal content
    if (termsModal) {
        termsModal.addEventListener('click', (event) => {
            if (event.target === termsModal) {
                termsModal.style.display = 'none';
            }
        });
    }
});

loadUsers();
renderPaginationControls();
resetFormToAdd();

function renderPaginationControls() {
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(usersData.length / usersPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cursor = prevBtn.disabled ? 'default' : 'pointer';
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderUsers();
            renderPaginationControls();
        }
    });
    paginationContainer.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.textContent = i;
        pageBtn.disabled = i === currentPage;
        pageBtn.style.fontWeight = i === currentPage ? 'bold' : 'normal';
        pageBtn.style.cursor = i === currentPage ? 'default' : 'pointer';
        pageBtn.addEventListener('click', () => {
            if (i !== currentPage) {
                currentPage = i;
                renderUsers();
                renderPaginationControls();
            }
        });
        paginationContainer.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cursor = nextBtn.disabled ? 'default' : 'pointer';
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderUsers();
            renderPaginationControls();
        }
    });
    paginationContainer.appendChild(nextBtn);
}
