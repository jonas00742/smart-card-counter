/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { EventBus } from '../../js/core/EventBus.js';
import { GameModel } from '../../js/model.js';
import { RoundController } from '../../js/controllers/RoundController.js';
import { EVENTS } from '../../js/core/events.js';

function createMockView() {
    return {
        hideInputModal:                jest.fn(),
        showInputModal:                jest.fn(),
        renderModalContent:            jest.fn(),
        renderGameTable:               jest.fn(),
        showValidationAlert:           jest.fn(),
        showGameOver:                  jest.fn(),
        showEditChoiceModal:           jest.fn(),
        hideEditChoiceModal:           jest.fn(),
        hideGameOverModal:             jest.fn(),
        startPenultimateRoundBlinking: jest.fn(),
        stopPenultimateRoundBlinking:  jest.fn(),
        showInterimModal:              jest.fn(),
        toggleFab:                     jest.fn(),
    };
}

describe('Input-modal save flow — integration', () => {
    let eventBus, model, view;

    beforeEach(() => {
        localStorage.clear();
        global.Audio = jest.fn(() => ({ play: jest.fn().mockResolvedValue(undefined) }));

        eventBus = new EventBus();
        model    = new GameModel();
        view     = createMockView();
        new RoundController(model, view, eventBus);
    });

    test('B-I1: saving a valid tricks entry triggers score recalculation for all players', () => {
        model.state.activePlayers   = ['Alice', 'Bob', 'Carol'];
        model.state.availablePlayers = ['Alice', 'Bob', 'Carol'];
        model.initGameData();

        // Advance model to tricks (stiche) phase for round 0 (1 card)
        model.state.phase = 'stiche';

        // Bids already entered
        model.state.roundsData[0].Alice.ansage = 0;
        model.state.roundsData[0].Bob.ansage   = 0;
        model.state.roundsData[0].Carol.ansage = 0;

        // Valid tricks: Alice takes the only card; sum = 1 = CARDS_SEQUENCE[0]
        model.state.roundsData[0].Alice.gemacht = 1;
        model.state.roundsData[0].Bob.gemacht   = 0;
        model.state.roundsData[0].Carol.gemacht = 0;
        model.state.currentPlayerInputIndex = 2;  // positioned at last player

        eventBus.emit(EVENTS.MODAL_SAVE);

        // Alice bid 0, won 1 → −(|0−1|) = −1
        expect(model.state.roundsData[0].Alice.punkte).toBe(-1);
        // Bob and Carol bid 0, won 0 → POINTS_BASE + 0 = 5
        expect(model.state.roundsData[0].Bob.punkte).toBe(5);
        expect(model.state.roundsData[0].Carol.punkte).toBe(5);
    });

    test('B-I2: saving with an invalid tricks sum shows a validation alert and leaves scores unchanged', () => {
        model.state.activePlayers   = ['Alice', 'Bob', 'Carol'];
        model.state.availablePlayers = ['Alice', 'Bob', 'Carol'];
        model.initGameData();

        model.state.phase = 'stiche';

        model.state.roundsData[0].Alice.ansage = 0;
        model.state.roundsData[0].Bob.ansage   = 0;
        model.state.roundsData[0].Carol.ansage = 0;

        // Invalid: sum = 2 but round 0 has only 1 card
        model.state.roundsData[0].Alice.gemacht = 2;
        model.state.roundsData[0].Bob.gemacht   = 0;
        model.state.roundsData[0].Carol.gemacht = 0;
        model.state.currentPlayerInputIndex = 2;

        eventBus.emit(EVENTS.MODAL_SAVE);

        expect(view.showValidationAlert).toHaveBeenCalledTimes(1);
        // Save was blocked — game state must be unchanged
        expect(model.state.currentRoundIndex).toBe(0);
        expect(model.state.phase).toBe('stiche');
        expect(model.state.roundsData[0].Alice.punkte).toBe(0);
    });
});
