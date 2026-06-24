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

describe('Edit-mode cascade recalculation — integration', () => {
    let eventBus, model, view;

    beforeEach(() => {
        localStorage.clear();
        // Audio constructor is invoked inside _checkAudioTriggers when leadership changes
        global.Audio = jest.fn(() => ({ play: jest.fn().mockResolvedValue(undefined) }));

        eventBus = new EventBus();
        model    = new GameModel();
        view     = createMockView();
        new RoundController(model, view, eventBus);
    });

    test('B-I3: editing a past bid recalculates gesamtPunkte for all subsequent completed rounds', () => {
        // Set up 3 players with 3 completed rounds (indices 0–2)
        model.state.activePlayers   = ['Alice', 'Bob', 'Carol'];
        model.state.availablePlayers = ['Alice', 'Bob', 'Carol'];
        model.initGameData();
        model.state.currentRoundIndex = 3;  // next unplayed round
        model.state.phase = 'ansage';

        // Round 0 (1 card): Alice takes 1 trick
        model.state.roundsData[0].Alice = { ansage: 0, gemacht: 1, punkte: -1, gesamtPunkte:  -1 };
        model.state.roundsData[0].Bob   = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:   5 };
        model.state.roundsData[0].Carol = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:   5 };

        // Round 1 (2 cards): Alice takes 2 tricks; Bob bid=0 won=0 → +5
        model.state.roundsData[1].Alice = { ansage: 0, gemacht: 2, punkte: -2, gesamtPunkte:  -3 };
        model.state.roundsData[1].Bob   = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:  10 };
        model.state.roundsData[1].Carol = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:  10 };

        // Round 2 (3 cards): Alice takes 3 tricks
        model.state.roundsData[2].Alice = { ansage: 0, gemacht: 3, punkte: -3, gesamtPunkte:  -6 };
        model.state.roundsData[2].Bob   = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:  15 };
        model.state.roundsData[2].Carol = { ansage: 0, gemacht: 0, punkte:  5, gesamtPunkte:  15 };

        // Activate edit mode for round 1, bid (ansage) phase, positioned at Bob (index 1)
        model.startEditMode(1, 'ansage');
        model.state.currentPlayerInputIndex = 1;  // Bob
        model.setInputValue(2);  // Bob's new bid: 2 (was 0)

        eventBus.emit(EVENTS.MODAL_SAVE);

        // Bob round 1: bid=2, won=0 → punkte = −(|2−0|) = −2
        expect(model.state.roundsData[1].Bob.punkte).toBe(-2);
        // Bob gesamtPunkte[1] = 5 (from round 0) + (−2) = 3  (was 10)
        expect(model.state.roundsData[1].Bob.gesamtPunkte).toBe(3);
        // Bob gesamtPunkte[2] = 3 + 5 = 8  (was 15)
        expect(model.state.roundsData[2].Bob.gesamtPunkte).toBe(8);
    });
});
