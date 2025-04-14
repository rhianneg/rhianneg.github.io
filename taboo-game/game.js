

// Start the game (host only)
async function startPlaying() {
    if (!gameState.isHost) return;
    
    try {
      const gameRef = database.ref(`games/${gameState.gameCode}`);
      
      // Get the first word
      const firstWord = await getNextWord();
      
      // Update game status and set first word
      await gameRef.update({
        status: 'playing',
        currentWord: firstWord
      });
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
      const availableWords = gameData.words.filter(
        (_, index) => !gameData.usedWords.includes(index)
      );
      
      if (availableWords.length === 0) {
        // End the game if all words are used
        await gameRef.update({ status: 'finished' });
        return null;
      }
      
      // Pick a random word from available words
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const wordIndex = gameData.words.indexOf(availableWords[randomIndex]);
      const selectedWord = gameData.words[wordIndex];
      
      // Mark this word as used
      const usedWords = [...gameData.usedWords, wordIndex];
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
      
      wordToGuess.textContent = word.targetWord;
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
      } else {
        document.body.classList.remove('is-current-player');
        document.body.classList.add('is-guesser');
      }
    }
  }
  
  // Handle when the current player reports a correct guess
  async function handleGuessedCorrectly() {
    if (!isCurrentPlayer()) return;
    
    try {
      // Update the score for the current player
      const playerRef = database.ref(`games/${gameState.gameCode}/players`);
      const players = gameState.players;
      const currentPlayer = players[gameState.currentPlayerIndex];
      
      // Find player index in Firebase
      const playerSnapshot = await playerRef.once('value');
      const playerData = playerSnapshot.val();
      let playerKey = null;
      
      Object.keys(playerData).forEach(key => {
        if (playerData[key].id === currentPlayer.id) {
          playerKey = key;
        }
      });
      
      if (playerKey) {
        // Increment the score
        await playerRef.child(playerKey).update({
          score: (currentPlayer.score || 0) + 1
        });
      }
      
      // Move to the next player
      await moveToNextPlayer();
    } catch (error) {
      console.error("Error handling correct guess:", error);
    }
  }
  
  // Handle when the current player wants to skip a word
  async function handleSkipWord() {
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
  }
  
  // Check if the current user is the current player
  function isCurrentPlayer() {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer && currentPlayer.id === gameState.playerId;
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
    if (!gameState.isHost) return;
    
    try {
      const gameRef = database.ref(`games/${gameState.gameCode}`);
      
      // Reset game state
      await gameRef.update({
        status: 'waiting',
        currentPlayerIndex: 0,
        usedWords: [],
        words: shuffleArray([...tabooWords])
      });
      
      // Reset all player scores
      const players = gameState.players;
      const playerUpdates = {};
      
      players.forEach((player, index) => {
        playerUpdates[`players/${index}/score`] = 0;
      });
      
      await gameRef.update(playerUpdates);
      
      // Show waiting room
      showScreen('waitingRoom');
    } catch (error) {
      console.error("Error restarting game:", error);
      alert("There was an error restarting the game. Please try again.");
    }
  }
  
  // Go back to home screen
  function goHome() {
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
  }import tabooWords from './words.js';
  import { database } from './firebase-config.js';
  
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
    // Attach event listeners to buttons
    createGameBtn.addEventListener('click', () => showScreen('createGame'));
    joinGameBtn.addEventListener('click', () => showScreen('joinGame'));
    startGameBtn.addEventListener('click', createGame);
    joinBtn.addEventListener('click', joinGame);
    startPlayingBtn.addEventListener('click', startPlaying);
    guessedBtn.addEventListener('click', handleGuessedCorrectly);
    skipBtn.addEventListener('click', handleSkipWord);
    playAgainBtn.addEventListener('click', restartGame);
    homeBtn.addEventListener('click', goHome);
    
    // Add back button functionality
    backBtns.forEach(btn => {
      btn.addEventListener('click', () => showScreen('home'));
    });
    
    // Generate a unique ID for this player's session
    gameState.playerId = generatePlayerId();
  }
  
  // Helper functions
  
  // Show a specific screen and hide others
  function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
      screens[key].classList.remove('active');
    });
    screens[screenName].classList.add('active');
  }
  
  // Setup listeners for game state changes
  function setupGameListeners() {
    const gameRef = database.ref(`games/${gameState.gameCode}`);
    
    // Listen for player changes
    gameRef.child('players').on('value', snapshot => {
      const players = snapshot.val();
      if (players) {
        gameState.players = Object.values(players);
        updatePlayerList();
      }
    });
    
    // Listen for game status changes
    gameRef.child('status').on('value', snapshot => {
      const status = snapshot.val();
      gameState.gameStatus = status;
      
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
      updateGameView();
    });
    
    // Listen for current word changes
    gameRef.child('currentWord').on('value', snapshot => {
      const word = snapshot.val();
      if (word) {
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
  
  // Create a new game
  // Join an existing game
  async function joinGame() {
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
      
      // Add player to the game
      const playerRef = database.ref(`games/${gameCode}/players`);
      const newPlayerRef = playerRef.push();
      
      await newPlayerRef.set({
        id: gameState.playerId,
        name: playerName,
        score: 0,
        isHost: false
      });
      
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
    } catch (error) {
      console.error("Error joining game:", error);
      alert("There was an error joining the game. Please try again.");
    }
  }
  
  // Create a new game
  async function createGame() {
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
        players: [{
          id: gameState.playerId,
          name: playerName,
          score: 0,
          isHost: true
        }],
        currentPlayerIndex: 0,
        usedWords: [],
        words: shuffleArray([...tabooWords])
      });
      
      // Listen for changes in the game
      setupGameListeners();
      
      // Show the waiting room
      displayGameCode.textContent = gameCode;
      showScreen('waitingRoom');
      
      // Add host-specific UI
      document.body.classList.add('is-host');
      document.body.classList.remove('is-guest');
    } catch (error) {
      console.error("Error creating game:", error);
      alert("There was an error creating the game. Please try again.");
    }