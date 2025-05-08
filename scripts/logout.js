export async function logout() {
    console.log('Logout function called');
    // Get authToken before clearing sessionStorage
    const authToken = sessionStorage.getItem('authToken');
    // Call server-side logout API to invalidate token if needed
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        if (!response.ok) {
            console.warn('Server logout failed');
        } else {
            console.log('Server logout successful');
        }
    } catch (error) {
        console.error('Error during server logout:', error);
    }
    // Clear client session storage after server logout call
    sessionStorage.clear();
    // Redirect to login page once
    window.location.href = 'login.html';
}
