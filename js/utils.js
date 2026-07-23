// Utility Functions

/**
 * Normalize a name for duplicate checking
 */
function normalizeName(name) {
    return name.trim().toLowerCase();
}

/**
 * Check if a name already exists in registrants
 */
async function checkDuplicate(name) {
    const normalized = normalizeName(name);
    const snapshot = await DB.registrants().once('value');
    const registrants = snapshot.val() || {};
    
    for (let key in registrants) {
        const reg = registrants[key];
        
        if (reg.type === 'team') {
            for (let debater of reg.debaters) {
                if (normalizeName(debater.name) === normalized) {
                    return true;
                }
            }
        } else if (reg.type === 'solo' || reg.type === 'judge') {
            if (normalizeName(reg.name) === normalized) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Generate a unique ID
 */
function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Show error message in form
 */
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 4000);
}

/**
 * Show success message in form
 */
function showSuccess(elementId, message) {
    const successEl = document.getElementById(elementId);
    successEl.textContent = message;
    successEl.classList.add('show');
    setTimeout(() => successEl.classList.remove('show'), 4000);
}

/**
 * Clear form inputs
 */
function clearForm(formId) {
    const form = document.getElementById(formId);
    form.reset();
    form.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.classList.remove('show');
    });
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Count registrants by type
 */
async function countRegistrants() {
    const snapshot = await DB.registrants().once('value');
    const registrants = snapshot.val() || {};
    
    let teams = 0, solos = 0, judges = 0;
    
    for (let key in registrants) {
        if (registrants[key].type === 'team') teams++;
        else if (registrants[key].type === 'solo') solos++;
        else if (registrants[key].type === 'judge') judges++;
    }
    
    return { teams, solos, judges, total: teams * 2 + solos + judges };
}

/**
 * Get all novice debaters count
 */
async function getNoviceCount() {
    const snapshot = await DB.registrants().once('value');
    const registrants = snapshot.val() || {};
    
    let count = 0;
    for (let key in registrants) {
        const reg = registrants[key];
        if (reg.type === 'team') {
            count += reg.debaters.filter(d => d.novice).length;
        } else if (reg.type === 'solo' && reg.novice) {
            count++;
        }
    }
    
    return count;
}