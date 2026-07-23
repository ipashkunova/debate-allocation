/**
 * Allocation Algorithm
 * Rules:
 * - 4 teams (8 debaters) per room
 * - 1 judge per room
 * - Pair solo debaters together (novice-with-novice preferred)
 * - Auto-detect novice-priority rooms (if 5+ novices, fill rooms 1-2 with novices)
 */

async function runAllocation() {
    try {
        const snapshot = await DB.registrants().once('value');
        const registrants = snapshot.val() || {};
        
        // Convert to array for processing
        const teams = [];
        const judges = [];
        const solos = [];
        
        for (let key in registrants) {
            const reg = registrants[key];
            if (reg.type === 'team') {
                teams.push({ ...reg, id: key });
            } else if (reg.type === 'judge') {
                judges.push({ ...reg, id: key });
            } else if (reg.type === 'solo') {
                solos.push({ ...reg, id: key });
            }
        }
        
        // Pair solo debaters
        const pairedSolos = pairSoloDebaters(solos);
        
        // Count novices
        let noviceCount = 0;
        teams.forEach(t => {
            noviceCount += t.debaters.filter(d => d.novice).length;
        });
        pairedSolos.forEach(pair => {
            if (pair.novice1) noviceCount++;
            if (pair.novice2) noviceCount++;
        });
        judges.forEach(j => {
            if (j.novice) noviceCount++;
        });
        
        // Determine novice-priority rooms
        const novicePriorityRooms = Math.ceil(Math.max(0, noviceCount) / 8);
        
        // Create allocation
        const allocation = allocateToRooms(teams, pairedSolos, judges, novicePriorityRooms);
        
        // Save to database
        const allocationData = {};
        allocation.forEach((room, idx) => {
            allocationData[`room_${idx + 1}`] = room;
        });
        
        await DB.allocation().set(allocationData);
        
        return allocation;
    } catch (error) {
        console.error('Allocation error:', error);
        throw error;
    }
}

/**
 * Pair solo debaters together (novice-with-novice preferred)
 */
function pairSoloDebaters(solos) {
    if (solos.length === 0) return [];
    
    // Sort: novices first
    const sorted = [...solos].sort((a, b) => (b.novice ? 1 : 0) - (a.novice ? 1 : 0));
    
    const pairs = [];
    
    // First, pair novices together
    const novices = sorted.filter(s => s.novice);
    for (let i = 0; i < novices.length - 1; i += 2) {
        pairs.push({
            type: 'solo_pair',
            debater1: novices[i],
            debater2: novices[i + 1],
            novice1: novices[i].novice,
            novice2: novices[i + 1].novice,
            pairId: generateId()
        });
    }
    
    // If odd number of novices, pair last novice with an experienced
    const experienced = sorted.filter(s => !s.novice);
    let expIdx = 0;
    
    if (novices.length % 2 === 1) {
        pairs.push({
            type: 'solo_pair',
            debater1: novices[novices.length - 1],
            debater2: experienced[expIdx],
            novice1: true,
            novice2: false,
            pairId: generateId()
        });
        expIdx++;
    }
    
    // Pair remaining experienced
    for (let i = expIdx; i < experienced.length - 1; i += 2) {
        pairs.push({
            type: 'solo_pair',
            debater1: experienced[i],
            debater2: experienced[i + 1],
            novice1: false,
            novice2: false,
            pairId: generateId()
        });
    }
    
    return pairs;
}

/**
 * Allocate teams, solo pairs, and judges to rooms
 */
function allocateToRooms(teams, solos, judges, novicePriorityCount) {
    const rooms = [];
    let teamIdx = 0;
    let soloIdx = 0;
    let judgeIdx = 0;
    
    // Shuffle arrays for randomness
    teams = shuffleArray(teams);
    solos = shuffleArray(solos);
    judges = shuffleArray(judges);
    
    // Calculate required rooms
    const totalTeamsNeeded = teams.length + solos.length;
    const roomsNeeded = Math.ceil(totalTeamsNeeded / 4);
    
    for (let r = 0; r < roomsNeeded; r++) {
        const room = {
            roomNumber: r + 1,
            novicePriority: r < novicePriorityCount,
            og: null,
            oo: null,
            cg: null,
            co: null,
            judge: null
        };
        
        // Assign 4 teams (or teams/solos combined)
        const positions = ['og', 'oo', 'cg', 'co'];
        
        for (let i = 0; i < 4; i++) {
            if (teamIdx < teams.length) {
                room[positions[i]] = {
                    type: 'team',
                    team: teams[teamIdx],
                    teamId: teams[teamIdx].id
                };
                teamIdx++;
            } else if (soloIdx < solos.length) {
                room[positions[i]] = {
                    type: 'solo_pair',
                    pair: solos[soloIdx],
                    pairId: solos[soloIdx].pairId
                };
                soloIdx++;
            }
        }
        
        // Assign judge
        if (judgeIdx < judges.length) {
            room.judge = {
                type: 'judge',
                judge: judges[judgeIdx],
                judgeId: judges[judgeIdx].id
            };
            judgeIdx++;
        }
        
        rooms.push(room);
    }
    
    return rooms;
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}