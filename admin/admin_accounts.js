const API_BASE_URL = 'https://your-backend-url.com';

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
const paginationContainerTop = document.getElementById('paginationControlsTop');
const paginationContainerBottom = document.getElementById('paginationControls');
const searchInput = document.getElementById('userSearchInput');

let originalUsername = null;
let editingUserId = null;

let usersData = [];
let filteredUsersData = [];
let currentPage = 1;
const usersPerPage = 10;

// Create and insert search button, sorting dropdown, and clear button beside search input
function createSearchAndSortControls() {
    if (!searchInput) return;

    // Create container div for search and sort controls
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.gap = '10px';
    container.style.marginTop = '1rem';
    container.style.marginBottom = '1rem';

    // Move existing search input into container
    searchInput.parentNode.insertBefore(container, searchInput);
    container.appendChild(searchInput);

    // Create search button
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Search';
    searchButton.style.padding = '0.5rem 1rem';
    searchButton.style.borderRadius = '4px';
    searchButton.style.border = '1px solid #2563eb';
    searchButton.style.backgroundColor = '#2563eb';
    searchButton.style.color = 'white';
    searchButton.style.cursor = 'pointer';
    container.appendChild(searchButton);

    // Create sorting dropdown
    const sortSelect = document.createElement('select');
    sortSelect.style.padding = '0.5rem';
    sortSelect.style.borderRadius = '4px';
    sortSelect.style.border = '1px solid #2563eb';
    sortSelect.style.color = '#2563eb';
    sortSelect.title = 'Sort users';

    const options = [
        // Removed the 'Sort by' option as it is just a label and does not sort
        { value: 'creation', text: 'Creation Date' },
        { value: 'banned', text: 'Banned Users' },
        { value: 'admin', text: 'Admins' },
        { value: 'normal', text: 'Normal Users' },
        { value: 'email', text: 'Email A-Z' },
        { value: 'username', text: 'Username A-Z' },
        { value: 'location', text: 'Location A-Z' }
    ];

    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        sortSelect.appendChild(option);
    });

    container.appendChild(sortSelect);

    // Create clear/reset button
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.padding = '0.5rem 1rem';
    clearButton.style.borderRadius = '4px';
    clearButton.style.border = '1px solid #2563eb';
    clearButton.style.backgroundColor = '#2563eb';
    clearButton.style.color = 'white';
    clearButton.style.cursor = 'pointer';
    container.appendChild(clearButton);

    // Style search button to match clear and sorter buttons
    searchButton.style.backgroundColor = '#2563eb';
    searchButton.style.color = 'white';

    // Event listeners
    searchButton.addEventListener('click', () => {
        searchUsers();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchUsers();
        }
    });

    sortSelect.addEventListener('change', () => {
        renderUsers();
        renderPaginationControlsTop();
        renderPaginationControls();
    });

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        sortSelect.value = '';
        filteredUsersData = usersData;
        currentPage = 1;
        renderUsers();
        renderPaginationControlsTop();
        renderPaginationControls();
    });
}

// Fix cancel button functionality to reset form and UI state
const cancelEditBtn = document.getElementById('cancelEditBtn');
if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        resetAddUserForm();
    });
}

const showPasswordCheckbox = document.getElementById('showPasswordCheckbox');
const passwordInput = document.getElementById('passwordInput');

if (showPasswordCheckbox && passwordInput) {
    showPasswordCheckbox.addEventListener('change', () => {
        if (showPasswordCheckbox.checked) {
            passwordInput.type = 'text';
        } else {
            passwordInput.type = 'password';
        }
    });
}

// Add logout button event listener
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('username');
        window.location.href = 'login.html';
    });
}

// Add form submit event listener to call saveUserEdits
// Removed duplicate declaration of addUserForm, using existing variable
if (addUserForm) {
    addUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserEdits();
    });
}

