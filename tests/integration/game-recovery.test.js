/**
 * @jest-environment jsdom
 */

import { GameModel } from '../../js/model.js';

// Must match GameModel.STORAGE_KEY exactly.
const STORAGE_KEY = 'smartCounterState';

const PLAYERS = ['Alice', 'Bob', 'Carol'];

// Builds a realistic mid-game state with 5 completed rounds out of 13.
// isEditMode is deliberately set to true to verify it is reset on load.
function buildMidGameState() {
    return {
        availablePlayers: PLAYERS,
        activePlayers: PLAYERS,
        currentRoundIndex: 5,
        startingDealerIndex: 0,
        phase: 'ansage',
        isGameOver: false,
        isEditMode: true,
        editRoundIndex: 2,
        editPhase: 'stiche',
        currentPlayerInputIndex: 0,
        roundsData: Array.from({ length: 13 }, (_, i) => {
            const played = i < 5;
            return {
                Alice: { ansage: played ? 1 : null, gemacht: played ? 1 : null, punkte: played ? 6  : 0, gesamtPunkte: played ? 6  : 0 },
                Bob:   { ansage: played ? 0 : null, gemacht: played ? 0 : null, punkte: played ? 5  : 0, gesamtPunkte: played ? 5  : 0 },
                Carol: { ansage: played ? 2 : null, gemacht: played ? 1 : null, punkte: played ? -1 : 0, gesamtPunkte: played ? -1 : 0 },
            };
        }),
    };
}

describe('Game recovery — integration', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('A-I3: mid-game localStorage state is fully restored on GameModel reload', () => {
        // Simulate a previous session by writing state into localStorage directly.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(buildMidGameState()));

        // Construct a fresh model — this is what happens when the app restarts.
        const model = new GameModel();

        // Round index and players must be restored exactly.
        expect(model.state.currentRoundIndex).toBe(5);
        expect(model.state.activePlayers).toEqual(PLAYERS);

        // isEditMode was true in storage but must be reset — it is a transient UI flag.
        expect(model.state.isEditMode).toBe(false);

        // Round data for a completed round must be preserved.
        expect(model.state.roundsData[4].Alice.punkte).toBe(6);

        // Round data for the not-yet-played current round must still be null.
        expect(model.state.roundsData[5].Alice.ansage).toBeNull();
    });
});
