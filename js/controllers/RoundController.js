import { CONFIG } from '../config.js';

export class RoundController {
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;
        this.bindEvents();
    }

    bindEvents() {
        this.eventBus.on('GAME_OPEN_MODAL', this.handleOpenInputModal.bind(this));
        this.eventBus.on('GAME_TRIGGER_EDIT', this.handleTriggerRowEdit.bind(this));

        this.eventBus.on('MODAL_CANCEL', this.handleModalCancel.bind(this));
        this.eventBus.on('MODAL_PREV', this.handleModalPrev.bind(this));
        this.eventBus.on('MODAL_NEXT', this.handleModalNext.bind(this));
        this.eventBus.on('MODAL_NUMBER_INPUT', this.handleNumberInput.bind(this));
        this.eventBus.on('MODAL_RESET', this.handleModalReset.bind(this));
        this.eventBus.on('MODAL_SAVE', this.handleModalSave.bind(this));

        this.eventBus.on('GAME_OVER_CLOSE', () => this.view.elements.gameOverModal.classList.add('hidden'));
        this.eventBus.on('EDIT_CHOICE_CLOSE', this.handleEditChoiceClose.bind(this));
        this.eventBus.on('EDIT_CHOICE_SELECT', this.handleEditChoiceSelect.bind(this));
        this.eventBus.on('TOGGLE_INTERIM', () => this.view.showInterimModal(this.model.getLeaderboard()));
    }

    handleOpenInputModal() {
        this.model.clearAutoFillTracker();
        this.model.state.isEditMode = false;
        const rIndex = this.model.state.currentRoundIndex;
        const phase = this.model.state.phase;
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';
        
        const firstEmptyIdx = this.model.state.activePlayers.findIndex(p => this.model.state.roundsData[rIndex][p][key] === null);
        this.model.state.currentPlayerInputIndex = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
        
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        this.view.elements.modal.classList.remove('hidden');
        this.view.elements.fabInterimBtn.classList.add('hidden');
    }

    handleTriggerRowEdit(rIndex) {
        this.model.state.editRoundIndex = rIndex;
        const isPastRound = rIndex < this.model.state.currentRoundIndex || this.model.state.isGameOver;
        const isCurrentRoundStichePhase = rIndex === this.model.state.currentRoundIndex && this.model.state.phase === 'stiche';

        if (isPastRound || isCurrentRoundStichePhase) {
            this.view.elements.editChoiceModal.classList.remove('hidden');
            this.view.elements.fabInterimBtn.classList.add('hidden');
        } else {
            this.startEditModal('ansage');
        }
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
        const { rIndex, phase } = this.model.currentContext;
        if (rIndex === CONFIG.TOTAL_ROUNDS - 1 && phase === 'ansage') this.view.stopPenultimateRoundBlinking();
        if (this.model.isPhaseReadyForSave()) this.model.resetAutoFilledValues();

        this.model.setInputValue(val);
        this.model.applyAutoFill();
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
    }

    handleModalReset() {
        this.model.resetCurrentPhaseInputs();
        this.model.state.currentPlayerInputIndex = 0;
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
    }

    handleModalSave() {
        const { rIndex, phase } = this.model.currentContext;
        if (phase === 'stiche') {
            const validation = this.model.validateSticheSum(rIndex);
            if (!validation.valid) return this.view.showValidationAlert(validation.message);
        }

        this.model.clearAutoFillTracker();
        this.view.elements.modal.classList.add('hidden');
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
        } else {
            if (this.model.state.phase === 'ansage') {
                this.model.state.phase = 'stiche';
                this.model.saveState();
            } else {
                if (this.model.state.currentRoundIndex === CONFIG.TOTAL_ROUNDS - 2) this.view.startPenultimateRoundBlinking();
                this.model.recalculateAllScores();
                
                if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS - 1) {
                    this.model.state.isGameOver = true;
                    this.model.saveState();
                    this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
                    return this.view.showGameOver(this.model.getLeaderboard());
                }
                this.model.state.phase = 'ansage';
                this.model.state.currentRoundIndex++;
                this.model.saveState();
            }
        }
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    handleEditChoiceClose() { 
        this.view.elements.editChoiceModal.classList.add('hidden'); 
        this.view.elements.fabInterimBtn.classList.remove('hidden');
    }

    handleEditChoiceSelect(phase) {
        this.view.elements.editChoiceModal.classList.add('hidden');
        this.startEditModal(phase);
    }

    startEditModal(phase) {
        this.model.state.isEditMode = true;
        this.model.state.editPhase = phase;
        this.model.state.currentPlayerInputIndex = 0;
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        this.view.elements.modal.classList.remove('hidden');
        this.view.elements.fabInterimBtn.classList.add('hidden');
    }
}