// Implement deleteUser function with confirmation modal
async function deleteUser(userId) {
    if (!userId) return;

    // Create confirmation modal dynamically
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '1.5rem';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    modalContent.style.textAlign = 'center';
    modalContent.style.maxWidth = '400px';
    modalContent.style.width = '90%';

    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to delete this user? This action cannot be undone.';
    message.style.marginBottom = '1rem';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'center';
    btnContainer.style.gap = '1rem';

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Delete';
    confirmBtn.style.backgroundColor = '#d64545';
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = 'none';
    confirmBtn.style.padding = '0.5rem 1rem';
    confirmBtn.style.borderRadius = '4px';
    confirmBtn.style.cursor = 'pointer';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.backgroundColor = '#2563eb';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.padding = '0.5rem 1rem';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';

    btnContainer.appendChild(confirmBtn);
    btnContainer.appendChild(cancelBtn);

    modalContent.appendChild(message);
    modalContent.appendChild(btnContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Cancel button closes modal
    cancelBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Confirm button deletes user and closes modal
    confirmBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }
            await loadUsers();
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        } finally {
            document.body.removeChild(modal);
        }
    });
}

// Implement toggleBan function to toggle banned status of a user
async function toggleBan(userId, banStatus) {
    if (!userId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ ban: banStatus })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update ban status');
        }
        await loadUsers();
    } catch (error) {
        alert('Error updating ban status: ' + error.message);
    }
}

// Implement toggleAdmin function to toggle admin status of a user
async function toggleAdmin(userId, adminStatus) {
    if (!userId) return;
    try {
        // Find user in current usersData instead of fetching all users
        const user = usersData.find(u => u.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Update is_admin status
        const updatedUser = {
            username: user.username,
            email: user.email,
            location: user.location,
            is_admin: adminStatus
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
        await loadUsers();
    } catch (error) {
        alert('Error updating admin status: ' + error.message);
    }
}

// Update renderUsers to add edit button for logged-in admin as well
let sortedUsersCache = {};
function renderUsers() {
    usersTableBody.innerHTML = '';

    // Get current sort criteria from dropdown if exists
    const sortSelect = document.querySelector('select[title="Sort users"]');
    let sortCriteria = sortSelect ? sortSelect.value : '';

    // Default to alphabetical if no sort selected
    if (!sortCriteria) {
        sortCriteria = 'username';
        if (sortSelect) {
            sortSelect.value = 'username';
        }
    }

    // Use cached sorted users if available
    let sortedUsers;
    if (sortedUsersCache[sortCriteria]) {
        sortedUsers = sortedUsersCache[sortCriteria];
    } else {
        sortedUsers = sortUsers(filteredUsersData, sortCriteria);
        sortedUsersCache[sortCriteria] = sortedUsers;
    }

    const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;

    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToShow = sortedUsers.slice(startIndex, endIndex);

    // Use document fragment to minimize reflows
    const fragment = document.createDocumentFragment();

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

        // Add edit button for logged-in admin as well
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'user-actions-container';

        // Toggle admin button (skip for logged-in user to avoid self-demotion)
        if (user.username !== sessionStorage.getItem('username')) {
            const toggleAdminBtn = document.createElement('button');
            toggleAdminBtn.textContent = user.is_admin ? 'Revoke Admin' : 'Make Admin';
            toggleAdminBtn.className = 'btn-toggle-admin';
            toggleAdminBtn.style.minWidth = '100px';
            toggleAdminBtn.addEventListener('click', () => toggleAdmin(user.id, !user.is_admin));
            buttonsContainer.appendChild(toggleAdminBtn);
        }

        // Ban/unban button (skip for logged-in user to avoid self-ban)
        if (user.username !== sessionStorage.getItem('username')) {
            const banBtn = document.createElement('button');
            banBtn.textContent = user.is_banned ? 'Unban' : 'Ban';
            banBtn.className = 'btn-ban';
            banBtn.style.minWidth = '100px';
            banBtn.addEventListener('click', () => toggleBan(user.id, !user.is_banned));
            buttonsContainer.appendChild(banBtn);
        }

        // Edit button for all users including logged-in user
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.minWidth = '100px';
        editBtn.style.backgroundColor = '#6b7280';
        editBtn.style.color = 'white';
        editBtn.style.padding = '0.4rem 0.8rem';
        editBtn.style.borderRadius = '6px';
        editBtn.style.fontWeight = '700';
        editBtn.style.fontSize = '0.9rem';
        editBtn.style.border = 'none';
        editBtn.style.cursor = 'pointer';
        editBtn.style.boxShadow = '0 3px 6px rgba(107, 114, 128, 0.4)';
        editBtn.style.transition = 'background-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease';
        editBtn.style.margin = '0 0 0 4px';
        editBtn.addEventListener('mouseenter', () => {
            editBtn.style.backgroundColor = '#4b5563';
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

        // Delete button (skip for logged-in user)
        if (user.username !== sessionStorage.getItem('username')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-delete';
            deleteBtn.style.minWidth = '100px';
            deleteBtn.addEventListener('click', () => deleteUser(user.id));
            buttonsContainer.appendChild(deleteBtn);
        }

        actionsTd.appendChild(buttonsContainer);

        tr.appendChild(actionsTd);
        fragment.appendChild(tr);
    });

    usersTableBody.appendChild(fragment);
}

// Render pagination controls (top and bottom)
function renderPaginationControls() {
    renderPaginationControlsAt(paginationContainerBottom);
}

function renderPaginationControlsTop() {
    renderPaginationControlsAt(paginationContainerTop);
}

function renderPaginationControlsAt(container) {
    if (!container) return;
    container.innerHTML = '';

    const totalPages = Math.ceil(filteredUsersData.length / usersPerPage);
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
            renderPaginationControlsTop();
        }
    });
    container.appendChild(prevBtn);

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
                renderPaginationControlsTop();
            }
        });
        container.appendChild(pageBtn);
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
            renderPaginationControlsTop();
        }
    });
    container.appendChild(nextBtn);
}

