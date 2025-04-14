// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhOVOlK0-uPt18298PpL8TdTeoZBFpBvQ",
  authDomain: "taboo-game-9e193.firebaseapp.com",
  databaseURL: "https://taboo-game-9e193-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "taboo-game-9e193",
  storageBucket: "taboo-game-9e193.firebasestorage.app",
  messagingSenderId: "979911415930",
  appId: "1:979911415930:web:78554271d4d806d54a03c3",
  measurementId: "G-ZJW18CJVY1"
};
  
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();