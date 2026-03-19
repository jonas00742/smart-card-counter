import { CONFIG } from './config.js';

export class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.deferredPrompt = null;

        this.initInstallPrompt();
        this.bindEvents();
        this.initRouter();
    }

    initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.view.toggleInstallButton(true);
        });
        this.view.bindInstallApp(this.handleInstallApp.bind(this));
    }

    bindEvents() {
        // Setup
        this.view.bindAddPlayer(this.handleAddPlayer.bind(this));
        this.view.bindTogglePlayer(this.handleTogglePlayer.bind(this));
        this.view.bindRemovePlayer(this.handleRemovePlayer.bind(this));
        this.view.bindReorderPlayers(this.handleReorderPlayers.bind(this));
        this.view.bindSetDealer(this.handleSetDealer.bind(this)); 
        this.view.bindStartGame(this.handleStartGame.bind(this));

        // Game Table
        this.view.bindOpenInputModal(this.handleOpenInputModal.bind(this));
        this.view.bindGoBack(this.handleGoBack.bind(this));
        this.view.bindTriggerRowEdit(this.handleTriggerRowEdit.bind(this));

        // Modal
        this.view.bindModalCancel(this.handleModalCancel.bind(this));
        this.view.bindModalPrev(this.handleModalPrev.bind(this));
        this.view.bindModalNext(this.handleModalNext.bind(this));
        this.view.bindNumberInput(this.handleNumberInput.bind(this));
        this.view.bindModalSave(this.handleModalSave.bind(this));

        // Game Over & Confirm
        this.view.bindCloseGameOver(this.handleCloseGameOver.bind(this));
        this.view.bindConfirmBackAccept(this.handleConfirmBackAccept.bind(this));
        this.view.bindConfirmBackCancel(this.handleConfirmBackCancel.bind(this));

        // Edit Choice
        this.view.bindEditChoiceClose(this.handleEditChoiceClose.bind(this));
        this.view.bindEditChoiceSelect(this.handleEditChoiceSelect.bind(this));

        // Interim FAB
        this.view.bindToggleInterim(this.handleToggleInterim.bind(this));
    }

    initRouter() {
        window.addEventListener('popstate', this.handlePopState.bind(this));

        if (this.model.state.roundsData && this.model.state.roundsData.length > 0) {
            window.history.replaceState({ screen: 'game' }, '', '#game');
            this.view.switchScreen(true);
            this.view.renderGameTable(this.model.state, this.model.getLeaderboard());

            // Check if we should be blinking on page load
            const { currentRoundIndex, phase, roundsData, activePlayers } = this.model.state;
            if (currentRoundIndex === CONFIG.TOTAL_ROUNDS - 1 && phase === 'ansage') {
                if (roundsData[currentRoundIndex]) { // Ensure round data exists
                    const lastRoundData = roundsData[currentRoundIndex];
                    const isAnsageStarted = activePlayers.some(p => lastRoundData[p] && lastRoundData[p].ansage !== null);
                    
                    if (!isAnsageStarted) {
                        this.view.startPenultimateRoundBlinking();
                    }
                }
            }
        } else {
            window.history.replaceState({ screen: 'setup' }, '', '#setup');
            this.view.renderSetup(this.model.state);
        }
    }

    handleAddPlayer(name) { this.model.addPlayer(name); this.view.renderSetup(this.model.state); }
    handleTogglePlayer(player) { this.model.togglePlayerActive(player); this.view.renderSetup(this.model.state); }
    handleRemovePlayer(player) { this.model.removePlayer(player); this.view.renderSetup(this.model.state); }
    handleReorderPlayers(newOrder) { this.model.setPlayerOrder(newOrder); this.view.renderSetup(this.model.state); }
    handleSetDealer(index) { this.model.setStartingDealer(index); this.view.renderSetup(this.model.state); }

    handleStartGame() {
        this.model.initGameData();
        window.history.pushState({ screen: 'game' }, '', '#game');
        this.view.switchScreen(true);
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handlePopState(event) {
        const isGameScreenVisible = !this.view.elements.gameScreen.classList.contains('hidden');
        
        if (isGameScreenVisible && !this.model.state.isGameOver) {
            window.history.pushState({ screen: 'game' }, '', '#game');
            this.view.showConfirmBackModal();
        } 
        else if (isGameScreenVisible && this.model.state.isGameOver) {
            this.model.quitGame();
            this.view.switchScreen(false);
            this.view.renderSetup(this.model.state);
        } 
        else {
            this.view.switchScreen(false);
            this.view.renderSetup(this.model.state);
        }
    }

    handleConfirmBackAccept() {
        this.view.hideConfirmBackModal();
        this.model.quitGame();
        window.history.replaceState({ screen: 'setup' }, '', '#setup');
        this.view.switchScreen(false);
        this.view.renderSetup(this.model.state);
    }

    handleConfirmBackCancel() {
        this.view.hideConfirmBackModal();
    }

    handleGoBack() {
        this.view.showConfirmBackModal();
    }

    handleOpenInputModal() {
        this.model.clearAutoFillTracker();
        this.model.state.isEditMode = false;
        const rIndex = this.model.state.currentRoundIndex;
        const phase = this.model.state.phase;
        
        const firstEmptyIdx = this.model.state.activePlayers.findIndex(p => {
            return this.model.state.roundsData[rIndex][p][phase === 'ansage' ? 'ansage' : 'gemacht'] === null;
        });
        
        this.model.state.currentPlayerInputIndex = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        this.view.elements.modal.classList.remove('hidden');
        this.view.elements.fabInterimBtn.classList.add('hidden');
    }

    handleTriggerRowEdit(rIndex) {
        const roundData = this.model.state.roundsData[rIndex];
        const firstPlayer = this.model.state.activePlayers[0];
        const hasGemacht = roundData[firstPlayer].gemacht !== null;
        
        this.model.state.editRoundIndex = rIndex;

        if (hasGemacht) {
            this.view.elements.editChoiceModal.classList.remove('hidden');
            this.view.elements.fabInterimBtn.classList.add('hidden');
        } else this.startEditModal('ansage');
    }

    handleModalCancel() {
        this.model.clearAutoFillTracker();
        this.view.elements.modal.classList.add('hidden');
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handleModalPrev() {
        if (this.model.state.currentPlayerInputIndex > 0) {
            this.model.state.currentPlayerInputIndex--;
            this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        }
    }

    handleModalNext() {
        if (this.model.state.currentPlayerInputIndex < this.model.state.activePlayers.length - 1) {
            this.model.state.currentPlayerInputIndex++;
            this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        }
    }

    handleNumberInput(val) {
        // Stop blinking when user starts entering 'ansage' for the final round.
        const { rIndex, phase } = this.model.currentContext;

        if (rIndex === CONFIG.TOTAL_ROUNDS - 1 && phase === 'ansage') {
            this.view.stopPenultimateRoundBlinking();
        }

        // If the phase was ready, it means auto-fill might have been applied.
        // Any new input invalidates that, so we clear auto-filled values first.
        if (this.model.isPhaseReadyForSave()) {
            this.model.resetAutoFilledValues();
        }

        this.model.setInputValue(val);
        this.model.applyAutoFill();
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
    }

    handleModalSave() {
        const { rIndex, phase } = this.model.currentContext;

        if (phase === 'stiche') {
            const validation = this.model.validateSticheSum(rIndex);
            if (!validation.valid) {
                this.view.showValidationAlert(validation.message);
                return;
            }
        }

        this.model.clearAutoFillTracker();
        this.view.elements.modal.classList.add('hidden');
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
        } else {
            if (this.model.state.phase === 'ansage') {
                this.model.state.phase = 'stiche';
            } else {
                // Check if the penultimate round's tricks were just entered.
                if (this.model.state.currentRoundIndex === CONFIG.TOTAL_ROUNDS - 2) {
                    this.view.startPenultimateRoundBlinking();
                }

                this.model.recalculateAllScores();
                
                if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS - 1) {
                    this.model.state.isGameOver = true;
                    this.model.saveState();
                    this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
                    this.view.showGameOver(this.model.getLeaderboard());
                    return; 
                }

                this.model.state.phase = 'ansage';
                this.model.state.currentRoundIndex++;
            }
        }
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handleCloseGameOver() {
        this.view.elements.gameOverModal.classList.add('hidden');
    }

    handleEditChoiceClose() { 
        this.view.elements.editChoiceModal.classList.add('hidden'); 
        this.view.elements.fabInterimBtn.classList.remove('hidden');
    }
    handleEditChoiceSelect(phase) {
        this.view.elements.editChoiceModal.classList.add('hidden');
        this.startEditModal(phase);
    }

    handleToggleInterim() {
        this.view.showInterimModal(this.model.getLeaderboard());
    }

    startEditModal(phase) {
        this.model.state.isEditMode = true;
        this.model.state.editPhase = phase;
        this.model.state.currentPlayerInputIndex = 0;
        
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        this.view.elements.modal.classList.remove('hidden');
        this.view.elements.fabInterimBtn.classList.add('hidden');
    }

    async handleInstallApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') this.view.toggleInstallButton(false);
        this.deferredPrompt = null;
    }
}