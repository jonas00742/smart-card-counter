import { CONFIG } from './config.js';

export class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.deferredPrompt = null;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.view.toggleInstallButton(true);
        });

        this.view.bindInstallApp(this.handleInstallApp.bind(this));

        // Setup Events Binden
        this.view.bindAddPlayer(this.handleAddPlayer.bind(this));
        this.view.bindTogglePlayer(this.handleTogglePlayer.bind(this));
        this.view.bindRemovePlayer(this.handleRemovePlayer.bind(this));
        this.view.bindMovePlayer(this.handleMovePlayer.bind(this));
        this.view.bindReorderPlayers(this.handleReorderPlayers.bind(this));
        this.view.bindSetDealer(this.handleSetDealer.bind(this)); 
        this.view.bindStartGame(this.handleStartGame.bind(this));
        this.view.bindBackToSetup(this.handleBackToSetup.bind(this));
        this.view.bindSwipeBack(this.handleBackToSetup.bind(this));

        // Game Table Events Binden
        this.view.bindOpenInputModal(this.handleOpenInputModal.bind(this));
        this.view.bindTriggerRowEdit(this.handleTriggerRowEdit.bind(this));

        // Modal Events Binden
        this.view.bindModalCancel(this.handleModalCancel.bind(this));
        this.view.bindModalPrev(this.handleModalPrev.bind(this));
        this.view.bindModalNext(this.handleModalNext.bind(this));
        this.view.bindNumberInput(this.handleNumberInput.bind(this));
        this.view.bindModalSave(this.handleModalSave.bind(this));

        // Game Over Events
        this.view.bindCloseGameOver(this.handleCloseGameOver.bind(this));

        // Edit Choice Events Binden
        this.view.bindEditChoiceClose(this.handleEditChoiceClose.bind(this));
        this.view.bindEditChoiceSelect(this.handleEditChoiceSelect.bind(this));

        window.addEventListener('popstate', this.handlePopState.bind(this));

        if (this.model.state.roundsData && this.model.state.roundsData.length > 0) {
            window.history.replaceState({ screen: 'game' }, '', '#game');
            this.view.switchScreen(true);
            this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
        } else {
            window.history.replaceState({ screen: 'setup' }, '', '#setup');
            this.view.renderSetup(this.model.state);
        }
    }

    handleAddPlayer(name) { this.model.addPlayer(name); this.view.renderSetup(this.model.state); }
    handleTogglePlayer(player) { this.model.togglePlayerActive(player); this.view.renderSetup(this.model.state); }
    handleRemovePlayer(player) { this.model.removePlayer(player); this.view.renderSetup(this.model.state); }
    handleMovePlayer(index, direction) { this.model.movePlayer(index, direction); this.view.renderSetup(this.model.state); }
    handleReorderPlayers(newOrder) { this.model.setPlayerOrder(newOrder); this.view.renderSetup(this.model.state); }
    handleSetDealer(index) { this.model.setStartingDealer(index); this.view.renderSetup(this.model.state); }

    handleStartGame() {
        this.model.initGameData();
        window.history.pushState({ screen: 'game' }, '', '#game');
        this.view.switchScreen(true);
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handleBackToSetup() { window.history.back(); }

    handlePopState(event) {
        if (!this.view.elements.gameScreen.classList.contains('hidden')) {
            if (confirm("Wirklich zurück? Der aktuelle Spielstand geht verloren!")) {
                this.model.quitGame();
                this.view.switchScreen(false);
                this.view.renderSetup(this.model.state);
            } else {
                window.history.pushState({ screen: 'game' }, '', '#game');
            }
        } else {
            this.view.switchScreen(false);
            this.view.renderSetup(this.model.state);
        }
    }

    handleOpenInputModal() {
        this.model.state.isEditMode = false;
        let firstEmptyIdx = this.model.state.activePlayers.findIndex(p => {
            const val = this.model.state.phase === 'ansage' 
                ? this.model.state.roundsData[this.model.state.currentRoundIndex][p].ansage 
                : this.model.state.roundsData[this.model.state.currentRoundIndex][p].gemacht;
            return val === null;
        });
        this.model.state.currentPlayerInputIndex = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
        
        this.view.renderModalContent(this.model.state, this.model.isCurrentPhaseComplete());
        this.view.elements.modal.classList.remove('hidden');
    }

    handleTriggerRowEdit(rIndex) {
        const roundData = this.model.state.roundsData[rIndex];
        const firstPlayer = this.model.state.activePlayers[0];
        const hasGemacht = roundData[firstPlayer].gemacht !== null;
        
        this.model.state.editRoundIndex = rIndex;

        if (hasGemacht) this.view.elements.editChoiceModal.classList.remove('hidden');
        else this.startEditModal('ansage');
    }

    handleModalCancel() {
        this.view.elements.modal.classList.add('hidden');
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handleModalPrev() {
        if (this.model.state.currentPlayerInputIndex > 0) {
            this.model.state.currentPlayerInputIndex--;
            this.view.renderModalContent(this.model.state, this.model.isCurrentPhaseComplete());
        }
    }

    handleModalNext() {
        if (this.model.state.currentPlayerInputIndex < this.model.state.activePlayers.length - 1) {
            this.model.state.currentPlayerInputIndex++;
            this.view.renderModalContent(this.model.state, this.model.isCurrentPhaseComplete());
        }
    }

    handleNumberInput(val) {
        this.model.setInputValue(val);
        this.view.renderModalContent(this.model.state, this.model.isCurrentPhaseComplete());
    }

    handleModalSave() {
        const rIndex = this.model.state.isEditMode ? this.model.state.editRoundIndex : this.model.state.currentRoundIndex;
        const phase = this.model.state.isEditMode ? this.model.state.editPhase : this.model.state.phase;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];

        if (phase === 'stiche') {
            let sumGemacht = 0;
            this.model.state.activePlayers.forEach(p => { sumGemacht += this.model.state.roundsData[rIndex][p].gemacht || 0; });
            if (sumGemacht !== cards) {
                alert(`Logik-Fehler:\nEs wurden ${cards} Karten ausgeteilt, aber es wurden insgesamt ${sumGemacht} Stiche eingetragen.\nBitte korrigiere die Eingaben.`);
                return;
            }
        }

        this.view.elements.modal.classList.add('hidden');
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
            this.model.state.globalEditMode = false; 
        } else {
            if (this.model.state.phase === 'ansage') {
                this.model.state.phase = 'stiche';
            } else {
                this.model.recalculateAllScores();
                
                // --- NEU: Spielende Logik ---
                if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS - 1) {
                    this.model.state.isGameOver = true;
                    this.model.saveState();
                    this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
                    this.view.showGameOver(this.model.getLeaderboard());
                    return; // Bricht hier ab, damit die Runde nicht mehr erhöht wird
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

    handleEditChoiceClose() { this.view.elements.editChoiceModal.classList.add('hidden'); }
    handleEditChoiceSelect(phase) {
        this.view.elements.editChoiceModal.classList.add('hidden');
        this.startEditModal(phase);
    }

    startEditModal(phase) {
        this.model.state.isEditMode = true;
        this.model.state.editPhase = phase;
        this.model.state.currentPlayerInputIndex = 0;
        
        this.view.renderModalContent(this.model.state, this.model.isCurrentPhaseComplete());
        this.view.elements.modal.classList.remove('hidden');
    }

    async handleInstallApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') this.view.toggleInstallButton(false);
        this.deferredPrompt = null;
    }
}