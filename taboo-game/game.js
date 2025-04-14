// Game state
let gameState = {
  gameCode: null,
  playerId: null,
  playerName: null,
  isHost: false,
  players: [],
  currentWordIndex: 0,
  currentPlayerIndex: 0,
  usedWords: [],
  gameStatus: 'waiting' // waiting, playing, finished
};

// DOM Elements
const screens = {
  home: document.getElementById('home-screen'),
  createGame: document.getElementById('create-game-screen'),
  joinGame: document.getElementById('join-game-screen'),
  waitingRoom: document.getElementById('waiting-room-screen'),
  game: document.getElementById('game-screen'),
  gameOver: document.getElementById('game-over-screen')
};

// Buttons
const createGameBtn = document.getElementById('create-game-btn');
const joinGameBtn = document.getElementById('join-game-btn');
const startGameBtn = document.getElementById('start-game-btn');
const joinBtn = document.getElementById('join-btn');
const startPlayingBtn = document.getElementById('start-playing-btn');
const guessedBtn = document.getElementById('guessed-btn');
const skipBtn = document.getElementById('skip-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const homeBtn = document.getElementById('home-btn');
const backBtns = document.querySelectorAll('.back-btn');

// Input fields
const creatorNameInput = document.getElementById('creator-name');
const playerNameInput = document.getElementById('player-name');
const gameCodeInput = document.getElementById('game-code');

// Display elements
const displayGameCode = document.getElementById('display-game-code');
const playerList = document.getElementById('player-list');
const currentPlayerName = document.getElementById('current-player-name');
const targetWord = document.getElementById('target-word');
const tabooWordsList = document.getElementById('taboo-words-list');
const wordToGuess = document.getElementById('word-to-guess');
const scoreList = document.getElementById('score-list');
const finalScoreList = document.getElementById('final-score-list');

// Initialize the application when DOM content is loaded
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  console.log('Initializing game...');
  
  // Attach event listeners to buttons
  createGameBtn.addEventListener('click', function() {
    console.log('Create Game button clicked');
    showScreen('createGame');
  });
  
  joinGameBtn.addEventListener('click', function() {
    console.log('Join Game button clicked');
    showScreen('joinGame');
  });
  
  startGameBtn.addEventListener('click', createGame);
  joinBtn.addEventListener('click', joinGame);
  startPlayingBtn.addEventListener('click', startPlaying);
  guessedBtn.addEventListener('click', handleGuessedCorrectly);
  skipBtn.addEventListener('click', handleSkipWord);
  playAgainBtn.addEventListener('click', restartGame);
  homeBtn.addEventListener('click', goHome);
  
  // Add back button functionality
  backBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      console.log('Back button clicked');
      showScreen('home');
    });
  });
  
  // Generate a unique ID for this player's session
  gameState.playerId = generatePlayerId();
  
  console.log('Game initialized with player ID:', gameState.playerId);
}

// Helper functions

// Show a specific screen and hide others
function showScreen(screenName) {
  console.log('Showing screen:', screenName);
  
  Object.keys(screens).forEach(key => {
    screens[key].classList.remove('active');
  });
  screens[screenName].classList.add('active');
}

// Generate a random 4-digit code for the game
function generateGameCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate a unique ID for the player
function generatePlayerId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Join an existing game
async function joinGame() {
  console.log('Attempting to join game...');
  
  const playerName = playerNameInput.value.trim();
  const gameCode = gameCodeInput.value.trim();
  
  if (!playerName || !gameCode) {
    alert('Please enter your name and game code');
    return;
  }
  
  try {
    // Check if game exists
    const gameSnapshot = await database.ref(`games/${gameCode}`).once('value');
    const gameData = gameSnapshot.val();
    
    if (!gameData) {
      alert('Game not found. Please check the code and try again.');
      return;
    }
    
    if (gameData.status === 'finished') {
      alert('This game has already ended.');
      return;
    }
    
    console.log('Game found:', gameData);
    
    // Add player to the game
    const newPlayer = {
      id: gameState.playerId,
      name: playerName,
      score: 0,
      isHost: false
    };
    
    await database.ref(`games/${gameCode}/players`).push(newPlayer);
    
    // Set up game state
    gameState.gameCode = gameCode;
    gameState.playerName = playerName;
    gameState.isHost = false;
    
    // Listen for changes in the game
    setupGameListeners();
    
    // Show the waiting room
    displayGameCode.textContent = gameCode;
    showScreen('waitingRoom');
    
    // Add guest-specific UI
    document.body.classList.add('is-guest');
    document.body.classList.remove('is-host');
    
    console.log('Successfully joined game:', gameCode);
  } catch (error) {
    console.error("Error joining game:", error);
    alert("There was an error joining the game. Please try again.");
  }
}

