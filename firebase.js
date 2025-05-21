const admin = require('firebase-admin');
const serviceAccount = require('./credentials/firebase.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://whatapp-bot-69643.firebaseio.com" // Optional, not needed for Firestore
});

// Get Firestore instance
const db = admin.firestore();

module.exports = db;
