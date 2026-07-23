// Admin Dashboard Logic

let adminAuthenticated = false;
let currentAllocation = null;
let editMode = false;

// Admin Login
document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        adminAuthenticated = true;
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById('admin-login').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        loadAdminDashboard();
        document.getElementById('admin-password').value = '';
    } else {
        showError('login-error', 'Incorrect password.');
        document.getElementById('admin-password').value = '';
    }
});

// Check admin auth on page load
if (sessionStorage.getItem('adminAuth') === 'true') {
    adminAuthenticated = true;
}

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    adminAuthenticated = false;
    sessionStorage.removeItem('adminAuth');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-password').value = '';
});

// Load Admin Dashboard
async function loadAdminDashboard() {
    const counts = await countRegistrants();
    document.getElementById('meeting-info').innerHTML = `
        Registrants: ${counts.total} people | Teams: ${counts.teams} | Solos: ${counts.solos} | Judges: ${counts.judges}
    `;
    
    loadRegistrantsList();
    loadAllocationView();
}

// Load Registrants List in Admin
async function loadRegistrantsList() {
    DB.registrants().on('value', async (snapshot) => {
        const registrants = snapshot.val() || {};
        const container = document.getElementById('admin-registrants');
        
        if (Object.keys(registrants).length === 0) {
            container.innerHTML = '<p class="placeholder">No registrations yet</p>';
            return;
        }
        
        let html = '';
        
        for (let key in registrants) {
            const reg = registrants[key];
            let cardContent = '';
            
            if (reg.type === 'team') {
                const names = reg.debaters.map(d => d.name).join(' & ');
                cardContent = `
                    <div class="admin-registrant-info">
                        <h4>Team: ${names}</h4>
                        <p>${reg.debaters.map(d => d.novice ? 'Novice' : 'Experienced').join(', ')}</p>
                    </div>
                `;
            } else if (reg.type === 'solo') {
                cardContent = `
                    <div class="admin-registrant-info">
                        <h4>Solo: ${reg.name}</h4>
                        <p>${reg.novice ? 'Novice' : 'Experienced'}</p>
                    </div>
                `;
            } else if (reg.type === 'judge') {
                cardContent = `
                    <div class="admin-registrant-info">
                        <h4>Judge: ${reg.name}</h4>
                        <p>${reg.novice ? 'Novice Judge' : 'Experienced Judge'}</p>
                    </div>
                `;
            }
            
            html += `
                <div class="admin-registrant-card">
                    ${cardContent}
                    <div class="admin-registrant-actions">
                        <button class="btn btn-secondary" onclick="removeRegistrant('${key}')">❌ Remove</button>
                        <button class="btn btn-secondary" onclick="editRegistrant('${key}')">✏️ Edit</button>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    });
}

// Remove Registrant
async function removeRegistrant(id) {
    if (confirm('Are you sure you want to remove this registrant?')) {
        await DB.registrants().child(id).remove();
        loadAdminDashboard();
    }
}

// Edit Registrant (placeholder for now)
function editRegistrant(id) {
    alert('Edit functionality coming soon.');
}

// Allocate Button
document.getElementById('btn-allocate').addEventListener('click', async () => {
    try {
        document.getElementById('btn-allocate').disabled = true;
        document.getElementById('btn-allocate').textContent = '🎲 Allocating...';
        
        const allocation = await runAllocation();
        currentAllocation = allocation;
        editMode = false;
        
        document.getElementById('btn-allocate').disabled = false;
        document.getElementById('btn-allocate').textContent = '🎲 Allocate';
        document.getElementById('btn-manual-edit').disabled = false;
        document.getElementById('btn-publish').disabled = false;
        
        displayAllocation(allocation);
    } catch (error) {
        alert('Error running allocation: ' + error.message);
        document.getElementById('btn-allocate').disabled = false;
        document.getElementById('btn-allocate').textContent = '🎲 Allocate';
    }
});

// Manual Edit Button
document.getElementById('btn-manual-edit').addEventListener('click', () => {
    editMode = !editMode;
    if (editMode) {
        document.getElementById('btn-manual-edit').textContent = '📋 Done Editing';
        document.getElementById('btn-manual-edit').style.backgroundColor = '#ff9800';
    } else {
        document.getElementById('btn-manual-edit').textContent = '📋 Manual Edit';
        document.getElementById('btn-manual-edit').style.backgroundColor = '';
    }
    displayAllocation(currentAllocation);
});

// Publish Button
document.getElementById('btn-publish').addEventListener('click', async () => {
    try {
        await DB.allocation().update({ published: true });
        document.getElementById('btn-publish').disabled = true;
        alert('Allocation published! It is now visible on the live view.');
        loadAllocationView();
    } catch (error) {
        alert('Error publishing allocation: ' + error.message);
    }
});

// Display Allocation
async function displayAllocation(allocation) {
    if (!allocation || allocation.length === 0) {
        document.getElementById('allocation-view').innerHTML = '<p class="placeholder">No allocation yet.</p>';
        return;
    }
    
    let html = '';
    
    for (let room of allocation) {
        const roomNum = room.roomNumber;
        const badge = room.novicePriority ? '<span class="novice-badge">Novice Priority</span>' : '';
        
        html += `
            <div class="room-card" data-room="${roomNum}">
                <div class="room-header">
                    <h4>Room ${roomNum} ${badge}</h4>
                </div>
        `;
        
        // Display teams
        for (let position of ['og', 'oo', 'cg', 'co']) {
            const entry = room[position];
            if (!entry) continue;
            
            let teamName = 'Empty';
            if (entry.type === 'team') {
                teamName = entry.team.debaters.map(d => d.name).join(' & ');
            } else if (entry.type === 'solo_pair') {
                teamName = entry.pair.debater1.name + ' & ' + entry.pair.debater2.name;
            }
            
            if (editMode) {
                html += `
                    <div class="room-team">
                        <span class="team-role">${position.toUpperCase()}</span>
                        <input type="text" class="team-edit" value="${teamName}" data-position="${position}" data-room="${roomNum}">
                        <button class="btn btn-secondary edit-remove-btn" onclick="swapTeams(this)">Swap</button>
                    </div>
                `;
            } else {
                html += `
                    <div class="room-team">
                        <span class="team-role">${position.toUpperCase()}</span>
                        <span class="team-name">${teamName}</span>
                    </div>
                `;
            }
        }
        
        // Display judge
        if (room.judge) {
            const judgeName = room.judge.judge.name;
            html += `
                <div class="room-team">
                    <span class="team-role">Judge</span>
                    <span class="team-name">${judgeName}</span>
                </div>
            `;
        }
        
        html += `</div>`;
    }
    
    document.getElementById('allocation-view').innerHTML = html;
}

// Swap Teams (placeholder)
function swapTeams(btn) {
    alert('Drag-and-drop swap functionality can be implemented here.');
}

// Load Allocation View
async function loadAllocationView() {
    DB.allocation().once('value', async (snapshot) => {
        const allocation = snapshot.val();
        
        if (!allocation || !allocation.published) {
            document.getElementById('live-rooms').innerHTML = '<p class="placeholder">No allocation published yet.</p>';
            return;
        }
        
        let html = '';
        
        for (let roomKey in allocation) {
            if (roomKey === 'published') continue;
            
            const room = allocation[roomKey];
            const roomNum = room.roomNumber;
            
            html += `
                <div class="live-room-card">
                    <div class="live-room-header">
                        <h3>Room ${roomNum}</h3>
                        ${room.novicePriority ? '<span class="novice-badge">Novice Priority</span>' : ''}
                    </div>
            `;
            
            for (let position of ['og', 'oo', 'cg', 'co']) {
                const entry = room[position];
                if (!entry) continue;
                
                let teamName = 'Empty';
                if (entry.type === 'team') {
                    teamName = entry.team.debaters.map(d => d.name).join(' & ');
                } else if (entry.type === 'solo_pair') {
                    teamName = entry.pair.debater1.name + ' & ' + entry.pair.debater2.name;
                }
                
                html += `
                    <div class="live-team">
                        <span class="live-team-role">${position.toUpperCase()}</span>
                        <span class="live-team-name">${teamName}</span>
                    </div>
                `;
            }
            
            if (room.judge) {
                const judgeName = room.judge.judge.name;
                html += `
                    <div class="live-team">
                        <span class="live-team-role">Judge</span>
                        <span class="live-team-name">${judgeName}</span>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        document.getElementById('live-rooms').innerHTML = html;
    });
}

// Past Meetings Modal
document.getElementById('btn-past-meetings').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-past-meetings').classList.remove('hidden');
    loadPastMeetings();
});

