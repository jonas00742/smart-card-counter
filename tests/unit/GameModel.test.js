/**
 * @jest-environment jsdom
 */

import { GameModel } from '../../js/model.js';

describe('GameModel', () => {
    let model;

    beforeEach(() => {
        localStorage.clear();
        model = new GameModel();
    });

    test('B-U1: addPlayer appends name to both availablePlayers and activePlayers', () => {
        model.addPlayer('Alice');

        expect(model.state.availablePlayers).toContain('Alice');
        expect(model.state.activePlayers).toContain('Alice');
    });

    test('B-U2: advanceGameState in ansage phase transitions to stiche without incrementing round index', () => {
        model.state.activePlayers = ['Alice', 'Bob'];
        model.state.availablePlayers = ['Alice', 'Bob'];
        model.initGameData();

        expect(model.state.phase).toBe('ansage');
        model.advanceGameState();

        expect(model.state.phase).toBe('stiche');
        expect(model.state.currentRoundIndex).toBe(0);
    });

    test('B-U3: advanceGameState in stiche phase at round 12 sets isGameOver to true', () => {
        model.state.activePlayers = ['Alice', 'Bob'];
        model.state.availablePlayers = ['Alice', 'Bob'];
        model.initGameData();
        model.state.currentRoundIndex = 12;
        model.state.phase = 'stiche';
        // Provide valid trick values so recalculateAllScores runs cleanly
        model.state.roundsData[12].Alice.ansage  = 1;
        model.state.roundsData[12].Alice.gemacht = 1;
        model.state.roundsData[12].Bob.ansage    = 0;
        model.state.roundsData[12].Bob.gemacht   = 0;

        model.advanceGameState();

        expect(model.state.isGameOver).toBe(true);
    });
});
