// q-learning-ttt.js

/**
 * QLearningAgent for Tic-Tac-Toe Module.
 * Implements the Q-learning algorithm for an AI to play Tic-Tac-Toe.
 * This agent learns to make optimal moves by associating Q-values with state-action pairs.
 */
const QLearningAgentTTT = (() => {
    // The Q-table: stores Q-values for state-action pairs.
    // Format: qTable[stateString][actionIndex] = Q-value
    let qTable = {};

    // Q-learning hyperparameters
    let learningRate = 0.1;   // Alpha: Determines how much new information overrides old information. (0 to 1)
    let discountFactor = 0.9; // Gamma: Importance of future rewards. (0 to 1)
    let explorationRate = 0.3; // Epsilon: Probability of choosing a random action (exploration vs. exploitation). (0 to 1)

    const AI_PLAYER_ID = 2;    // The identifier for the AI player (e.g., Player O)
    const OPPONENT_PLAYER_ID = 1; // The identifier for the opponent player (e.g., Player X)

    /**
     * Initializes or resets the Q-table, clearing all learned values.
     */
    function resetQTable() {
        qTable = {};
        // console.log("Q-Table has been reset.");
    }

    /**
     * Converts the game board array to a unique string representation.
     * This string is used as a key in the Q-table to identify states.
     * @param {Array<number>} board - The game board array (e.g., [0,1,2,0,...]).
     * @returns {string} A string representation of the board (e.g., "0120...").
     */
    function getBoardStateString(board) {
        return board.join('');
    }

    /**
     * Retrieves the Q-values for a given state. If the state is new, it initializes
     * Q-values for all available actions in that state to 0.
     * @param {string} stateString - The string representation of the board state.
     * @param {Array<number>} availableMoves - An array of indices representing possible moves from this state.
     * @returns {Object} An object where keys are action indices (moves) and values are their Q-values.
     */
    function getQValues(stateString, availableMoves) {
        // If the state is not yet in the Q-table, add it.
        if (!qTable[stateString]) {
            qTable[stateString] = {};
        }
        // Ensure all currently available moves have an initialized Q-value for this state.
        // This is important if a state is revisited and new moves become available (though unlikely in TTT).
        availableMoves.forEach(moveIndex => {
            if (qTable[stateString][moveIndex] === undefined) {
                qTable[stateString][moveIndex] = 0; // Initialize Q-value for new action in an existing state
            }
        });
        return qTable[stateString];
    }

    /**
     * Chooses an action (move index) based on the current state using an epsilon-greedy strategy.
     * With probability epsilon, it explores a random move.
     * With probability 1-epsilon, it exploits by choosing the move with the highest Q-value.
     * @param {Array<number>} board - The current game board.
     * @param {Array<number>} availableMoves - An array of possible move indices.
     * @returns {number} The chosen move index. Returns -1 if no moves are available (should not happen in a valid game).
     */
    function chooseAction(board, availableMoves) {
        if (!availableMoves || availableMoves.length === 0) {
            // console.warn("ChooseAction called with no available moves.");
            return -1; // Should not occur if game logic is correct
        }

        const stateString = getBoardStateString(board);
        const qValuesForState = getQValues(stateString, availableMoves); // Ensures state and moves are initialized

        // Epsilon-greedy strategy
        if (Math.random() < explorationRate) {
            // Explore: Choose a random action from available moves
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            return availableMoves[randomIndex];
        } else {
            // Exploit: Choose the best action based on current Q-values
            let bestMove = availableMoves[0];
            // Initialize maxQValue with the Q-value of the first available move, or -Infinity if undefined
            let maxQValue = qValuesForState[bestMove] !== undefined ? qValuesForState[bestMove] : -Infinity;

            for (let i = 0; i < availableMoves.length; i++) {
                const move = availableMoves[i];
                const qValue = qValuesForState[move] !== undefined ? qValuesForState[move] : -Infinity;
                if (qValue > maxQValue) {
                    maxQValue = qValue;
                    bestMove = move;
                }
            }

            // If multiple moves have the same max Q-value, pick one randomly among them to break ties.
            const bestMoves = availableMoves.filter(move =>
                (qValuesForState[move] !== undefined ? qValuesForState[move] : -Infinity) === maxQValue
            );

            if (bestMoves.length > 0) {
                return bestMoves[Math.floor(Math.random() * bestMoves.length)];
            }
            // Fallback: if somehow bestMoves is empty (e.g. all Q-values are -Infinity and first move was picked)
            // This case should ideally not be reached if availableMoves is not empty.
            return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    }

    /**
     * Updates the Q-table using the Q-learning formula:
     * Q(s, a) = Q(s, a) + learningRate * [reward + discountFactor * max_a'(Q(s', a')) - Q(s, a)]
     * where:
     * s: current state, a: action taken
     * s': next state, a': possible actions in next state
     * reward: immediate reward received
     * @param {string} oldStateString - The state string before the action.
     * @param {number} actionIndex - The index of the action (move) taken.
     * @param {number} reward - The immediate reward received after taking the action.
     * @param {string} newStateString - The state string after the action.
     * @param {Array<number>} nextAvailableMoves - Available moves in the new state.
     * @param {boolean} isTerminalState - True if newState is a terminal state (win/loss/draw).
     */
    function updateQTable(oldStateString, actionIndex, reward, newStateString, nextAvailableMoves, isTerminalState) {
        // Ensure the entry for the old state and action exists, initializing if necessary.
        const qValuesForOldState = getQValues(oldStateString, [actionIndex]);
        const oldQValue = qValuesForOldState[actionIndex]; // This will be 0 if newly initialized

        let maxNextQValue = 0;
        // If the new state is not terminal, find the max Q-value for the next state.
        if (!isTerminalState && nextAvailableMoves.length > 0) {
            const qValuesForNewState = getQValues(newStateString, nextAvailableMoves);
            maxNextQValue = -Infinity; // Start with a very small number
            for (const move of nextAvailableMoves) {
                if (qValuesForNewState[move] > maxNextQValue) {
                    maxNextQValue = qValuesForNewState[move];
                }
            }
            if (maxNextQValue === -Infinity) maxNextQValue = 0; // If all next Q-values are uninitialized or -Infinity
        }
        // If it's a terminal state, the future reward (maxNextQValue) is 0.

        // Q-learning formula
        const newQValue = oldQValue + learningRate * (reward + discountFactor * maxNextQValue - oldQValue);
        qTable[oldStateString][actionIndex] = newQValue;
    }

    /**
     * Calculates the reward for the AI based on the game outcome.
     * @param {string} gameState - The current state of the game ('playing', 'won', 'draw').
     * @param {number|null} winner - The winning player (1 for X, 2 for O/AI), or null.
     * @returns {number} The reward value.
     */
    function getReward(gameState, winner) {
        if (gameState === 'won') {
            if (winner === AI_PLAYER_ID) return 1;    // AI won: high positive reward
            if (winner === OPPONENT_PLAYER_ID) return -1; // AI lost: high negative reward
        }
        if (gameState === 'draw') return 0.5; // Draw: neutral or slightly positive reward
        return -0.01; // Small negative reward for each ongoing move (to encourage faster wins)
                       // Can be 0 if we don't want to penalize longer games that still result in a win/draw.
    }

    // --- Public API of the QLearningAgentTTT module ---
    return {
        resetQTable,
        chooseAction,
        updateQTable,
        getReward,
        getBoardStateString, // Expose for external use if needed (e.g., UI display)
        // Setters for hyperparameters
        setLearningRate: (lr) => { learningRate = parseFloat(lr); },
        setDiscountFactor: (df) => { discountFactor = parseFloat(df); },
        setExplorationRate: (er) => { explorationRate = parseFloat(er); },
        // Getters for Q-table and its size (for inspection, saving/loading)
        getQTable: () => JSON.parse(JSON.stringify(qTable)), // Return a deep copy
        loadQTable: (newQTable) => { qTable = JSON.parse(JSON.stringify(newQTable)); }, // Load from a deep copy
        getQTableSize: () => Object.keys(qTable).length
    };
})();