// Create a new game
async function createGame() {
  console.log('Creating new game...');
  
  const playerName = creatorNameInput.value.trim();
  if (!playerName) {
    alert('Please enter your name');
    return;
  }
  
  // Generate a game code
  const gameCode = generateGameCode();
  
  // Set up game state
  gameState.gameCode = gameCode;
  gameState.playerName = playerName;
  gameState.isHost = true;
  
  try {
    // Create a new game in Firebase
    await database.ref(`games/${gameCode}`).set({
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      status: 'waiting',
      currentPlayerIndex: 0,
      usedWords: [],
      words: tabooWords
    });
    
    // Add host player
    const hostPlayer = {
      id: gameState.playerId,
      name: playerName,
      score: 0,
      isHost: true
    };
    
    await database.ref(`games/${gameCode}/players`).push(hostPlayer);
    
    // Listen for changes in the game
    setupGameListeners();
    
    // Show the waiting room
    displayGameCode.textContent = gameCode;
    showScreen('waitingRoom');
    
    // Add host-specific UI
    document.body.classList.add('is-host');
    document.body.classList.remove('is-guest');
    
    console.log('Game created with code:', gameCode);
  } catch (error) {
    console.error("Error creating game:", error);
    alert("There was an error creating the game. Please try again.");
  }
}

// Setup listeners for game state changes
function setupGameListeners() {
  console.log('Setting up game listeners for game:', gameState.gameCode);
  
  const gameRef = database.ref(`games/${gameState.gameCode}`);
  
  // Listen for player changes
  gameRef.child('players').on('value', snapshot => {
    const playersData = snapshot.val();
    if (playersData) {
      gameState.players = Object.values(playersData);
      updatePlayerList();
      console.log('Players updated:', gameState.players);
    }
  });
  
  // Listen for game status changes
  gameRef.child('status').on('value', snapshot => {
    const status = snapshot.val();
    gameState.gameStatus = status;
    
    console.log('Game status changed to:', status);
    
    if (status === 'playing') {
      showScreen('game');
      if (gameState.isHost) {
        startPlayingBtn.disabled = true;
      }
    } else if (status === 'finished') {
      showScreen('gameOver');
      updateFinalScores();
    }
  });
  
  // Listen for current player changes
  gameRef.child('currentPlayerIndex').on('value', snapshot => {
    const index = snapshot.val();
    gameState.currentPlayerIndex = index;
    console.log('Current player index changed to:', index);
    updateGameView();
  });
  
  // Listen for current word changes
  gameRef.child('currentWord').on('value', snapshot => {
    const word = snapshot.val();
    if (word) {
      console.log('Current word changed:', word);
      updateWordDisplay(word);
    }
  });
}

// Update the player list in the waiting room
function updatePlayerList() {
  playerList.innerHTML = '';
  
  gameState.players.forEach(player => {
    const li = document.createElement('li');
    li.textContent = player.name;
    if (player.isHost) {
      li.classList.add('host-player');
    }
    playerList.appendChild(li);
  });
}