// Close Modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-past-meetings').classList.add('hidden');
});

// Load Past Meetings
async function loadPastMeetings() {
    const snapshot = await DB.meetings().once('value');
    const meetings = snapshot.val() || {};
    
    const today = getTodayDate();
    const pastMeetings = [];
    
    for (let date in meetings) {
        if (date !== today) {
            const regs = meetings[date].registrants || {};
            const regCount = Object.keys(regs).length;
            pastMeetings.push({
                date: date,
                displayDate: formatDate(date),
                registrants: regCount
            });
        }
    }
    
    if (pastMeetings.length === 0) {
        document.getElementById('past-meetings-list').innerHTML = '<p class="placeholder">No past meetings.</p>';
        return;
    }
    
    let html = '';
    pastMeetings.forEach(meeting => {
        html += `
            <div class="past-meeting-item" onclick="viewPastMeeting('${meeting.date}')">
                <div class="past-meeting-date">${meeting.displayDate}</div>
                <div class="past-meeting-stats">${meeting.registrants} registrants</div>
            </div>
        `;
    });
    
    document.getElementById('past-meetings-list').innerHTML = html;
}

// View Past Meeting (placeholder)
function viewPastMeeting(date) {
    alert(`Viewing past meeting for ${formatDate(date)}`);
    // Can expand to show registrants and allocation for that date
}

// New Meeting Button
document.getElementById('btn-new-meeting').addEventListener('click', async () => {
    if (confirm('Create a new meeting for tomorrow? Current registrations will be archived.')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        await DB.meetings().child(tomorrowDate).set({
            date: tomorrowDate,
            status: 'draft',
            registrants: {},
            allocation: {}
        });
        
        window.location.reload();
    }
});