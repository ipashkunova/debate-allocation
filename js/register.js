// Registration Form Handlers

// Tab Switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`tab-${tabName}`).classList.add('active');
        this.classList.add('active');
    });
});

// Team Registration Handler
document.getElementById('form-team').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const debater1Name = document.getElementById('team-debater1').value;
    const debater1Novice = document.querySelector('#tab-team .form-group:nth-child(1) .novice-check').checked;
    const debater2Name = document.getElementById('team-debater2').value;
    const debater2Novice = document.querySelector('#tab-team .form-group:nth-child(2) .novice-check').checked;
    
    // Check for duplicates
    if (await checkDuplicate(debater1Name)) {
        showError('team-error', `"${debater1Name}" is already registered.`);
        return;
    }
    
    if (await checkDuplicate(debater2Name)) {
        showError('team-error', `"${debater2Name}" is already registered.`);
        return;
    }
    
    try {
        const teamId = generateId();
        const teamData = {
            type: 'team',
            id: teamId,
            debaters: [
                { name: debater1Name, novice: debater1Novice },
                { name: debater2Name, novice: debater2Novice }
            ],
            registeredAt: new Date().toISOString()
        };
        
        await DB.registrants().child(teamId).set(teamData);
        
        showSuccess('team-success', `Team registered: ${debater1Name} & ${debater2Name}`);
        clearForm('form-team');
        updateRegistrantsList();
    } catch (error) {
        showError('team-error', 'Error registering team. Please try again.');
        console.error(error);
    }
});

// Solo Registration Handler
document.getElementById('form-solo').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const soloName = document.getElementById('solo-name').value;
    const soloNovice = document.getElementById('solo-novice').checked;
    
    // Check for duplicate
    if (await checkDuplicate(soloName)) {
        showError('solo-error', `"${soloName}" is already registered.`);
        return;
    }
    
    try {
        const soloId = generateId();
        const soloData = {
            type: 'solo',
            id: soloId,
            name: soloName,
            novice: soloNovice,
            registeredAt: new Date().toISOString()
        };
        
        await DB.registrants().child(soloId).set(soloData);
        
        showSuccess('solo-success', `Solo registration confirmed: ${soloName}`);
        clearForm('form-solo');
        updateRegistrantsList();
    } catch (error) {
        showError('solo-error', 'Error registering. Please try again.');
        console.error(error);
    }
});

// Judge Registration Handler
document.getElementById('form-judge').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const judgeName = document.getElementById('judge-name').value;
    const judgeNovice = document.getElementById('judge-novice').checked;
    
    // Check for duplicate
    if (await checkDuplicate(judgeName)) {
        showError('judge-error', `"${judgeName}" is already registered.`);
        return;
    }
    
    try {
        const judgeId = generateId();
        const judgeData = {
            type: 'judge',
            id: judgeId,
            name: judgeName,
            novice: judgeNovice,
            registeredAt: new Date().toISOString()
        };
        
        await DB.registrants().child(judgeId).set(judgeData);
        
        const judgeType = judgeNovice ? 'Novice Judge' : 'Experienced Judge';
        showSuccess('judge-success', `${judgeType} registered: ${judgeName}`);
        clearForm('form-judge');
        updateRegistrantsList();
    } catch (error) {
        showError('judge-error', 'Error registering judge. Please try again.');
        console.error(error);
    }
});

// Update Registrants List
function updateRegistrantsList() {
    DB.registrants().on('value', (snapshot) => {
        const registrants = snapshot.val() || {};
        const container = document.getElementById('registrants-container');
        
        if (Object.keys(registrants).length === 0) {
            container.innerHTML = '<p class="placeholder">No registrations yet</p>';
            return;
        }
        
        let html = '';
        
        for (let key in registrants) {
            const reg = registrants[key];
            
            if (reg.type === 'team') {
                const deb1 = reg.debaters[0];
                const deb2 = reg.debaters[1];
                const noviceBadge1 = deb1.novice ? '<span class="registrant-badge">Novice</span>' : '';
                const noviceBadge2 = deb2.novice ? '<span class="registrant-badge">Novice</span>' : '';
                
                html += `
                    <div class="registrant-card">
                        <h4>Team</h4>
                        <p><strong>${deb1.name}</strong> ${noviceBadge1}</p>
                        <p><strong>${deb2.name}</strong> ${noviceBadge2}</p>
                    </div>
                `;
            } else if (reg.type === 'solo') {
                const badge = reg.novice ? '<span class="registrant-badge">Novice</span>' : '';
                html += `
                    <div class="registrant-card">
                        <h4>Solo Debater</h4>
                        <p><strong>${reg.name}</strong> ${badge}</p>
                    </div>
                `;
            } else if (reg.type === 'judge') {
                const badge = reg.novice ? '<span class="registrant-badge">Novice Judge</span>' : '<span class="registrant-badge">Judge</span>';
                html += `
                    <div class="registrant-card">
                        <h4>Judge</h4>
                        <p><strong>${reg.name}</strong> ${badge}</p>
                    </div>
                `;
            }
        }
        
        container.innerHTML = html;
    });
}

// Initialize
updateRegistrantsList();