// Update the score list during gameplay
function updateScoreList() {
  scoreList.innerHTML = '';
  
  gameState.players.forEach(player => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="player-name">${player.name}</span><span class="player-score">${player.score}</span>`;
    scoreList.appendChild(li);
  });
}

// Start the game (host only)
async function startPlaying() {
  console.log('Starting the game...');
  
  if (!gameState.isHost) return;
  
  try {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    
    // Get the first word
    const firstWord = await getNextWord();
    
    if (firstWord) {
      // Update game status and set first word
      await gameRef.update({
        status: 'playing',
        currentWord: firstWord
      });
      
      console.log('Game started with first word:', firstWord);
    } else {
      console.error('Could not get first word');
    }
  } catch (error) {
    console.error("Error starting game:", error);
    alert("There was an error starting the game. Please try again.");
  }
}

// Get the next word from the list
async function getNextWord() {
  try {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    const gameSnapshot = await gameRef.once('value');
    const gameData = gameSnapshot.val();
    
    // Find a word that hasn't been used yet
    const availableWordIndices = [];
    
    for (let i = 0; i < gameData.words.length; i++) {
      if (!gameData.usedWords || !gameData.usedWords.includes(i)) {
        availableWordIndices.push(i);
      }
    }
    
    console.log('Available word indices:', availableWordIndices);
    
    if (availableWordIndices.length === 0) {
      // End the game if all words are used
      await gameRef.update({ status: 'finished' });
      return null;
    }
    
    // Pick a random word from available words
    const randomIndex = Math.floor(Math.random() * availableWordIndices.length);
    const wordIndex = availableWordIndices[randomIndex];
    const selectedWord = gameData.words[wordIndex];
    
    console.log('Selected word index:', wordIndex);
    
    // Mark this word as used
    const usedWords = gameData.usedWords ? [...gameData.usedWords, wordIndex] : [wordIndex];
    await gameRef.update({ usedWords });
    
    return selectedWord;
  } catch (error) {
    console.error("Error getting next word:", error);
    return null;
  }
}

// Update the word display based on player role
function updateWordDisplay(word) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayer = currentPlayer && currentPlayer.id === gameState.playerId;
  
  console.log('Updating word display. Current player?', isCurrentPlayer);
  
  if (isCurrentPlayer) {
    // Current player sees the full card
    document.body.classList.add('is-current-player');
    document.body.classList.remove('is-guesser');
    
    targetWord.textContent = word.targetWord;
    
    tabooWordsList.innerHTML = '';
    word.tabooWords.forEach(tabooWord => {
      const div = document.createElement('div');
      div.classList.add('taboo-word');
      div.textContent = tabooWord;
      tabooWordsList.appendChild(div);
    });
  } else {
    // Other players just see the word to guess
    document.body.classList.remove('is-current-player');
    document.body.classList.add('is-guesser');
    
    wordToGuess.textContent = "????? (Word Hidden)";
  }
  
  // Update current player display
  if (currentPlayer) {
    currentPlayerName.textContent = currentPlayer.name;
  }
}

// Update the game view based on current state
function updateGameView() {
  // Update scores
  updateScoreList();
  
  // Get current player
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Update UI based on current player
  if (currentPlayer) {
    currentPlayerName.textContent = currentPlayer.name;
    
    const isCurrentPlayer = currentPlayer.id === gameState.playerId;
    if (isCurrentPlayer) {
      document.body.classList.add('is-current-player');
      document.body.classList.remove('is-guesser');
      
      // Make sure the card is visible
      document.getElementById('taboo-card-container').classList.remove('hidden');
      document.getElementById('guesser-view').classList.add('hidden');
    } else {
      document.body.classList.remove('is-current-player');
      document.body.classList.add('is-guesser');
      
      // Make sure the guesser view is visible
      document.getElementById('taboo-card-container').classList.add('hidden');
      document.getElementById('guesser-view').classList.remove('hidden');
    }
  }
}

// Check if the current user is the current player
function isCurrentPlayer() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  return currentPlayer && currentPlayer.id === gameState.playerId;
}

// Handle when the current player reports a correct guess
async function handleGuessedCorrectly() {
  console.log('Guessed correctly!');
  
  if (!isCurrentPlayer()) return;
  
  try {
    // Find current player in Firebase
    const playersRef = database.ref(`games/${gameState.gameCode}/players`);
    const playersSnapshot = await playersRef.once('value');
    const playersData = playersSnapshot.val();
    
    // Find the player key for the current player
    let currentPlayerKey = null;
    Object.keys(playersData).forEach(key => {
      if (playersData[key].id === gameState.players[gameState.currentPlayerIndex].id) {
        currentPlayerKey = key;
      }
    });
    
    if (currentPlayerKey) {
      // Increment the score
      const currentScore = playersData[currentPlayerKey].score || 0;
      await playersRef.child(currentPlayerKey).update({
        score: currentScore + 1
      });
      
      console.log('Incremented score for player:', currentPlayerKey);
    }
    
    // Move to the next player
    await moveToNextPlayer();
  } catch (error) {
    console.error("Error handling correct guess:", error);
  }
}

// Handle when the current player wants to skip a word
async function handleSkipWord() {
  console.log('Skipping word...');
  
  if (!isCurrentPlayer()) return;
  
  try {
    // Move to the next player without updating score
    await moveToNextPlayer();
  } catch (error) {
    console.error("Error skipping word:", error);
  }
}

// Move to the next player and get a new word
async function moveToNextPlayer() {
  console.log('Moving to next player...');
  
  try {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    const gameSnapshot = await gameRef.once('value');
    const gameData = gameSnapshot.val();
    
    // Calculate the next player index
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Get a new word
    const nextWord = await getNextWord();
    
    if (nextWord) {
      // Update game state with next player and word
      await gameRef.update({
        currentPlayerIndex: nextPlayerIndex,
        currentWord: nextWord
      });
    }
  } catch (error) {
    console.error("Error moving to next player:", error);
  }
}

// Update the final scores on the game over screen
function updateFinalScores() {
  finalScoreList.innerHTML = '';
  
  // Sort players by score (highest first)
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  
  sortedPlayers.forEach(player => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="player-name">${player.name}</span><span class="player-score">${player.score}</span>`;
    finalScoreList.appendChild(li);
  });
}

