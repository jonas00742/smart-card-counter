import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

export class RoundController {
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;
        this.bindEvents();
    }

    bindEvents() {
        this.eventBus.on(EVENTS.GAME_OPEN_MODAL, this.handleOpenInputModal.bind(this));
        this.eventBus.on(EVENTS.GAME_TRIGGER_EDIT, this.handleTriggerRowEdit.bind(this));

        this.eventBus.on(EVENTS.MODAL_CANCEL, this.handleModalCancel.bind(this));
        this.eventBus.on(EVENTS.MODAL_PREV, this.handleModalPrev.bind(this));
        this.eventBus.on(EVENTS.MODAL_NEXT, this.handleModalNext.bind(this));
        this.eventBus.on(EVENTS.MODAL_NUMBER_INPUT, this.handleNumberInput.bind(this));
        this.eventBus.on(EVENTS.MODAL_RESET, this.handleModalReset.bind(this));
        this.eventBus.on(EVENTS.MODAL_SAVE, this.handleModalSave.bind(this));
        this.eventBus.on('modal:magicFill', this.handleMagicFill.bind(this));

        this.eventBus.on(EVENTS.GAME_OVER_CLOSE, () => this.view.hideGameOverModal());
        this.eventBus.on(EVENTS.EDIT_CHOICE_CLOSE, this.handleEditChoiceClose.bind(this));
        this.eventBus.on(EVENTS.EDIT_CHOICE_SELECT, this.handleEditChoiceSelect.bind(this));
        this.eventBus.on(EVENTS.TOGGLE_INTERIM, () => {
            if (this.model.state.isGameOver) {
                this.view.showGameOver(this.model.getLeaderboard());
            } else {
                this.view.showInterimModal(this.model.getLeaderboard());
            }
        });
        this.eventBus.on('GAME_TOGGLE_BIDS', () => {
            if (!this.model.state.isGameOver && this.model.state.phase === 'stiche') {
                this.view.table.showBidsModal(this.model.state);
                this.view.toggleFab(false);
            }
        });
        this.eventBus.on('MODAL_BIDS_CLOSE', () => {
            this.view.toggleFab(true);
        });
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
        this.view.showInputModal();
    }

    handleTriggerRowEdit(rIndex) {
        this.model.state.editRoundIndex = rIndex;
        const isPastRound = rIndex < this.model.state.currentRoundIndex || this.model.state.isGameOver;
        const isCurrentRoundTricksPhase = rIndex === this.model.state.currentRoundIndex && this.model.state.phase === 'stiche';

        if (isPastRound || isCurrentRoundTricksPhase) {
            this.view.showEditChoiceModal();
        } else {
            this.startEditModal('ansage');
        }
    }

    handleModalCancel() {
        this.model.clearAutoFillTracker();
        this.view.hideInputModal();
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

    handleMagicFill() {
        this.model.applyMagicFill();
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
    }

    handleModalSave() {
        const { rIndex, phase } = this.model.currentContext;
        if (phase === 'stiche') {
            const validation = this.model.validateTricksSum(rIndex);
            if (!validation.valid) return this.view.showValidationAlert(validation.message);
        }

        const wasRound1Completed = this.model.state.currentRoundIndex > 0 || this.model.state.isGameOver;
        const oldLeaders = wasRound1Completed ? this._getLeadingPlayersString() : '';

        this._closeModalAndResetState();
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
        } else {
            const gameJustEnded = this._advanceGameState();
            if (gameJustEnded) {
                this._checkAudioTriggers(wasRound1Completed, oldLeaders, phase, false, rIndex);
                this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
                return this.view.showGameOver(this.model.getLeaderboard());
            }
        }
        
        this._checkAudioTriggers(wasRound1Completed, oldLeaders, phase, this.model.state.isEditMode, rIndex);
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }

    _closeModalAndResetState() {
        this.model.clearAutoFillTracker();
        this.view.hideInputModal();
    }

    _advanceGameState() {
        if (this.model.state.phase === 'ansage') {
            this.model.state.phase = 'stiche';
            this.model.saveState();
            return false;
        }

        if (this.model.state.currentRoundIndex === CONFIG.TOTAL_ROUNDS - 2) {
            this.view.startPenultimateRoundBlinking();
        }
        
        this.model.recalculateAllScores();
        
        if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS - 1) {
            this.model.state.isGameOver = true;
            this.model.saveState();
            return true; // Returns true if the game is over
        }
        
        this.model.state.phase = 'ansage';
        this.model.state.currentRoundIndex++;
        this.model.saveState();
        return false;
    }

    _getLeadingPlayersString() {
        const leaderboard = this.model.getLeaderboard();
        if (leaderboard.length === 0) return '';
        const maxScore = leaderboard[0].score;
        return leaderboard.filter(p => p.score === maxScore).map(p => p.name).sort().join(',');
    }

    _checkAudioTriggers(wasRound1Completed, oldLeaders, phase, isEditMode, rIndex) {
        if (!isEditMode && phase === 'ansage') return;
        
        let shouldPlaySound = false;

        if (wasRound1Completed && oldLeaders) {
            const newLeaders = this._getLeadingPlayersString();
            if (newLeaders && oldLeaders !== newLeaders) {
                shouldPlaySound = true;
            }
        }

        if (phase === 'stiche') {
            const everyoneFailed = this.model.state.activePlayers.every(p => this.model.state.roundsData[rIndex][p].punkte < 0);
            if (everyoneFailed) shouldPlaySound = true;
        }

        if (shouldPlaySound) {
            const audio = new Audio('./assets/Fah.mp3');
            audio.play().catch(e => console.warn('Audio play failed:', e));
        }
    }

    handleEditChoiceClose() { 
        this.view.hideEditChoiceModal();
    }

    handleEditChoiceSelect(phase) {
        this.view.hideEditChoiceModal();
        this.startEditModal(phase);
    }

    startEditModal(phase) {
        this.model.state.isEditMode = true;
        this.model.state.editPhase = phase;
        this.model.state.currentPlayerInputIndex = 0;
        this.view.renderModalContent(this.model.state, this.model.isPhaseReadyForSave());
        this.view.showInputModal();
    }
}