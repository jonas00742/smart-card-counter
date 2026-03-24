import { SetupView } from './components/SetupView.js';
import { GameTableView } from './components/GameTableView.js';
import { InputModal } from './components/InputModal.js';
import { FeedbackModals } from './components/FeedbackModals.js';

export class GameView {
    constructor(eventBus) {
        this.setup = new SetupView(eventBus);
        this.table = new GameTableView(eventBus);
        this.inputModal = new InputModal(eventBus);
        this.modals = new FeedbackModals(eventBus);

        this._appElements = {
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            setupHeader: document.getElementById('setup-header'),
            gameHeader: document.getElementById('game-header')
        };
    }

    switchScreen(toGame) {
        this._appElements.setupScreen.classList.toggle('hidden', toGame);
        this._appElements.gameScreen.classList.toggle('hidden', !toGame);
        this._appElements.setupHeader.classList.toggle('hidden', toGame);
        this._appElements.gameHeader.classList.toggle('hidden', !toGame);
        this.modals.elements.fabInterimBtn.classList.toggle('hidden', !toGame);
    }

    // --- State Queries ---
    isGameScreenVisible() { return !this._appElements.gameScreen.classList.contains('hidden'); }

    // --- Modal / UI Toggles ---
    showInputModal() { this.inputModal.elements.modal.classList.remove('hidden'); }
    hideInputModal() { this.inputModal.elements.modal.classList.add('hidden'); }
    showEditChoiceModal() { this.modals.elements.editChoiceModal.classList.remove('hidden'); }
    hideEditChoiceModal() { this.modals.elements.editChoiceModal.classList.add('hidden'); }
    hideGameOverModal() { 
        this.modals.elements.gameOverModal.classList.add('hidden'); 
        this.toggleFab(true);
    }
    toggleFab(show) { this.modals.elements.fabInterimBtn.classList.toggle('hidden', !show); }

    // --- View Rendering Delegation ---
    renderSetup(state) { this.setup.renderSetup(state); }
    renderGameTable(state, leaderboard) { this.table.renderGameTable(state, leaderboard); }
    renderModalContent(state, isComplete) { this.inputModal.renderModalContent(state, isComplete); }
    
    showGameOver(leaderboard) { 
        this.modals.showGameOver(leaderboard); 
        this.toggleFab(false);
    }
    showConfirmBackModal() { this.modals.showConfirmBackModal(); }
    hideConfirmBackModal() { this.modals.hideConfirmBackModal(); }
    showValidationAlert(message) { this.modals.showValidationAlert(message); }
    showInterimModal(leaderboard) { this.modals.showInterimModal(leaderboard); }
    
    startPenultimateRoundBlinking() { this.table.startPenultimateRoundBlinking(); }
    stopPenultimateRoundBlinking() { this.table.stopPenultimateRoundBlinking(); }
    toggleInstallButton(show) { this.setup.toggleInstallButton(show); }
}