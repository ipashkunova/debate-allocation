// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();
const ref = (path) => db.ref(path);

// Global Database References
const DB = {
    meetings: () => ref('meetings'),
    currentMeeting: () => {
        const today = new Date().toISOString().split('T')[0];
        return ref(`meetings/${today}`);
    },
    registrants: () => {
        const today = new Date().toISOString().split('T')[0];
        return ref(`meetings/${today}/registrants`);
    },
    allocation: () => {
        const today = new Date().toISOString().split('T')[0];
        return ref(`meetings/${today}/allocation`);
    }
};

// Check if today's meeting exists, if not create it
async function initTodaysMeeting() {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await DB.currentMeeting().once('value');
    
    if (!snapshot.exists()) {
        await DB.currentMeeting().set({
            date: today,
            status: 'draft',
            registrants: {},
            allocation: {}
        });
    }
}

// Initialize on page load
initTodaysMeeting();