let debounceTimeout = null;
searchInput.addEventListener('input', () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        searchUsers();
    }, 300);
});

// Search users by username, email, or location
function searchUsers() {
    if (!searchInput) return;
    const searchTerm = searchInput.value.trim().toLowerCase();

    if (!searchTerm) {
        filteredUsersData = usersData;
    } else {
        filteredUsersData = usersData.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.location && user.location.toLowerCase().includes(searchTerm))
        );
    }
    currentPage = 1;
    renderUsers();
    renderPaginationControls();
    renderPaginationControlsTop();
}

// Initialize search and sort controls and load users on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    createSearchAndSortControls();
    loadUsers();

    // Dynamically create formModeInstruction element if not present
    const formModeText = document.getElementById('formModeText');
    if (formModeText && !document.getElementById('formModeInstruction')) {
        const instruction = document.createElement('div');
        instruction.id = 'formModeInstruction';
        instruction.style.fontSize = '0.85rem';
        instruction.style.color = '#555';
        instruction.style.marginTop = '0.25rem';
        instruction.style.display = 'none';
        instruction.textContent = 'Details can be left blank if they do not need to be edited.';
        formModeText.parentNode.insertBefore(instruction, formModeText.nextSibling);
    }
});

// Load users from API
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load users');
        }
        usersData = await response.json();
        filteredUsersData = usersData;
        currentPage = 1;
        renderUsers();
        renderPaginationControlsTop();
        renderPaginationControls();
    } catch (error) {
        messageDiv.textContent = 'Error loading users: ' + error.message;
        messageDiv.style.color = 'red';
    }
}

// Sort users with logged-in admin on top, then by selected criteria
function sortUsers(users, criteria = '') {
    const loggedInUsername = sessionStorage.getItem('username');

    // Put logged-in user on top
    let sorted = users.slice().sort((a, b) => {
        if (a.username === loggedInUsername) return -1;
        if (b.username === loggedInUsername) return 1;
        return 0;
    });

    // Then sort by criteria
    switch (criteria) {
        case 'creation':
            // Assuming users have a 'created_at' field as ISO string or timestamp
            sorted = sorted.slice().sort((a, b) => {
                if (!a.created_at) return 1;
                if (!b.created_at) return -1;
                return new Date(a.created_at) - new Date(b.created_at);
            });
            break;
        case 'banned':
            sorted = sorted.slice().sort((a, b) => {
                if (a.is_banned === b.is_banned) return 0;
                return a.is_banned ? -1 : 1;
            });
            break;
        case 'admin':
            sorted = sorted.slice().sort((a, b) => {
                if (a.is_admin === b.is_admin) return 0;
                return a.is_admin ? -1 : 1;
            });
            break;
        case 'normal':
            sorted = sorted.slice().sort((a, b) => {
                if ((!a.is_admin && !a.is_banned) === (!b.is_admin && !b.is_banned)) return 0;
                return (!a.is_admin && !a.is_banned) ? -1 : 1;
            });
            break;
        case 'email':
            sorted = sorted.slice().sort((a, b) => {
                if (!a.email) return 1;
                if (!b.email) return -1;
                return a.email.localeCompare(b.email);
            });
            break;
        case 'username':
            sorted = sorted.slice().sort((a, b) => a.username.localeCompare(b.username));
            break;
        case 'location':
            sorted = sorted.slice().sort((a, b) => {
                if (!a.location) return 1;
                if (!b.location) return -1;
                return a.location.localeCompare(b.location);
            });
            break;
        default:
            // Default to alphabetical by username
            sorted = sorted.slice().sort((a, b) => a.username.localeCompare(b.username));
            break;
    }

    return sorted;
}

