import { CONFIG } from './config.js';

export class GameModel {
    constructor() {
        this.STORAGE_KEY = 'smartCounterState';
        this.loadState();
        this.autoFilledPlayers = [];
    }

    get defaultState() {
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
                this.state = this.defaultState;
            }
        } else {
            this.state = this.defaultState;
        }
    }

    saveState() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
    }

    initGameData() {
        // Preserve available players, reset game specific data
        const { availablePlayers, activePlayers, startingDealerIndex } = this.state;
        this.state = {
            ...this.defaultState,
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
        return {
            rIndex: this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex,
            phase: this.state.isEditMode ? this.state.editPhase : this.state.phase
        };
    }
    
    setInputValue(value) {
        const player = this.state.activePlayers[this.state.currentPlayerInputIndex];
        const { rIndex, phase } = this.currentContext;
        this.state.roundsData[rIndex][player][phase === 'ansage' ? 'ansage' : 'gemacht'] = value;

        // If a user manually sets a value, they are no longer considered auto-filled
        const autoFillIndex = this.autoFilledPlayers.indexOf(player);
        if (autoFillIndex > -1) {
            this.autoFilledPlayers.splice(autoFillIndex, 1);
        }

        this.saveState();
    }

    resetCurrentPhaseInputs() {
        const { rIndex, phase } = this.currentContext;
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';
        this.state.activePlayers.forEach(player => {
            this.state.roundsData[rIndex][player][key] = null;
        });
        this.clearAutoFillTracker();
        this.saveState();
    }

    isCurrentPhaseComplete() {
        const { rIndex, phase } = this.currentContext;
        return this.state.activePlayers.every(player => {
            const key = phase === 'ansage' ? 'ansage' : 'gemacht';
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
        this.autoFilledPlayers = [];
    }

    resetAutoFilledValues() {
        if (this.autoFilledPlayers.length === 0) return;

        const roundData = this.state.roundsData[this.currentContext.rIndex];

        this.autoFilledPlayers.forEach(player => {
            roundData[player].gemacht = null;
        });

        this.clearAutoFillTracker(); // Clear the tracking array after use
        this.saveState();
    }

    applyAutoFill() {
        const { rIndex, phase } = this.currentContext;
        
        // Auto-fill only applies to 'stiche' phase (actual tricks made)
        if (phase !== 'stiche') return;

        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const roundData = this.state.roundsData[rIndex];
        
        let sumGemacht = 0;
        const missingPlayers = [];
        
        this.state.activePlayers.forEach(p => {
            const val = roundData[p].gemacht;
            if (val !== null) sumGemacht += val;
            else missingPlayers.push(p);
        });

        // Case 2: All cards distributed -> remaining players get 0
        if (sumGemacht >= cards && missingPlayers.length > 0) {
            missingPlayers.forEach(p => { 
                roundData[p].gemacht = 0; 
                if (!this.autoFilledPlayers.includes(p)) {
                    this.autoFilledPlayers.push(p);
                }
            });
            this.saveState();
        } 
        // Case 1: Only one player left -> gets the remainder
        else if (missingPlayers.length === 1) {
            const remainder = Math.max(0, cards - sumGemacht);
            const playerToFill = missingPlayers[0];
            roundData[playerToFill].gemacht = remainder;
            if (!this.autoFilledPlayers.includes(playerToFill)) {
                this.autoFilledPlayers.push(playerToFill);
            }
            this.saveState();
        }
    }

    recalculateAllScores() {
        for (let r = 0; r <= this.state.currentRoundIndex; r++) {
            const roundData = this.state.roundsData[r];
            this.state.activePlayers.forEach(player => {
                const pData = roundData[player];
                if (pData.gemacht !== null && pData.ansage !== null) {
                    pData.punkte = pData.ansage === pData.gemacht
                        ? CONFIG.POINTS_BASE + pData.gemacht 
                        : -Math.abs(pData.ansage - pData.gemacht);
                } else pData.punkte = 0;
                const prevTotal = r === 0 ? 0 : this.state.roundsData[r - 1][player].gesamtPunkte;
                pData.gesamtPunkte = prevTotal + pData.punkte;
            });
        }
        this.saveState();
    }

    validateSticheSum(roundIndex) {
        const cards = CONFIG.CARDS_SEQUENCE[roundIndex];
        const sumGemacht = this.state.activePlayers.reduce((sum, p) => {
            return sum + (this.state.roundsData[roundIndex][p].gemacht || 0);
        }, 0);

        return sumGemacht === cards 
            ? { valid: true } 
            : { valid: false, message: `Logik-Fehler:\nEs wurden ${cards} Karten ausgeteilt, aber ${sumGemacht} Stiche eingetragen.` };
    }
}