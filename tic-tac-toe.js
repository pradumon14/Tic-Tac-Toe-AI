// tic-tac-toe.js

/**
 * TicTacToe Game Logic Module.
 * Manages the game state, player turns, and win/draw conditions.
 * This module is designed to be self-contained and framework-agnostic.
 */
const TicTacToe = (() => {
    // Represents the game board. 0 for empty, 1 for Player X, 2 for Player O.
    let board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    // Current player: 1 for X, 2 for O. Player X (human or AI Player 1) always starts.
    let currentPlayer = 1;
    // Game state: 'playing', 'won', 'draw'
    let gameState = 'playing';
    let winner = null; // Stores the winning player (1 or 2) if gameState is 'won'

    // All possible winning combinations (indices of the board array)
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    /**
     * Resets the game to its initial state.
     * Called at the beginning of a new game.
     */
    function resetGame() {
        board = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // Clear the board
        currentPlayer = 1; // Player X (player 1) always starts
        gameState = 'playing'; // Set game state to active
        winner = null; // No winner at the start
        // console.log("Game reset. Current player:", currentPlayer);
    }

    /**
     * Attempts to make a move on the board for the specified player.
     * @param {number} index - The cell index (0-8) where the move is to be made.
     * @param {number} player - The player making the move (1 for X, 2 for O).
     * @returns {boolean} True if the move was successful (cell was empty, game is playing, correct player), false otherwise.
     */
    function makeMove(index, player) {
        // Validate the move
        if (gameState !== 'playing' || board[index] !== 0 || player !== currentPlayer) {
            // console.warn("Invalid move attempt:", { gameState, boardVal: board[index], attemptedPlayer: player, currentPlayer });
            return false; // Move is invalid
        }

        board[index] = player; // Place the player's mark on the board
        // console.log(`Player ${player} moved to cell ${index}. Board:`, board.join(''));

        checkGameState(); // Check if this move resulted in a win or draw

        // If the game is still playing after the move, switch to the other player
        if (gameState === 'playing') {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            // console.log("Next player:", currentPlayer);
        }
        return true; // Move was successful
    }

    /**
     * Checks the current board state for a win or a draw.
     * Updates `gameState` and `winner` properties accordingly.
     * This function is also exposed as _checkGameState for external use if needed (e.g. by an AI).
     */
    function checkGameState() {
        winner = null; // Reset winner before check
        // Check all winning combinations
        for (const combination of winningCombinations) {
            const [a, b, c] = combination; // Destructure the combination indices
            // If the first cell in a combination is not empty and all three cells match
            if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
                gameState = 'won'; // Set game state to 'won'
                winner = board[a]; // The player in cell 'a' is the winner
                // console.log(`Player ${winner} won! Combination: [${a},${b},${c}]`);
                return; // Exit early as soon as a winner is found
            }
        }

        // If no winner and the board has no empty cells (all cells are filled)
        if (!board.includes(0)) {
            gameState = 'draw'; // Set game state to 'draw'
            // console.log("Game is a draw. Board full.");
            return;
        }

        // If no winner and board is not full, game is still 'playing'
        // gameState = 'playing'; // This is implicitly true if no win/draw, no need to set it again unless changing from won/draw
    }

    /**
     * Gets a copy of the current board state.
     * @returns {Array<number>} A copy of the board array to prevent external modification.
     */
    function getBoard() {
        return [...board]; // Return a shallow copy
    }

    /**
     * Gets the player whose turn it is.
     * @returns {number} The current player (1 for X, 2 for O).
     */
    function getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * Gets the current state of the game.
     * @returns {string} The game state ('playing', 'won', 'draw').
     */
    function getGameState() {
        return gameState;
    }

    /**
     * Gets the winner of the game, if any.
     * @returns {number|null} 1 if Player X won, 2 if Player O won, or null if no winner yet or draw.
     */
    function getWinner() {
        return winner;
    }

    /**
     * Gets the indices of the winning combination if the game has been won.
     * @returns {Array<number>|null} An array of 3 indices representing the winning line, or null.
     */
    function getWinningCombination() {
        if (gameState === 'won' && winner !== null) {
            for (const combination of winningCombinations) {
                const [a, b, c] = combination;
                if (board[a] === winner && board[b] === winner && board[c] === winner) {
                    return combination; // Return the first matching winning combination
                }
            }
        }
        return null; // No winning combination found or game not won
    }

    /**
     * Gets a list of currently available (empty) moves (cell indices).
     * Can optionally take a board state to check, useful for AI simulation.
     * @param {Array<number>} [boardState=board] - The board state to check. Defaults to the internal current board.
     * @returns {Array<number>} An array of indices of empty cells.
     */
    function getAvailableMoves(boardState = board) {
        const moves = [];
        for (let i = 0; i < boardState.length; i++) {
            if (boardState[i] === 0) { // If cell is empty
                moves.push(i);
            }
        }
        return moves;
    }

    // Expose public functions and properties of the module
    return {
        resetGame,
        makeMove,
        getBoard,
        getCurrentPlayer,
        getGameState,
        getWinner,
        getWinningCombination,
        getAvailableMoves,
        // Internal methods exposed for advanced scenarios like AI training or simulation
        // needing direct state manipulation (use with caution).
        _setBoard: (newBoard) => { board = [...newBoard]; }, // Allows setting board state directly
        _setCurrentPlayer: (player) => { currentPlayer = player; }, // Allows setting current player directly
        _setGameState: (state, newWinner = null) => { // Allows setting game state directly
            gameState = state;
            winner = newWinner;
         },
        _checkGameState: checkGameState // Expose for AI to re-evaluate after direct board manipulation
    };
})();
