# ACS Debate Club – British Parliamentary Debate Allocation System

A responsive web application for managing weekly debate club allocations supporting team registration, solo debater registration, judge registration, and automated allocation to debate rooms.

## Features

✅ **Team Registration** – Register two debaters with experience levels (novice/experienced)
✅ **Solo Registration** – Solo debaters register and are auto-paired at allocation time
✅ **Judge Registration** – Judges register with experience level
✅ **Live Allocation** – Admin-only view of room assignments
✅ **Automatic Allocation** – Smart algorithm that pairs solos and distributes teams
✅ **Novice-Priority Rooms** – Auto-detects and fills rooms with novices first
✅ **Manual Edits** – Admin can edit assignments without triggering recalculation
✅ **Publish/Archive** – Allocations can be published and past meetings archived
✅ **Duplicate Prevention** – Name normalization to prevent duplicate registrations
✅ **Session-Based Auth** – Password-gated admin access

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Realtime Database
- **Hosting**: Firebase Hosting
- **Colors**: Purple (#2a044d), Light Purple (#caabe8), Gold (#efd23b)

## Project Structure

```
debate-allocation/
├── index.html                    # Main page
├── css/
│   └── styles.css               # Global styles
├── js/
│   ├── config.js                # Firebase config & constants
│   ├── firebase-init.js         # Firebase initialization
│   ├── utils.js                 # Utility functions
│   ├── allocation-algo.js       # Allocation algorithm
│   ├── register.js              # Registration handlers
│   ├── admin.js                 # Admin dashboard logic
│   └── main.js                  # Main app logic
└── README.md
```

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ipashkunova/debate-allocation.git
cd debate-allocation
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing): "debate-allocation"
3. Enable **Realtime Database**:
   - Go to Realtime Database
   - Create Database (choose region, start in test mode for development)
4. Enable **Hosting**:
   - Go to Hosting
   - Install Firebase CLI: `npm install -g firebase-tools`

### 3. Configure Firebase Credentials

Update `js/config.js` with your Firebase credentials:

```javascript
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const ADMIN_PASSWORD = "your_secure_password"; // Change this!
```

### 4. Deploy to Firebase Hosting

```bash
firebase login
firebase init hosting
firebase deploy
```

Your app is now live at: `https://your-project.web.app`

## Usage

### For Debaters/Judges (Registration Page)
1. Navigate to the **Register** tab
2. Choose registration type (Team, Solo, or Judge)
3. Enter name(s) and experience level
4. Click **Register**

### For Admins (Admin Dashboard)
1. Navigate to **Admin** tab
2. Enter the admin password (set in `config.js`)
3. View all registrants
4. Click **🎲 Allocate** to run the allocation algorithm
5. Optionally click **📋 Manual Edit** to adjust assignments
6. Click **✅ Publish** to make allocation live
7. Click **📊 View Past Meetings** to archive

## Allocation Algorithm

The system automatically:
- Pairs solo debaters together (novice-with-novice preferred)
- Randomly distributes teams across rooms
- Auto-detects if 5+ novices exist and marks rooms 1–2 as "novice-priority"
- Assigns judges to rooms
- Can be re-run by admin as a "draft" before publishing

## Database Schema

```
/meetings
  /{date}
    /date: "YYYY-MM-DD"
    /status: "draft" | "published"
    /registrants
      /{id}
        /type: "team" | "solo" | "judge"
        /name: "John Smith"  (for solo/judge)
        /debaters: [ { name, novice }, ... ]  (for team)
        /novice: boolean
        /registeredAt: timestamp
    /allocation
      /{room_id}
        /roomNumber: 1
        /novicePriority: boolean
        /og: { type, team/pair }
        /oo: { type, team/pair }
        /cg: { type, team/pair }
        /co: { type, team/pair }
        /judge: { type, judge }
```

## Security Notes

⚠️ **Password Storage**: The current implementation stores the admin password in plain text. For production:
- Use bcrypt or Argon2 hashing
- Implement Firebase Authentication instead
- Use environment variables for secrets

## Future Enhancements

- [ ] User authentication (OAuth)
- [ ] Email notifications
- [ ] Detailed analytics & history
- [ ] Customizable room preferences
- [ ] Debate round tracking
- [ ] Mobile app

## License

MIT

## Support

For issues or questions, contact: ipashkunova@example.com
