import { CONFIG } from './config.js';

export class GameController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.deferredPrompt = null;

        // Lauschen, ob die App installierbar ist
        window.addEventListener('beforeinstallprompt', (e) => {
            // Verhindert das automatische Chrome-Banner (wir machen das selbst!)
            e.preventDefault();
            // Speichert das Event, damit wir es später beim Button-Klick auslösen können
            this.deferredPrompt = e;
            // Zeigt unseren eigenen Button an
            this.view.toggleInstallButton(true);
        });

        // Binde den Klick auf unseren neuen Button
        this.view.bindInstallApp(this.handleInstallApp.bind(this));

        // 1. Setup Events Binden
        this.view.bindAddPlayer(this.handleAddPlayer.bind(this));
        this.view.bindTogglePlayer(this.handleTogglePlayer.bind(this));
        this.view.bindRemovePlayer(this.handleRemovePlayer.bind(this));
        this.view.bindMovePlayer(this.handleMovePlayer.bind(this));
        this.view.bindReorderPlayers(this.handleReorderPlayers.bind(this));
        this.view.bindStartGame(this.handleStartGame.bind(this));
        this.view.bindBackToSetup(this.handleBackToSetup.bind(this));
        this.view.bindSwipeBack(this.handleBackToSetup.bind(this));

        // 2. Game Table Events Binden
        this.view.bindOpenInputModal(this.handleOpenInputModal.bind(this));
        this.view.bindTriggerRowEdit(this.handleTriggerRowEdit.bind(this));

        // 3. Modal Events Binden
        this.view.bindModalCancel(this.handleModalCancel.bind(this));
        this.view.bindModalPrev(this.handleModalPrev.bind(this));
        this.view.bindModalNext(this.handleModalNext.bind(this));
        this.view.bindNumberInput(this.handleNumberInput.bind(this));
        this.view.bindModalSave(this.handleModalSave.bind(this));

        // 4. Edit Choice Events Binden
        this.view.bindEditChoiceClose(this.handleEditChoiceClose.bind(this));
        this.view.bindEditChoiceSelect(this.handleEditChoiceSelect.bind(this));

        // Auf den nativen Zurück-Button des Browsers/Smartphones lauschen
        window.addEventListener('popstate', this.handlePopState.bind(this));

        // Initiale Anzeige basierend auf gespeichertem Zustand
        if (this.model.state.roundsData && this.model.state.roundsData.length > 0) {
            // URL anpassen, ohne die Seite neu zu laden
            window.history.replaceState({ screen: 'game' }, '', '#game');
            this.view.switchScreen(true);
            this.view.renderGameTable(this.model.state);
        } else {
            // URL anpassen
            window.history.replaceState({ screen: 'setup' }, '', '#setup');
            this.view.renderSetup(this.model.state);
        }
    }

    // --- SETUP HANDLER ---
    handleAddPlayer(name) { this.model.addPlayer(name); this.view.renderSetup(this.model.state); }
    handleTogglePlayer(player) { this.model.togglePlayerActive(player); this.view.renderSetup(this.model.state); }
    handleRemovePlayer(player) { this.model.removePlayer(player); this.view.renderSetup(this.model.state); }
    handleMovePlayer(index, direction) { this.model.movePlayer(index, direction); this.view.renderSetup(this.model.state); }
    handleReorderPlayers(newOrder) { this.model.setPlayerOrder(newOrder); this.view.renderSetup(this.model.state); }

    handleStartGame() {
        this.model.initGameData();
        // Einen Eintrag in den Browser-Verlauf hinzufügen
        window.history.pushState({ screen: 'game' }, '', '#game');
        
        this.view.switchScreen(true);
        this.view.renderGameTable(this.model.state);
    }

    handleBackToSetup() {
        window.history.back();
    }

    handlePopState(event) {
        if (!this.view.elements.gameScreen.classList.contains('hidden')) {
            if (confirm("Wirklich zurück? Der aktuelle Spielstand geht verloren!")) {
                this.model.quitGame();
                this.view.switchScreen(false);
                this.view.renderSetup(this.model.state);
            } else {
                // Wenn der Nutzer "Abbrechen" drückt, ist der Verlauf im Browser schon einen Schritt zurückgegangen.
                // Wir müssen den "#game"-State wieder künstlich hinzufügen, damit der Nutzer im Spiel bleibt.
                window.history.pushState({ screen: 'game' }, '', '#game');
            }
        } else {
            // Wir sind bereits im Setup (z.B. durch mehrfaches Zurückklicken)
            this.view.switchScreen(false);
            this.view.renderSetup(this.model.state);
        }
    }

    // --- GAME HANDLER ---
    handleToggleGlobalEdit() {
        this.model.state.globalEditMode = !this.model.state.globalEditMode;
        this.view.renderGameTable(this.model.state);
    }

    handleOpenInputModal() {
        this.model.state.isEditMode = false;
        
        // Finde ersten Spieler ohne Wert
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

        if (hasGemacht) {
            this.view.elements.editChoiceModal.classList.remove('hidden');
        } else {
            this.startEditModal('ansage');
        }
    }

    // --- MODAL HANDLER ---
    handleModalCancel() {
        this.view.elements.modal.classList.add('hidden');
        this.view.renderGameTable(this.model.state);
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
        this.view.elements.modal.classList.add('hidden');
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
            this.model.state.globalEditMode = false; 
        } else {
            if (this.model.state.phase === 'ansage') {
                this.model.state.phase = 'stiche';
            } else {
                this.model.recalculateAllScores();
                this.model.state.phase = 'ansage';
                this.model.state.currentRoundIndex++;
                
                if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS) {
                    alert("Spiel beendet!");
                    this.model.state.currentRoundIndex = CONFIG.TOTAL_ROUNDS - 1;
                    this.view.elements.openInputModalBtn.classList.add('hidden');
                }
            }
        }
        this.view.renderGameTable(this.model.state);
    }

    // --- EDIT CHOICE HANDLER ---
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
        
        // Zeige den echten Installations-Dialog des Smartphones
        this.deferredPrompt.prompt();
        
        // Warte auf die Antwort des Nutzers
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        
        // Wenn er auf "Installieren" geklickt hat, verstecken wir unseren Button
        if (outcome === 'accepted') {
            this.view.toggleInstallButton(false);
        }
        
        // Wir können den Prompt nur einmal nutzen, danach leeren wir ihn
        this.deferredPrompt = null;
    }
}