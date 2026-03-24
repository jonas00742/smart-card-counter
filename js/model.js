import { CONFIG } from './config.js';
import { ScoreEngine } from './core/ScoreEngine.js';
import { AutoFillService } from './core/AutoFillService.js';

export class GameModel {
    STORAGE_KEY = 'smartCounterState';
    autoFillService;
    state;

    constructor() {
        this.autoFillService = new AutoFillService();
        this.loadState();
    }

    getDefaultState() {
        return {
            availablePlayers: ["Jonas", "Karim", "Nina", "Patrick", "Laura"],
            activePlayers: [],
            currentRoundIndex: 0,
            startingDealerIndex: 0,
            phase: 'ansage',
            roundsData: [],
            isGameOver: false,
            isEditMode: false,
            editRoundIndex: 0,
            editPhase: 'ansage',
            currentPlayerInputIndex: 0
        };
    }

    loadState() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.state = JSON.parse(saved);
                // Reset transient flags
                this.state.isEditMode = false;
                
                // Backwards compatibility checks
                this.state.startingDealerIndex = this.state.startingDealerIndex ?? 0;
                this.state.isGameOver = this.state.isGameOver ?? false;
            } catch (e) {
                console.error("Failed to load state, resetting.", e);
                this.state = this.getDefaultState();
            }
        } else {
            this.state = this.getDefaultState();
        }
    }

    saveState() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    initGameData() {
        // Preserve available players, reset game specific data
        const { availablePlayers, activePlayers, startingDealerIndex } = this.state;
        this.state = {
            ...this.getDefaultState(),
            availablePlayers,
            activePlayers,
            startingDealerIndex,
            roundsData: Array.from({ length: CONFIG.TOTAL_ROUNDS }, () => {
                const roundObj = {};
                activePlayers.forEach(p => {
                    roundObj[p] = { ansage: null, gemacht: null, punkte: 0, gesamtPunkte: 0 };
                });
                return roundObj;
            })
        };
        this.saveState();
    }

    quitGame() {
        this.state.roundsData = [];
        this.state.isGameOver = false;
        this.saveState();
    }

    getLeaderboard() {
        if (!this.state.roundsData || this.state.roundsData.length === 0) return [];
        
        let targetIndex = this.state.currentRoundIndex - 1;
        if (this.state.isGameOver) targetIndex = this.state.currentRoundIndex;

        if (targetIndex < 0) return this.state.activePlayers.map(p => ({ name: p, score: 0 }));

        const currentData = this.state.roundsData[targetIndex];
        return this.state.activePlayers.map(player => ({
            name: player,
            score: currentData[player].gesamtPunkte
        })).sort((a, b) => b.score - a.score);
    }

    setStartingDealer(index) {
        this.state.startingDealerIndex = index;
        this.saveState();
    }

    _checkDealerBounds() {
        const maxIndex = Math.max(0, this.state.activePlayers.length - 1);
        if (this.state.startingDealerIndex > maxIndex) {
            this.state.startingDealerIndex = maxIndex;
        }
    }

    addPlayer(name) {
        if (name && !this.state.availablePlayers.includes(name)) {
            this.state.availablePlayers.push(name);
            this.state.activePlayers.push(name);
            this.saveState();
        }
    }

    removePlayer(player) {
        this.state.availablePlayers = this.state.availablePlayers.filter(p => p !== player);
        this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
        this._checkDealerBounds();
        this.saveState();
    }

    togglePlayerActive(player) {
        if (this.state.activePlayers.includes(player)) {
            this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
        } else {
            this.state.activePlayers.push(player);
        }
        this._checkDealerBounds();
        this.saveState();
    }

    setPlayerOrder(newOrder) {
        const currentDealer = this.state.activePlayers[this.state.startingDealerIndex];
        this.state.activePlayers = newOrder;
        const newIndex = this.state.activePlayers.indexOf(currentDealer);
        if (newIndex !== -1) this.state.startingDealerIndex = newIndex;
        this.saveState();
    }

    get currentContext() {
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        return {
            rIndex: this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex,
            phase,
            key: phase === 'ansage' ? 'ansage' : 'gemacht'
        };
    }
    
    setInputValue(value) {
        const player = this.state.activePlayers[this.state.currentPlayerInputIndex];
        const { rIndex, key } = this.currentContext;
        this.state.roundsData[rIndex][player][key] = value;

        // If a user manually sets a value, they are no longer considered auto-filled
        this.autoFillService.removePlayer(player);

        this.saveState();
    }

    resetCurrentPhaseInputs() {
        const { rIndex, key } = this.currentContext;
        this.state.activePlayers.forEach(player => {
            this.state.roundsData[rIndex][player][key] = null;
        });
        this.clearAutoFillTracker();
        this.saveState();
    }

    isCurrentPhaseComplete() {
        const { rIndex, key } = this.currentContext;
        return this.state.activePlayers.every(player => {
            return this.state.roundsData[rIndex][player][key] !== null;
        });
    }

    isPhaseReadyForSave() {
        const { rIndex, phase } = this.currentContext;

        // 1. Are all inputs filled for the current phase?
        if (!this.isCurrentPhaseComplete()) {
            return false;
        }

        // 2. If it's the 'stiche' phase, we have an additional validation.
        if (phase === 'stiche') {
            const validation = this.validateSticheSum(rIndex);
            return validation.valid;
        }

        // 3. For 'ansage' phase, just being complete is enough.
        return true;
    }

    clearAutoFillTracker() {
        this.autoFillService.clearTracker();
    }

    resetAutoFilledValues() {
        if (this.autoFillService.resetAutoFilledValues(this.state, this.currentContext.rIndex)) {
            this.saveState();
        }
    }

    applyAutoFill() {
        if (this.autoFillService.applyAutoFill(this.state, this.currentContext)) {
            this.saveState();
        }
    }

    applyMagicFill() {
        const { rIndex, phase } = this.currentContext;
        if (phase !== 'stiche') return;

        this.state.activePlayers.forEach(player => {
            const roundData = this.state.roundsData[rIndex][player];
            if (roundData.gemacht === null) {
                roundData.gemacht = roundData.ansage;
                if (!this.autoFillService.autoFilledPlayers.includes(player)) {
                    this.autoFillService.autoFilledPlayers.push(player);
                }
            }
        });
        
        this.saveState();
    }

    recalculateAllScores() {
        ScoreEngine.recalculateAllScores(this.state);
        this.saveState();
    }

    validateSticheSum(roundIndex) {
        return ScoreEngine.validateSticheSum(this.state, roundIndex);
    }
}