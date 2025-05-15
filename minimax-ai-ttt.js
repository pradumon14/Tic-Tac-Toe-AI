// minimax-ai-ttt.js

const MinimaxAI = (() => {
    const AI_PLAYER_ID = 2;    // Player O (AI)
    const HUMAN_PLAYER_ID = 1; // Player X (Human)

    // Scores for terminal states
    const scores = {
        [AI_PLAYER_ID]: 10,  // AI wins
        [HUMAN_PLAYER_ID]: -10, // Human wins
        'draw': 0
    };

    /**
     * Finds the best move for the AI using the Minimax algorithm.
     * @param {Array<number>} currentBoard - The current state of the board.
     * @param {object} gameLogic - An object or module providing game functions 
     * (like getAvailableMoves, checkWinner, isBoardFull).
     * For this, we'll assume it can simulate a TicTacToe game state.
     * @returns {number} The index of the best move.
     */
    function findBestMove(board, gameLogic) {
        let bestScore = -Infinity;
        let move = -1; // Default to -1 if no move found (should not happen in a playable game)
        
        const availableMoves = gameLogic.getAvailableMoves(board);

        for (const currentMove of availableMoves) {
            const newBoard = [...board];
            newBoard[currentMove] = AI_PLAYER_ID;
            
            // Calculate the score for this move by calling minimax for the opponent's turn
            const score = minimax(newBoard, 0, false, gameLogic);
            
            if (score > bestScore) {
                bestScore = score;
                move = currentMove;
            }
        }
        return move;
    }

    /**
     * The Minimax algorithm.
     * @param {Array<number>} board - The current board state.
     * @param {number} depth - The current depth in the game tree.
     * @param {boolean} isMaximizing - True if it's the AI's turn (maximizing player), false for opponent.
     * @param {object} gameLogic - Provides game utility functions.
     * @returns {number} The heuristic value of the board state.
     */
    function minimax(board, depth, isMaximizing, gameLogic) {
        const winner = gameLogic.checkWinner(board);
        if (winner !== null) {
            return scores[winner] - (isMaximizing ? -depth : depth); // Prefer quicker wins / slower losses
        }
        if (gameLogic.isBoardFull(board)) {
            return scores['draw'];
        }

        const availableMoves = gameLogic.getAvailableMoves(board);

        if (isMaximizing) { // AI's turn (Player O)
            let bestScore = -Infinity;
            for (const move of availableMoves) {
                const newBoard = [...board];
                newBoard[move] = AI_PLAYER_ID;
                const score = minimax(newBoard, depth + 1, false, gameLogic);
                bestScore = Math.max(score, bestScore);
            }
            return bestScore;
        } else { // Human's turn (Player X)
            let bestScore = Infinity;
            for (const move of availableMoves) {
                const newBoard = [...board];
                newBoard[move] = HUMAN_PLAYER_ID;
                const score = minimax(newBoard, depth + 1, true, gameLogic);
                bestScore = Math.min(score, bestScore);
            }
            return bestScore;
        }
    }

    // Helper game logic functions that Minimax needs.
    // These should ideally come from the TicTacToe module for consistency.
    // For this self-contained example, we'll create simplified versions
    // or assume they are passed in.
    const gameUtils = {
        getAvailableMoves: (board) => {
            const moves = [];
            for (let i = 0; i < board.length; i++) {
                if (board[i] === 0) moves.push(i);
            }
            return moves;
        },
        checkWinner: (board) => {
            const winningCombinations = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            for (const combo of winningCombinations) {
                const [a, b, c] = combo;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    return board[a]; // Returns player ID (1 or 2)
                }
            }
            return null; // No winner
        },
        isBoardFull: (board) => !board.includes(0)
    };

    // Public API
    return {
        // We pass gameUtils here, but in a real integration, you'd pass your TicTacToe module or its relevant functions
        findBestMove: (board) => findBestMove(board, gameUtils) 
    };
})();
