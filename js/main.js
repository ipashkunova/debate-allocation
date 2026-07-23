// Main App Logic

// Navigation
document.getElementById('nav-home').addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('page-registration');
    document.getElementById('nav-home').classList.add('active');
    document.getElementById('nav-admin').classList.remove('active');
});

document.getElementById('nav-admin').addEventListener('click', (e) => {
    e.preventDefault();
    switchPage('page-admin');
    document.getElementById('nav-admin').classList.add('active');
    document.getElementById('nav-home').classList.remove('active');
});

function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // If admin page and not authenticated, show login
    if (pageId === 'page-admin') {
        if (adminAuthenticated) {
            document.getElementById('admin-login').classList.add('hidden');
            document.getElementById('admin-dashboard').classList.remove('hidden');
        } else {
            document.getElementById('admin-login').classList.remove('hidden');
            document.getElementById('admin-dashboard').classList.add('hidden');
        }
    }
}

// Modal Overlay Close
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-past-meetings').classList.add('hidden');
    }
});

// Initialize app
console.log('Debate Allocation System Ready');