import { CONFIG } from '../config.js';
import { EVENTS }from '../core/events.js';

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
        this.eventBus.on(EVENTS.MODAL_MAGIC_FILL, this.handleMagicFill.bind(this));

        this.eventBus.on(EVENTS.GAME_OVER_CLOSE, () => this.view.hideGameOverModal());
        this.eventBus.on(EVENTS.EDIT_CHOICE_CLOSE, this.handleEditChoiceClose.bind(this));
        this.eventBus.on(EVENTS.EDIT_CHOICE_SELECT, this.handleEditChoiceSelect.bind(this));
        
        this.eventBus.on(EVENTS.TOGGLE_INTERIM, this.handleToggleInterim.bind(this));
        this.eventBus.on(EVENTS.GAME_TOGGLE_BIDS, this.handleToggleBids.bind(this));
        this.eventBus.on(EVENTS.MODAL_BIDS_CLOSE, () => this.view.toggleFab(true));
    }

    handleOpenInputModal() {
        this.model.clearAutoFillTracker();
        this.model.state.isEditMode = false;
        const { currentRoundIndex, activePlayers, roundsData, phase } = this.model.state;
        
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';
        const firstEmptyIdx = activePlayers.findIndex(p => roundsData[currentRoundIndex][p][key] === null);
        this.model.state.currentPlayerInputIndex = firstEmptyIdx > -1 ? firstEmptyIdx : 0;
        
        this._updateModal();
        this.view.showInputModal();
    }

    handleTriggerRowEdit(rIndex) {
        this.model.state.editRoundIndex = rIndex;
        const { currentRoundIndex, phase, isGameOver } = this.model.state;
        const isPastRound = rIndex < currentRoundIndex || isGameOver;
        const isCurrentRoundTricksPhase = rIndex === currentRoundIndex && phase === 'stiche';

        if (isPastRound || isCurrentRoundTricksPhase) {
            this.view.showEditChoiceModal();
        } else {
            this.startEditModal('ansage');
        }
    }

    handleModalCancel() {
        this.model.clearAutoFillTracker();
        this.view.hideInputModal();
        this._updateGameTableView();
    }

    handleModalPrev() {
        if (this.model.state.currentPlayerInputIndex > 0) {
            this.model.state.currentPlayerInputIndex--;
            this._updateModal();
        }
    }

    handleModalNext() {
        if (this.model.state.currentPlayerInputIndex < this.model.state.activePlayers.length - 1) {
            this.model.state.currentPlayerInputIndex++;
            this._updateModal();
        }
    }

    handleNumberInput(val) {
        const { rIndex, phase } = this.model.currentContext;
        if (rIndex === CONFIG.TOTAL_ROUNDS - 1 && phase === 'ansage') {
            this.view.stopPenultimateRoundBlinking();
        }
        if (this.model.isPhaseReadyForSave()) {
            this.model.resetAutoFilledValues();
        }

        this.model.setInputValue(val);
        this.model.applyAutoFill();
        this._updateModal();
    }

    handleModalReset() {
        this.model.resetCurrentPhaseInputs();
        this.model.state.currentPlayerInputIndex = 0;
        this._updateModal();
    }

    handleMagicFill() {
        this.model.applyMagicFill();
        this._updateModal();
    }

    handleModalSave() {
        const { rIndex, phase } = this.model.currentContext;

        if (phase === 'stiche') {
            const validation = this.model.validateTricksSum(rIndex);
            if (!validation.valid) {
                return this.view.showValidationAlert(validation.message);
            }
        }
        
        const oldLeaders = this._getLeadingPlayers();

        this.view.hideInputModal();
        this.model.clearAutoFillTracker();
        
        if (this.model.state.isEditMode) {
            this.model.recalculateAllScores();
        } else {
            const gameJustEnded = this._advanceGameState();
            if (gameJustEnded) {
                this._checkAudioTriggers(oldLeaders, phase, rIndex);
                this._updateGameTableView();
                return this.view.showGameOver(this.model.getLeaderboard());
            }
        }
        
        this._checkAudioTriggers(oldLeaders, phase, rIndex);
        this._updateGameTableView();
    }

    _advanceGameState() {
        if (this.model.state.phase === 'ansage') {
            this.model.state.phase = 'stiche';
        } else {
            this.model.recalculateAllScores();
            if (this.model.state.currentRoundIndex >= CONFIG.TOTAL_ROUNDS - 1) {
                this.model.state.isGameOver = true;
            } else {
                this.model.state.phase = 'ansage';
                this.model.state.currentRoundIndex++;

                if (this.model.state.currentRoundIndex === CONFIG.TOTAL_ROUNDS - 1) {
                    this.view.startPenultimateRoundBlinking();
                }
            }
        }
        this.model.saveState();
        return this.model.state.isGameOver;
    }
    
    _getGameTableProps() {
        return {
            state: this.model.state,
            leaderboard: this.model.getLeaderboard()
        }
    }

    _updateGameTableView() {
        const props = this._getGameTableProps();
        this.view.renderGameTable(props);
    }
    
    _updateModal() {
        const state = this.model.state;
        const rIndex = state.isEditMode ? state.editRoundIndex : state.currentRoundIndex;
        const phase = state.isEditMode ? state.editPhase : state.phase;
        const player = state.activePlayers[state.currentPlayerInputIndex];
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';

        let maxButtons = cards;
        if (phase === 'stiche') {
            const sumOtherWon = state.activePlayers.reduce((sum, p) => {
                return p !== player ? sum + (state.roundsData[rIndex][p].gemacht || 0) : sum;
            }, 0);
            maxButtons = Math.max(0, cards - sumOtherWon);
        }

        let isMagicPossible = false;
        if (phase === 'stiche') {
            let totalBids = 0;
            let allFilled = true;
            let magicStillPossible = true;
            state.activePlayers.forEach(p => {
                const roundData = state.roundsData[rIndex][p];
                if (roundData.ansage !== null) totalBids += roundData.ansage;
                if (roundData.gemacht === null) {
                    allFilled = false;
                } else {
                    if (roundData.gemacht !== roundData.ansage) {
                        magicStillPossible = false;
                    }
                }
            });
            isMagicPossible = totalBids === cards && !allFilled && magicStillPossible;
        }

        const props = {
            player,
            phase,
            cards,
            currentValue: state.roundsData[rIndex][player][key],
            targetBidValue: state.roundsData[rIndex][player].ansage,
            isEditMode: state.isEditMode,
            indicators: state.activePlayers.map((p, idx) => ({
                isFilled: state.roundsData[rIndex][p][key] !== null,
                isActive: idx === state.currentPlayerInputIndex
            })),
            isMagicPossible,
            isComplete: this.model.isPhaseReadyForSave(),
            showPrev: state.currentPlayerInputIndex > 0,
            showNext: state.currentPlayerInputIndex < state.activePlayers.length - 1,
            hasAnyInput: state.activePlayers.some(p => state.roundsData[rIndex][p].gemacht !== null),
            maxButtons
        };
        this.view.renderModalContent(props);
    }

    _getLeadingPlayers() {
        const leaderboard = this.model.getLeaderboard();
        if (leaderboard.length === 0 || leaderboard[0].score === undefined) return new Set();
        
        const maxScore = leaderboard[0].score;
        return new Set(leaderboard.filter(p => p.score === maxScore).map(p => p.name));
    }
    
    _checkAudioTriggers(oldLeaders, phaseJustCompleted, rIndexJustCompleted) {
        const { state } = this.model;
        const phase = phaseJustCompleted || this.model.currentContext.phase;
        const rIndex = rIndexJustCompleted !== undefined ? rIndexJustCompleted : this.model.currentContext.rIndex;
        
        if (phase === 'ansage' && !state.isEditMode) return;
    
        const newLeaders = this._getLeadingPlayers();
        const leadershipChanged = rIndex > 0 && oldLeaders.size > 0 && newLeaders.size > 0 && ![...oldLeaders].every(l => newLeaders.has(l));
    
        const everyoneFailed = phase === 'stiche' &&
            state.activePlayers.every(p => state.roundsData[rIndex][p].punkte < 0);
    
        if (leadershipChanged || everyoneFailed) {
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
        this._updateModal();
        this.view.showInputModal();
    }
    
    handleToggleInterim() {
        if (this.model.state.isGameOver) {
            this.view.showGameOver(this.model.getLeaderboard());
        } else {
            this.view.showInterimModal(this.model.getLeaderboard());
        }
    }

    handleToggleBids() {
        if (!this.model.state.isGameOver && this.model.state.phase === 'stiche') {
            const { currentRoundIndex, activePlayers, roundsData } = this.model.state;
            const props = { currentRoundIndex, activePlayers, roundsData };
            this.view.table.showBidsModal(props);
            this.view.toggleFab(false);
        }
    }
}