function editUser(user) {
    if (!user) return;
    editingUserId = user.id;

    const form = document.getElementById('addUserForm');
    if (!form) {
        alert('Add user form not found.');
        return;
    }

    // Set username field (editable)
    const usernameInput = form.querySelector('input[name="username"]');
    usernameInput.value = user.username;
    usernameInput.disabled = false;

    // Set email
    const emailInput = form.querySelector('input[name="email"]');
    emailInput.value = user.email || '';

    // Set location
    const locationInput = form.querySelector('input[name="location"]');
    locationInput.value = user.location || '';

    // Clear password field (optional to change)
    const passwordInput = form.querySelector('input[name="password"]');
    passwordInput.value = '';
    passwordInput.required = false;

    // Remove references to new_password input (field removed)

    // Set admin checkbox
    const adminCheckbox = form.querySelector('input[name="is_admin"]');
    adminCheckbox.checked = user.is_admin;

    // Show Save and Cancel buttons, hide Add New User button
    const addNewUserBtn = document.getElementById('addNewUserBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    addNewUserBtn.style.display = 'none';
    addUserBtn.style.display = 'inline-block';
    cancelEditBtn.style.display = 'inline-block';

    // Update form mode text and show instruction
    const formModeText = document.getElementById('formModeText');
    if (formModeText) {
        formModeText.textContent = 'Edit Account';
    }
    const formModeInstruction = document.getElementById('formModeInstruction');
    if (formModeInstruction) {
        formModeInstruction.style.display = 'block';
    }

    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth' });
}

async function saveUserEdits() {
    if (!editingUserId) return;

    const form = document.getElementById('addUserForm');
    if (!form) {
        alert('Add user form not found.');
        return;
    }

    const usernameInput = form.querySelector('input[name="username"]');
    const emailInput = form.querySelector('input[name="email"]');
    const locationInput = form.querySelector('input[name="location"]');
    const adminCheckbox = form.querySelector('input[name="is_admin"]');

    // Find the original user data to keep unchanged fields
    const originalUser = usersData.find(user => user.id === editingUserId);
    if (!originalUser) {
        alert('Original user data not found.');
        return;
    }

    const updatedUser = {
        username: usernameInput.value.trim() || originalUser.username,
        email: emailInput.value.trim() || originalUser.email,
        location: locationInput.value.trim() || originalUser.location,
        is_admin: adminCheckbox.checked
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(updatedUser)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update user');
        }

        // Reset form and UI state
        resetAddUserForm();
        await loadUsers();
    } catch (error) {
        alert('Error saving user: ' + error.message);
    }
}

function resetAddUserForm() {
    const form = document.getElementById('addUserForm');
    if (!form) return;

    // Clear all fields
    form.reset();

    // Enable username input and set password field required
    const usernameInput = form.querySelector('input[name="username"]');
    usernameInput.disabled = false;

    const passwordInput = form.querySelector('input[name="password"]');
    passwordInput.required = true;

    // Removed new_password field handling

    // Show Add New User button, hide Save and Cancel buttons
    const addNewUserBtn = document.getElementById('addNewUserBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    addNewUserBtn.style.display = 'inline-block';
    addUserBtn.style.display = 'none';
    cancelEditBtn.style.display = 'none';

    editingUserId = null;

    // Reset form mode text and hide instruction
    const formModeText = document.getElementById('formModeText');
    if (formModeText) {
        formModeText.textContent = 'Create an Account';
    }
    const formModeInstruction = document.getElementById('formModeInstruction');
    if (formModeInstruction) {
        formModeInstruction.style.display = 'none';
    }
}
