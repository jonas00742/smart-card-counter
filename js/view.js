import { SetupView } from './components/SetupView.js';
import { GameTableView } from './components/GameTableView.js';
import { InputModal } from './components/InputModal.js';
import { FeedbackModals } from './components/FeedbackModals.js';

export class GameView {
    constructor() {
        this.setup = new SetupView();
        this.table = new GameTableView();
        this.inputModal = new InputModal();
        this.modals = new FeedbackModals();

        this._appElements = {
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            setupHeader: document.getElementById('setup-header'),
            gameHeader: document.getElementById('game-header')
        };
        
        // The Proxy maintains flawless compatibility. Any Controller access to 
        // `this.view.elements.xxx` gets routed seamlessly to the correct sub-view component.
        this.elements = new Proxy({}, {
            get: (target, prop) => {
                if (this._appElements[prop]) return this._appElements[prop];
                if (this.setup.elements[prop]) return this.setup.elements[prop];
                if (this.table.elements[prop]) return this.table.elements[prop];
                if (this.inputModal.elements[prop]) return this.inputModal.elements[prop];
                if (this.modals.elements[prop]) return this.modals.elements[prop];
                return undefined;
            }
        });
    }

    switchScreen(toGame) {
        this._appElements.setupScreen.classList.toggle('hidden', toGame);
        this._appElements.gameScreen.classList.toggle('hidden', !toGame);
        this._appElements.setupHeader.classList.toggle('hidden', toGame);
        this._appElements.gameHeader.classList.toggle('hidden', !toGame);
        this.modals.elements.fabInterimBtn.classList.toggle('hidden', !toGame);
    }

    // --- View Rendering Delegation ---
    renderSetup(state) { this.setup.renderSetup(state); }
    renderGameTable(state, leaderboard) { this.table.renderGameTable(state, leaderboard); }
    renderModalContent(state, isComplete) { this.inputModal.renderModalContent(state, isComplete); }
    
    showGameOver(leaderboard) { this.modals.showGameOver(leaderboard); }
    showConfirmBackModal() { this.modals.showConfirmBackModal(); }
    hideConfirmBackModal() { this.modals.hideConfirmBackModal(); }
    showValidationAlert(message) { this.modals.showValidationAlert(message); }
    showInterimModal(leaderboard) { this.modals.showInterimModal(leaderboard); }
    
    startPenultimateRoundBlinking() { this.table.startPenultimateRoundBlinking(); }
    stopPenultimateRoundBlinking() { this.table.stopPenultimateRoundBlinking(); }
    toggleInstallButton(show) { this.setup.toggleInstallButton(show); }

    // --- Event Bindings Delegation ---
    bindAddPlayer(h) { this.setup.bindAddPlayer(h); }
    bindInstallApp(h) { this.setup.bindInstallApp(h); }
    bindTogglePlayer(h) { this.setup.bindTogglePlayer(h); }
    bindRemovePlayer(h) { this.setup.bindRemovePlayer(h); }
    bindReorderPlayers(h) { this.setup.bindReorderPlayers(h); }
    bindSetDealer(h) { this.setup.bindSetDealer(h); }
    bindStartGame(h) { this.setup.bindStartGame(h); }

    bindGoBack(h) { this.table.bindGoBack(h); }
    bindOpenInputModal(h) { this.table.bindOpenInputModal(h); }
    bindTriggerRowEdit(h) { this.table.bindTriggerRowEdit(h); }

    bindModalCancel(h) { this.inputModal.bindModalCancel(h); }
    bindModalPrev(h) { this.inputModal.bindModalPrev(h); }
    bindModalNext(h) { this.inputModal.bindModalNext(h); }
    bindNumberInput(h) { this.inputModal.bindNumberInput(h); }
    bindModalReset(h) { this.inputModal.bindModalReset(h); }
    bindModalSave(h) { this.inputModal.bindModalSave(h); }

    bindEditChoiceClose(h) { this.modals.bindEditChoiceClose(h); }
    bindEditChoiceSelect(h) { this.modals.bindEditChoiceSelect(h); }
    bindCloseGameOver(h) { this.modals.bindCloseGameOver(h); }
    bindConfirmBackAccept(h) { this.modals.bindConfirmBackAccept(h); }
    bindConfirmBackCancel(h) { this.modals.bindConfirmBackCancel(h); }
    bindToggleInterim(h) { this.modals.bindToggleInterim(h); }
}