/**
 * @jest-environment jsdom
 */

import { EventBus } from '../../js/core/EventBus.js';
import { GameModel } from '../../js/model.js';
import { SetupView } from '../../js/components/SetupView.js';
import { SetupController } from '../../js/controllers/SetupController.js';
import { EVENTS } from '../../js/core/events.js';

// Minimum HTML that satisfies every getElementById call in SetupView's constructor.
// active-players-container must have a parent so the dealer checkbox can be inserted before it.
function mountDOM() {
    document.body.innerHTML = `
        <input  type="text" id="new-player-name">
        <button id="add-new-player-btn"></button>
        <ul     id="available-players-container"></ul>
        <div    id="active-players-wrapper">
            <ol id="active-players-container"></ol>
        </div>
        <button id="start-game-btn"></button>
        <button id="install-app-btn"></button>
        <div    id="delete-player-modal">
            <p      id="delete-player-text"></p>
            <button id="confirm-delete-player-btn"></button>
            <button id="cancel-delete-player-btn"></button>
        </div>
    `;
}

describe('Setup flow — integration', () => {
    let eventBus, model, setupView, controller;

    beforeEach(() => {
        localStorage.clear();
        mountDOM();

        eventBus  = new EventBus();
        model     = new GameModel();
        setupView = new SetupView(eventBus);

        // SetupController only calls view.renderSetup() — no other view methods are needed here.
        const view = { renderSetup: (props) => setupView.renderSetup(props) };
        controller = new SetupController(model, view, eventBus);
    });

    test('A-I1: emitting SETUP_ADD_PLAYER adds the player chip to the pool DOM', () => {
        eventBus.emit(EVENTS.SETUP_ADD_PLAYER, 'TestPlayer');

        const chips = document.querySelectorAll('#available-players-container .player-chip');
        const names = Array.from(chips).map(chip => chip.querySelector('span').textContent);
        expect(names).toContain('TestPlayer');
    });

    test('A-I2: start-game button is disabled when fewer than 2 players are active', () => {
        // Add exactly one player — handleAddPlayer activates them immediately,
        // then re-renders the setup view via _updateSetupView().
        eventBus.emit(EVENTS.SETUP_ADD_PLAYER, 'Alice');

        const startBtn = document.getElementById('start-game-btn');
        expect(startBtn.disabled).toBe(true);
    });
});