// Restart the game (host only)
async function restartGame() {
  console.log('Restarting the game...');
  
  if (!gameState.isHost) return;
  
  try {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    
    // Reset game state
    await gameRef.update({
      status: 'waiting',
      currentPlayerIndex: 0,
      usedWords: []
    });
    
    // Reset all player scores
    const playersRef = database.ref(`games/${gameState.gameCode}/players`);
    const playersSnapshot = await playersRef.once('value');
    const playersData = playersSnapshot.val();
    
    if (playersData) {
      const playerUpdates = {};
      
      Object.keys(playersData).forEach(key => {
        playerUpdates[`${key}/score`] = 0;
      });
      
      await playersRef.update(playerUpdates);
    }
    
    // Show waiting room
    showScreen('waitingRoom');
    
    console.log('Game restarted successfully');
  } catch (error) {
    console.error("Error restarting game:", error);
    alert("There was an error restarting the game. Please try again.");
  }
}

// Go back to home screen
function goHome() {
  console.log('Returning to home screen...');
  
  // Clean up listeners if we were in a game
  if (gameState.gameCode) {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    gameRef.off(); // Remove all listeners
    
    // If we're the host and leaving, delete the game
    if (gameState.isHost) {
      gameRef.remove()
        .catch(error => console.error("Error removing game:", error));
    }
  }
  
  // Reset game state
  gameState = {
    gameCode: null,
    playerId: gameState.playerId, // Keep the same player ID
    playerName: null,
    isHost: false,
    players: [],
    currentWordIndex: 0,
    currentPlayerIndex: 0,
    usedWords: [],
    gameStatus: 'waiting'
  };
  
  // Reset UI
  document.body.classList.remove('is-host', 'is-guest', 'is-current-player', 'is-guesser');
  
  // Clear inputs
  creatorNameInput.value = '';
  playerNameInput.value = '';
  gameCodeInput.value = '';
  
  // Show home screen
  showScreen('home');
}