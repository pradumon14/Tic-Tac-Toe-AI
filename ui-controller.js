// ui-controller.js
// ... (keep existing DOM element references and initial variable declarations) ...

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const boardElement = document.getElementById('board');
    const statusMessageElement = document.getElementById('status-message');
    const resetGameBtn = document.getElementById('reset-game-btn');

    // AI Type Selector
    const aiTypeSelector = document.getElementById('ai-type-selector');
    const qLearningControlsDiv = document.getElementById('q-learning-controls');
    const qTableSizeContainer = document.getElementById('q-table-size-container');


    // AI Control Sliders & Value Displays (Q-Learning)
    const learningRateSlider = document.getElementById('learning-rate');
    const lrValueSpan = document.getElementById('lr-value');
    const discountFactorSlider = document.getElementById('discount-factor');
    const dfValueSpan = document.getElementById('df-value');
    const explorationRateSlider = document.getElementById('exploration-rate');
    const erValueSpan = document.getElementById('er-value');
    const aiSpeedSlider = document.getElementById('ai-speed');
    const speedValueSpan = document.getElementById('speed-value');

    // Training Controls (Q-Learning)
    const trainAiCheckbox = document.getElementById('train-ai-checkbox');
    const startTrainingBtn = document.getElementById('start-training-btn');
    const stopTrainingBtn = document.getElementById('stop-training-btn');
    const resetQTableBtn = document.getElementById('reset-q-table-btn');
    const playOptimizedAiBtn = document.getElementById('play-optimized-ai-btn'); // For Q-Learning optimized
    const optimizedAiActiveMsg = document.getElementById('optimized-ai-active-msg');

    // Q-Table Controls (Q-Learning)
    const saveQTableBtn = document.getElementById('save-q-table-btn');
    const loadQTableInput = document.getElementById('load-q-table-input');

    // Statistics Display
    const playerXWinsSpan = document.getElementById('player-x-wins');
    const playerOWinsSpan = document.getElementById('player-o-wins');
    const drawsSpan = document.getElementById('draws');
    const totalGamesSpan = document.getElementById('total-games');
    const qTableSizeSpan = document.getElementById('q-table-size'); // For Q-Learning

    // Game State Variables
    let playerXWins = 0;
    let playerOWins = 0;
    let draws = 0;
    let totalGames = 0;

    let aiMoveTimeoutId;
    let isCurrentlyTraining = false; // Specific to Q-Learning
    let isOptimizedAiMode = false; // Specific to Q-Learning

    let currentAiType = 'q-learning'; // Default AI type

    // Speed settings
    let aiPlayerDelay = 500;
    let userSetAiPlayerDelay = 500;
    const FAST_TRAINING_MOVE_DELAY = 0;
    const FAST_TRAINING_INTER_GAME_DELAY = 0;

    // Epsilon Decay Parameters for Training (Q-Learning)
    const INITIAL_EPSILON_FOR_TRAINING = 1.0;
    const MIN_EPSILON_FOR_TRAINING = 0.05;
    const EPSILON_DECAY_RATE = 0.999;
    let currentTrainingEpsilon = INITIAL_EPSILON_FOR_TRAINING;
    let userSetExplorationRate = 0.3;

    const HUMAN_PLAYER_ID = 1;
    const AI_PLAYER_ID = 2;
    const OPTIMIZED_AI_EXPLORATION_RATE = 0.01; // For Q-Learning optimized


    // --- Game Board and UI Update Functions (largely unchanged, check status messages) ---
    function createGameBoardUI() {
        boardElement.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell'); // Ensure your style.css has .cell defined
            cell.dataset.index = i;
            cell.setAttribute('role', 'button');
            cell.setAttribute('aria-label', `Cell ${i + 1}`);
            cell.tabIndex = 0;
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCellClick(e);
                }
            });
            boardElement.appendChild(cell);
        }
    }

    function updateGameBoardUI() {
        const currentBoard = TicTacToe.getBoard();
        const cells = boardElement.children;
        for (let i = 0; i < 9; i++) {
            cells[i].textContent = currentBoard[i] === HUMAN_PLAYER_ID ? 'X' : currentBoard[i] === AI_PLAYER_ID ? 'O' : '';
            cells[i].classList.remove('X', 'O', 'winning-cell');
            cells[i].setAttribute('aria-label', `Cell ${i + 1}${currentBoard[i] === HUMAN_PLAYER_ID ? ', X' : currentBoard[i] === AI_PLAYER_ID ? ', O' : ', empty'}`);
            if (currentBoard[i] === HUMAN_PLAYER_ID) cells[i].classList.add('X');
            if (currentBoard[i] === AI_PLAYER_ID) cells[i].classList.add('O');
        }
        const winningLine = TicTacToe.getWinningCombination();
        if (winningLine) {
            winningLine.forEach(index => cells[index].classList.add('winning-cell'));
        }
    }

    function updateStatusMessageUI() {
        const gameState = TicTacToe.getGameState();
        const currentPlayer = TicTacToe.getCurrentPlayer();
        let aiName = currentAiType === 'minimax' ? 'Minimax AI' : 'Q-AI';
        if (isOptimizedAiMode && currentAiType === 'q-learning') aiName = 'Optimized Q-AI';


        if (isCurrentlyTraining && currentAiType === 'q-learning') { // Training only for Q-Learning
            statusMessageElement.textContent = `Q-AI Training... (Game: ${totalGames + 1}, ε: ${currentTrainingEpsilon.toFixed(3)})`;
        } else if (gameState === 'won') {
            const winner = TicTacToe.getWinner();
            const winnerName = winner === HUMAN_PLAYER_ID ? 'Player X' : `Player O (${aiName})`;
            statusMessageElement.textContent = `${winnerName} wins!`;
        } else if (gameState === 'draw') {
            statusMessageElement.textContent = "It's a draw!";
        } else {
            const turnPlayerName = currentPlayer === HUMAN_PLAYER_ID ? 'Player X' : `Player O (${aiName})`;
            statusMessageElement.textContent = `${turnPlayerName}'s turn`;
        }
    }

    function updateGameStatsUI() {
        playerXWinsSpan.textContent = playerXWins;
        playerOWinsSpan.textContent = playerOWins;
        drawsSpan.textContent = draws;
        totalGamesSpan.textContent = totalGames;
        if (currentAiType === 'q-learning') {
            qTableSizeSpan.textContent = QLearningAgentTTT.getQTableSize();
            qTableSizeContainer.style.display = 'block';
            optimizedAiActiveMsg.style.display = isOptimizedAiMode ? 'block' : 'none';
        } else {
            qTableSizeContainer.style.display = 'none';
            optimizedAiActiveMsg.style.display = 'none';
        }
    }

    // --- AI Type Management ---
    function handleAiTypeChange() {
        currentAiType = aiTypeSelector.value;
        if (currentAiType === 'q-learning') {
            qLearningControlsDiv.style.display = 'block';
            // Restore Q-learning AI parameters from sliders if needed
            QLearningAgentTTT.setExplorationRate(isOptimizedAiMode ? OPTIMIZED_AI_EXPLORATION_RATE : userSetExplorationRate);
        } else { // Minimax or other non-learning AI
            qLearningControlsDiv.style.display = 'none';
            if (isCurrentlyTraining) stopTrainingMode(); // Stop training if switching from Q-learning
            isOptimizedAiMode = false; // Minimax is always "optimized"
        }
        initiateNewGame(); // Reset game when AI type changes
        updateGameStatsUI();
        updateStatusMessageUI();
    }


    // --- Player and AI Move Logic ---
    function handleCellClick(event) {
        if (isCurrentlyTraining && currentAiType === 'q-learning') return; // No human clicks during Q-AI training
        if (TicTacToe.getGameState() !== 'playing' || TicTacToe.getCurrentPlayer() !== HUMAN_PLAYER_ID) {
            return;
        }
        const cellIndex = parseInt(event.currentTarget.dataset.index);
        if (TicTacToe.makeMove(cellIndex, HUMAN_PLAYER_ID)) {
            updateGameBoardUI();
            updateStatusMessageUI();
            const currentGameState = TicTacToe.getGameState();
            if (currentGameState === 'playing' && TicTacToe.getCurrentPlayer() === AI_PLAYER_ID) {
                clearTimeout(aiMoveTimeoutId);
                aiMoveTimeoutId = setTimeout(performAiMove, aiPlayerDelay);
            } else if (currentGameState !== 'playing') {
                processEndOfGame();
            }
        }
    }

    function performAiMove() {
        if (TicTacToe.getGameState() !== 'playing' || TicTacToe.getCurrentPlayer() !== AI_PLAYER_ID) return;

        const boardBeforeMove = TicTacToe.getBoard();
        const availableMoves = TicTacToe.getAvailableMoves();
        if (availableMoves.length === 0) return;

        let chosenAction;
        if (currentAiType === 'q-learning') {
            const oldStateString = QLearningAgentTTT.getBoardStateString(boardBeforeMove);
            chosenAction = QLearningAgentTTT.chooseAction(boardBeforeMove, availableMoves);

            if (chosenAction !== -1 && TicTacToe.makeMove(chosenAction, AI_PLAYER_ID)) {
                const boardAfterMove = TicTacToe.getBoard();
                const newStateString = QLearningAgentTTT.getBoardStateString(boardAfterMove);
                const reward = QLearningAgentTTT.getReward(TicTacToe.getGameState(), TicTacToe.getWinner());
                const nextAvailableMoves = TicTacToe.getAvailableMoves();
                const isTerminal = TicTacToe.getGameState() !== 'playing';
                QLearningAgentTTT.updateQTable(oldStateString, chosenAction, reward, newStateString, nextAvailableMoves, isTerminal);
            } else {
                 // Handle case where Q-learning AI fails to make a move (should be rare)
                if (TicTacToe.getGameState() !== 'playing') processEndOfGame();
                refreshUIState();
                return;
            }
        } else if (currentAiType === 'minimax') {
            // For Minimax, we need to pass a simple game logic interface or the TicTacToe module itself
            // For this example, MinimaxAI.js has its own simplified game logic.
            // In a more integrated setup, you'd pass TicTacToe's functions.
            const gameLogicInterface = {
                getAvailableMoves: (b) => TicTacToe.getAvailableMoves(b), // Need to adapt TicTacToe to take board as param or use instance
                checkWinner: (b) => { // Simulate checkWinner
                    const tempGame = Object.assign({}, TicTacToe); // very shallow, not ideal for complex state
                    tempGame._setBoard(b); // Assumes TicTacToe module can be manipulated like this
                    tempGame._checkGameState(); // This updates internal winner
                    return tempGame.getWinner();
                },
                isBoardFull: (b) => !b.includes(0)
            };
             // The MinimaxAI in this example uses its own internal gameUtils.
            chosenAction = MinimaxAI.findBestMove(boardBeforeMove /*, gameLogicInterface */); // Pass interface if MinimaxAI is adapted

            if (chosenAction === -1 || !TicTacToe.makeMove(chosenAction, AI_PLAYER_ID)) {
                 // Handle case where Minimax AI fails to make a move
                if (TicTacToe.getGameState() !== 'playing') processEndOfGame();
                refreshUIState();
                return;
            }
        }

        // Common UI updates after any AI move
        if (!isCurrentlyTraining || FAST_TRAINING_MOVE_DELAY > 10 || TicTacToe.getGameState() !== 'playing') {
            updateGameBoardUI();
        }
        updateStatusMessageUI();
        updateGameStatsUI();

        if (TicTacToe.getGameState() !== 'playing') {
            processEndOfGame();
        } else if (isCurrentlyTraining && currentAiType === 'q-learning' && TicTacToe.getCurrentPlayer() === HUMAN_PLAYER_ID) {
            clearTimeout(aiMoveTimeoutId);
            aiMoveTimeoutId = setTimeout(performAiPlayerXMoveForTraining, aiPlayerDelay);
        }
    }

    // This function is ONLY for Q-Learning AI vs AI training
    function performAiPlayerXMoveForTraining() {
        if (!isCurrentlyTraining || currentAiType !== 'q-learning' || TicTacToe.getGameState() !== 'playing' || TicTacToe.getCurrentPlayer() !== HUMAN_PLAYER_ID) {
            return;
        }
        const availableMoves = TicTacToe.getAvailableMoves();
        if (availableMoves.length === 0) return;
        const chosenAction = availableMoves[Math.floor(Math.random() * availableMoves.length)];

        if (chosenAction !== -1 && TicTacToe.makeMove(chosenAction, HUMAN_PLAYER_ID)) {
            // No Q-table update for Player X (random AI)
            if (!isCurrentlyTraining || FAST_TRAINING_MOVE_DELAY > 10 || TicTacToe.getGameState() !== 'playing') {
                updateGameBoardUI();
            }
            updateStatusMessageUI();
            if (TicTacToe.getGameState() !== 'playing') {
                processEndOfGame();
            } else if (TicTacToe.getCurrentPlayer() === AI_PLAYER_ID) {
                clearTimeout(aiMoveTimeoutId);
                aiMoveTimeoutId = setTimeout(performAiMove, aiPlayerDelay);
            }
        } else {
            if (TicTacToe.getGameState() !== 'playing') processEndOfGame();
            refreshUIState();
        }
    }
    
    function refreshUIState() {
        updateStatusMessageUI();
        updateGameStatsUI();
        updateGameBoardUI(); // Ensure board is up-to-date
    }

    // --- End of Game and New Game Logic (check for Q-Learning specific parts) ---
    function processEndOfGame() {
        totalGames++;
        const gameState = TicTacToe.getGameState();
        const winner = TicTacToe.getWinner();

        if (gameState === 'won') {
            if (winner === HUMAN_PLAYER_ID) playerXWins++;
            else if (winner === AI_PLAYER_ID) playerOWins++;
        } else if (gameState === 'draw') {
            draws++;
        }

        if (isCurrentlyTraining && currentAiType === 'q-learning') {
            currentTrainingEpsilon = Math.max(MIN_EPSILON_FOR_TRAINING, currentTrainingEpsilon * EPSILON_DECAY_RATE);
            QLearningAgentTTT.setExplorationRate(currentTrainingEpsilon);
            updateStatusMessageUI();
        }
        
        if (!isCurrentlyTraining || totalGames % 50 === 0 || FAST_TRAINING_MOVE_DELAY > 10 || FAST_TRAINING_INTER_GAME_DELAY > 0) {
            updateGameStatsUI();
            updateGameBoardUI();
        }

        if (isCurrentlyTraining && currentAiType === 'q-learning') {
            clearTimeout(aiMoveTimeoutId);
            aiMoveTimeoutId = setTimeout(() => {
                initiateNewGame(false);
                if (TicTacToe.getCurrentPlayer() === HUMAN_PLAYER_ID) {
                    performAiPlayerXMoveForTraining();
                } else {
                     performAiMove(); // Should be AI Player O (Q-learning AI)
                }
            }, FAST_TRAINING_INTER_GAME_DELAY);
        } else {
            updateGameBoardUI();
            updateStatusMessageUI();
            updateGameStatsUI();
            if (isOptimizedAiMode && currentAiType === 'q-learning') {
                // explorationRateSlider.disabled = false; // handled by stopOptimizedMode
            }
        }
    }

    function initiateNewGame(fullUIRefresh = true) {
        TicTacToe.resetGame();
        // When starting a new game, if AI is Minimax and it's AI's turn (e.g. if human was O and AI X)
        // This setup always has human as X (player 1) starting.
        if (fullUIRefresh) {
            updateGameBoardUI();
            refreshUIState();
        }
        if (TicTacToe.getCurrentPlayer() === AI_PLAYER_ID && !isCurrentlyTraining && currentAiType === 'minimax') {
             // If Minimax AI is supposed to make the first move (not standard here, but for completeness)
            // clearTimeout(aiMoveTimeoutId);
            // aiMoveTimeoutId = setTimeout(performAiMove, aiPlayerDelay);
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        aiTypeSelector.addEventListener('change', handleAiTypeChange);

        // Q-Learning specific listeners (keep them, they will be hidden if not applicable)
        learningRateSlider.addEventListener('input', (e) => {
            QLearningAgentTTT.setLearningRate(e.target.value);
            lrValueSpan.textContent = parseFloat(e.target.value).toFixed(2);
        });
        discountFactorSlider.addEventListener('input', (e) => {
            QLearningAgentTTT.setDiscountFactor(e.target.value);
            dfValueSpan.textContent = parseFloat(e.target.value).toFixed(2);
        });
        explorationRateSlider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            userSetExplorationRate = val;
            if (!isCurrentlyTraining && !isOptimizedAiMode && currentAiType === 'q-learning') {
                QLearningAgentTTT.setExplorationRate(val);
            }
            erValueSpan.textContent = val.toFixed(2);
        });
        aiSpeedSlider.addEventListener('input', (e) => {
            userSetAiPlayerDelay = parseInt(e.target.value);
            if (!isCurrentlyTraining) { // Training speed is handled separately
                aiPlayerDelay = userSetAiPlayerDelay;
            }
            speedValueSpan.textContent = e.target.value;
        });

        resetGameBtn.addEventListener('click', () => {
            if (isCurrentlyTraining && currentAiType === 'q-learning') stopTrainingMode();
            if (isOptimizedAiMode && currentAiType === 'q-learning') stopOptimizedMode();
            clearTimeout(aiMoveTimeoutId);
            initiateNewGame();
        });

        // Q-Learning specific buttons
        resetQTableBtn.addEventListener('click', () => {
            if (currentAiType !== 'q-learning') return;
            if (confirm("Are you sure you want to reset the Q-AI's learned knowledge?")) {
                QLearningAgentTTT.resetQTable();
                updateGameStatsUI();
            }
        });
        startTrainingBtn.addEventListener('click', startTrainingMode); // Will check currentAiType inside
        stopTrainingBtn.addEventListener('click', stopTrainingMode);   // Will check currentAiType inside
        trainAiCheckbox.addEventListener('change', (e) => {
            if (currentAiType !== 'q-learning') {
                e.target.checked = false;
                return;
            }
            if (e.target.checked) {
                if (!isCurrentlyTraining) startTrainingMode();
            } else {
                if (isCurrentlyTraining) stopTrainingMode();
            }
        });
        playOptimizedAiBtn.addEventListener('click', () => { // This is for Q-Learning
            if (currentAiType !== 'q-learning') return;
            if (isCurrentlyTraining) stopTrainingMode();
            isOptimizedAiMode = true;
            playOptimizedAiBtn.disabled = true;
            explorationRateSlider.disabled = true;
            QLearningAgentTTT.setExplorationRate(OPTIMIZED_AI_EXPLORATION_RATE);
            erValueSpan.textContent = OPTIMIZED_AI_EXPLORATION_RATE.toFixed(2);
            clearTimeout(aiMoveTimeoutId);
            initiateNewGame();
            updateGameStatsUI();
            updateStatusMessageUI();
        });
        saveQTableBtn.addEventListener('click', () => {
            if (currentAiType !== 'q-learning') return;
            try { /* ... save logic ... */ } catch (e) { /* ... */ }
        });
        loadQTableInput.addEventListener('change', (event) => {
            if (currentAiType !== 'q-learning') return;
            /* ... load logic ... */
            try {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e_reader) => {
                        const qTable = JSON.parse(e_reader.target.result);
                        QLearningAgentTTT.loadQTable(qTable);
                        updateGameStatsUI();
                        alert("Q-Table loaded successfully!");
                    };
                    reader.readAsText(file);
                }
            } catch (error) {
                alert("Error loading Q-Table.");
            } finally {
                loadQTableInput.value = '';
            }
        });
    }

    // --- Q-Learning Training and Optimized Mode Functions ---
    function startTrainingMode() {
        if (currentAiType !== 'q-learning' || isCurrentlyTraining) return;
        if (isOptimizedAiMode) stopOptimizedMode();

        isCurrentlyTraining = true;
        trainAiCheckbox.checked = true;
        startTrainingBtn.disabled = true;
        stopTrainingBtn.disabled = false;
        resetGameBtn.disabled = true;
        playOptimizedAiBtn.disabled = true;
        aiTypeSelector.disabled = true; // Disable AI selection during training
        [learningRateSlider, discountFactorSlider, explorationRateSlider, aiSpeedSlider].forEach(s => s.disabled = true);
        userSetAiPlayerDelay = parseInt(aiSpeedSlider.value); // Store current speed
        aiPlayerDelay = FAST_TRAINING_MOVE_DELAY;
        currentTrainingEpsilon = INITIAL_EPSILON_FOR_TRAINING;
        QLearningAgentTTT.setExplorationRate(currentTrainingEpsilon);
        updateStatusMessageUI();
        initiateNewGame(false);
        if (TicTacToe.getCurrentPlayer() === HUMAN_PLAYER_ID) {
            performAiPlayerXMoveForTraining();
        } else {
             performAiMove(); // Should be AI Player O (Q-learning AI)
        }
    }

    function stopTrainingMode() {
        if (currentAiType !== 'q-learning' || !isCurrentlyTraining) return;
        isCurrentlyTraining = false;
        trainAiCheckbox.checked = false;
        startTrainingBtn.disabled = false;
        stopTrainingBtn.disabled = true;
        resetGameBtn.disabled = false;
        playOptimizedAiBtn.disabled = false;
        aiTypeSelector.disabled = false; // Re-enable AI selection
        [learningRateSlider, discountFactorSlider, explorationRateSlider, aiSpeedSlider].forEach(s => s.disabled = false);
        aiPlayerDelay = userSetAiPlayerDelay; // Restore user-set speed
        aiSpeedSlider.value = userSetAiPlayerDelay;
        speedValueSpan.textContent = userSetAiPlayerDelay;
        QLearningAgentTTT.setExplorationRate(userSetExplorationRate);
        explorationRateSlider.value = userSetExplorationRate;
        erValueSpan.textContent = userSetExplorationRate.toFixed(2);
        clearTimeout(aiMoveTimeoutId);
        initiateNewGame();
        refreshUIState();
    }
    
    function stopOptimizedMode() { // For Q-Learning
        if (currentAiType !== 'q-learning' || !isOptimizedAiMode) return;
        isOptimizedAiMode = false;
        playOptimizedAiBtn.disabled = false;
        explorationRateSlider.disabled = false;
        QLearningAgentTTT.setExplorationRate(userSetExplorationRate);
        explorationRateSlider.value = userSetExplorationRate;
        erValueSpan.textContent = userSetExplorationRate.toFixed(2);
        updateGameStatsUI();
        updateStatusMessageUI();
    }

    /**
     * Initializes the game application.
     */
    function initializeApp() {
        createGameBoardUI();
        
        // Initialize Q-Learning agent values from sliders
        lrValueSpan.textContent = parseFloat(learningRateSlider.value).toFixed(2);
        QLearningAgentTTT.setLearningRate(learningRateSlider.value);
        dfValueSpan.textContent = parseFloat(discountFactorSlider.value).toFixed(2);
        QLearningAgentTTT.setDiscountFactor(discountFactorSlider.value);
        userSetExplorationRate = parseFloat(explorationRateSlider.value);
        erValueSpan.textContent = userSetExplorationRate.toFixed(2);
        QLearningAgentTTT.setExplorationRate(userSetExplorationRate);
        userSetAiPlayerDelay = parseInt(aiSpeedSlider.value);
        aiPlayerDelay = userSetAiPlayerDelay;
        speedValueSpan.textContent = aiSpeedSlider.value;

        setupEventListeners();
        handleAiTypeChange(); // Initial setup based on default AI type
        QLearningAgentTTT.resetQTable(); // Reset Q-table on app start
        initiateNewNewGame(); // Now calls initiateNewGame after AI type handler
        updateGameStatsUI();
    }
    
    //Corrected function name for initialization
    function initializeAppCorrected() {
        createGameBoardUI();
        
        lrValueSpan.textContent = parseFloat(learningRateSlider.value).toFixed(2);
        QLearningAgentTTT.setLearningRate(learningRateSlider.value);
        dfValueSpan.textContent = parseFloat(discountFactorSlider.value).toFixed(2);
        QLearningAgentTTT.setDiscountFactor(discountFactorSlider.value);
        userSetExplorationRate = parseFloat(explorationRateSlider.value);
        erValueSpan.textContent = userSetExplorationRate.toFixed(2);
        QLearningAgentTTT.setExplorationRate(userSetExplorationRate);
        userSetAiPlayerDelay = parseInt(aiSpeedSlider.value);
        aiPlayerDelay = userSetAiPlayerDelay;
        speedValueSpan.textContent = aiSpeedSlider.value;

        setupEventListeners();
        QLearningAgentTTT.resetQTable(); // Reset Q-table once at the start
        handleAiTypeChange(); // This will call initiateNewGame and update UI
        // initiateNewGame(); // Not needed here, handleAiTypeChange does it
        // updateGameStatsUI(); // Not needed here, handleAiTypeChange does it
    }


    // Start the application
    initializeAppCorrected(); // Use the corrected function
});
