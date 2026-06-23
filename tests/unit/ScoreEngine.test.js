import { ScoreEngine } from '../../js/core/ScoreEngine.js';

// Builds a minimal state object with one player and the given rounds.
function makeState(rounds, currentRoundIndex = 0) {
    return {
        activePlayers: ['Nina'],
        currentRoundIndex,
        roundsData: rounds,
    };
}

// Builds a single round object for one player with the given bid and tricks.
function makeRound(ansage, gemacht) {
    return {
        Nina: { ansage, gemacht, punkte: 0, gesamtPunkte: 0 },
    };
}

describe('ScoreEngine.recalculateAllScores', () => {
    test('A-U1: correct bid returns 5 + tricks won', () => {
        const state = makeState([makeRound(3, 3)]);
        ScoreEngine.recalculateAllScores(state);
        expect(state.roundsData[0].Nina.punkte).toBe(8); // 5 + 3
    });

    test('A-U2: correct bid with 0 tricks returns exactly 5, not 0', () => {
        const state = makeState([makeRound(0, 0)]);
        ScoreEngine.recalculateAllScores(state);
        expect(state.roundsData[0].Nina.punkte).toBe(5); // 5 + 0
    });

    test('A-U3: overbid returns negative difference', () => {
        const state = makeState([makeRound(5, 2)]);
        ScoreEngine.recalculateAllScores(state);
        expect(state.roundsData[0].Nina.punkte).toBe(-3); // -(5 - 2)
    });

    test('A-U4: underbid returns negative difference', () => {
        const state = makeState([makeRound(1, 4)]);
        ScoreEngine.recalculateAllScores(state);
        expect(state.roundsData[0].Nina.punkte).toBe(-3); // -(4 - 1)
    });

    test('A-U5: cumulative scores accumulate correctly over 3 rounds', () => {
        // Round 0: bid=3, tricks=3 → punkte=8,  cumulative=8
        // Round 1: bid=2, tricks=5 → punkte=-3, cumulative=5
        // Round 2: bid=0, tricks=0 → punkte=5,  cumulative=10
        const state = makeState(
            [makeRound(3, 3), makeRound(2, 5), makeRound(0, 0)],
            2
        );
        ScoreEngine.recalculateAllScores(state);
        expect(state.roundsData[0].Nina.gesamtPunkte).toBe(8);
        expect(state.roundsData[1].Nina.gesamtPunkte).toBe(5);
        expect(state.roundsData[2].Nina.gesamtPunkte).toBe(10);
    });
});
