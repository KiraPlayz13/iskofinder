

const API_BASE_URL = 'http://localhost:3000';
let authToken = sessionStorage.getItem('authToken') || null;

// DOM elements
const addScholarshipBtn = document.getElementById('addScholarshipBtn');
const showRequirementsBtn = document.getElementById('showRequirementsBtn');
const requirementsModal = document.getElementById('requirementsModal');
const closeRequirementsBtn = document.getElementById('closeRequirementsBtn');

showRequirementsBtn.addEventListener('click', showRequirementsModal);
closeRequirementsBtn.addEventListener('click', hideRequirementsModal);

// Show Requirements Modal
function showRequirementsModal() {
    requirementsModal.style.display = 'flex';
}

// Hide Requirements Modal
function hideRequirementsModal() {
    requirementsModal.style.display = 'none';
}
const scholarshipsTable = document.getElementById('scholarshipsTable').querySelector('tbody');
const scholarshipModal = document.getElementById('scholarshipModal');
const modalTitle = document.getElementById('modalTitle');
const scholarshipForm = document.getElementById('scholarshipForm');
const cancelBtn = document.getElementById('cancelBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Event listeners
loginBtn.addEventListener('click', handleLogin);
addScholarshipBtn.addEventListener('click', showAddScholarshipModal);
cancelBtn.addEventListener('click', hideModal);
scholarshipForm.addEventListener('submit', handleScholarshipSubmit);

import { logout } from './scripts/logout.js';

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        logout();
        // After logout, redirect to login page forcibly
        window.location.href = '/login.html';
    });
}

// Load scholarships
async function loadScholarships() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/scholarships`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load scholarships');
        }

        const scholarships = await response.json();
        renderScholarships(scholarships);
    } catch (error) {
        console.error('Error loading scholarships:', error);
    }
}

// Render scholarships table
function renderScholarships(scholarships) {
    scholarshipsTable.innerHTML = '';
    
    scholarships.forEach(scholarship => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${scholarship.title}</td>
            <td>$${scholarship.amount.toLocaleString()}</td>
            <td>${scholarship.degree.charAt(0).toUpperCase() + scholarship.degree.slice(1)}</td>
            <td>${new Date(scholarship.deadline).toLocaleDateString()}</td>
            <td>
                <button class="btn edit-btn" data-id="${scholarship.id}">Edit</button>
                <button class="btn delete-btn" data-id="${scholarship.id}">Delete</button>
            </td>
        `;
        
        scholarshipsTable.appendChild(row);
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showEditScholarshipModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteScholarship(btn.dataset.id));
    });
}

// Modal functions
function showAddScholarshipModal() {
    modalTitle.textContent = 'Add Scholarship';
    scholarshipForm.reset();
    document.getElementById('scholarshipId').value = '';
    document.getElementById('modalActive').checked = true;
    showModal();
}

async function showEditScholarshipModal(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/scholarships/${id}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load scholarship');
        }

        const scholarship = await response.json();
        
        modalTitle.textContent = 'Edit Scholarship';
        document.getElementById('scholarshipId').value = scholarship.id;
        document.getElementById('modalTitleInput').value = scholarship.title;
        document.getElementById('modalDescription').value = scholarship.description;
        document.getElementById('modalRequirements').value = scholarship.requirements || '';
        document.getElementById('modalAmount').value = scholarship.amount;
        document.getElementById('modalDegree').value = scholarship.degree;
        document.getElementById('modalDeadline').value = scholarship.deadline.split('T')[0];
        document.getElementById('modalActive').checked = scholarship.is_active === 1;
        
        showModal();
    } catch (error) {
        console.error('Error loading scholarship:', error);
    }
}

function showModal() {
    scholarshipModal.style.display = 'flex';
}

function hideModal() {
    scholarshipModal.style.display = 'none';
}

// Save scholarship function
async function saveScholarship() {
    const id = document.getElementById('scholarshipId').value;
    const isNew = id === '';

    const scholarship = {
        title: document.getElementById('modalTitleInput').value,
        description: document.getElementById('modalDescription').value,
        requirements: document.getElementById('modalRequirements').value,
        amount: parseInt(document.getElementById('modalAmount').value),
        degree: document.getElementById('modalDegree').value,
        deadline: document.getElementById('modalDeadline').value,
        is_active: document.getElementById('modalActive').checked ? 1 : 0
    };

    try {
        const url = isNew 
            ? `${API_BASE_URL}/api/admin/scholarships`
            : `${API_BASE_URL}/api/admin/scholarships/${id}`;
            
        const method = isNew ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(scholarship)
        });

        if (!response.ok) {
            throw new Error('Failed to save scholarship');
        }

        hideModal();
        loadScholarships();
    } catch (error) {
        console.error('Error saving scholarship:', error);
    }
}

// Cancel editing/adding scholarship
function cancelEdit() {
    hideModal();
}

// Handle form submission
async function handleScholarshipSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('scholarshipId').value;
    const isNew = id === '';
    
        const scholarship = {
            title: document.getElementById('modalTitleInput').value,
            description: document.getElementById('modalDescription').value,
            requirements: document.getElementById('modalRequirements').value,
            amount: parseInt(document.getElementById('modalAmount').value),
        degree: document.getElementById('modalDegree').value,
        deadline: document.getElementById('modalDeadline').value,
        is_active: document.getElementById('modalActive').checked ? 1 : 0
    };

    try {
        const url = isNew 
            ? `${API_BASE_URL}/api/admin/scholarships`
            : `${API_BASE_URL}/api/admin/scholarships/${id}`;
            
        const method = isNew ? 'POST' : 'PUT';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(scholarship)
        });

        if (!response.ok) {
            throw new Error('Failed to save scholarship');
        }

        hideModal();
        loadScholarships();
    } catch (error) {
        console.error('Error saving scholarship:', error);
    }
}

// Delete scholarship
async function deleteScholarship(id) {
    if (!confirm('Are you sure you want to delete this scholarship?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/scholarships/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete scholarship');
        }

        loadScholarships();
    } catch (error) {
        console.error('Error deleting scholarship:', error);
    }
}

const clearLoginFields = () => {
    const usernameInput = document.querySelector('form#addUserForm input[name="username"]');
    const passwordInput = document.querySelector('form#addUserForm input[name="password"]');
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
};

