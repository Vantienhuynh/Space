// ===== MAIN GAME INITIALIZATION =====

// Global variables that need to be accessible across files
let canvas, ctx;
let scoreEl, powerUpsStatusEl, enemyCountEl, gameOverModal, finalScore, restartButton;
let helpButton, helpModal, closeHelpButton;
let leaderboardButton, leaderboardModal, closeLeaderboardButton;
let nameInputModal, playerNameInput, nextToDifficultyButton;
let difficultyModal, easyModeButton, hardModeButton, insaneModeButton, backToNameButton;
let saveScoreButton, leaderboardList;
let upgradeModal, upgradeDamageButton, upgradePierceButton, upgradeSizeButton;

document.addEventListener('DOMContentLoaded', () => {
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Get DOM elements
    scoreEl = document.getElementById('scoreEl');
    powerUpsStatusEl = document.getElementById('powerUpsStatus');
    enemyCountEl = document.getElementById('enemyCount');
    gameOverModal = document.getElementById('gameOverModal');
    finalScore = document.getElementById('finalScore');
    restartButton = document.getElementById('restartButton');
    helpButton = document.getElementById('helpButton');
    helpModal = document.getElementById('helpModal');
    closeHelpButton = document.getElementById('closeHelpButton');
    leaderboardButton = document.getElementById('leaderboardButton');
    leaderboardModal = document.getElementById('leaderboardModal');
    closeLeaderboardButton = document.getElementById('closeLeaderboardButton');
    nameInputModal = document.getElementById('nameInputModal');
    playerNameInput = document.getElementById('playerNameInput');
    nextToDifficultyButton = document.getElementById('nextToDifficultyButton');
    difficultyModal = document.getElementById('difficultyModal');
    easyModeButton = document.getElementById('easyModeButton');
    hardModeButton = document.getElementById('hardModeButton');
    insaneModeButton = document.getElementById('insaneModeButton');
    backToNameButton = document.getElementById('backToNameButton');
    saveScoreButton = document.getElementById('saveScoreButton');
    leaderboardList = document.getElementById('leaderboardList');
    
    // Upgrade modal elements
    upgradeModal = document.getElementById('upgradeModal');
    upgradeDamageButton = document.getElementById('upgradeDamage');
    upgradePierceButton = document.getElementById('upgradePierce');
    upgradeSizeButton = document.getElementById('upgradeSize');

    // Setup canvas
    setupCanvas();
    
    // Create stars background
    createStars();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize chat listener
    listenForNewMessages();
    
    // Show name input modal on page load
    nameInputModal.style.display = 'flex';
    playerNameInput.focus();
});
