import { CONFIG } from './config.js';

export class GameModel {
    constructor() {
        this.STORAGE_KEY = 'smartCounterState';
        this.loadState();
    }

    get defaultState() {
        return {
            availablePlayers: ["Alex", "Bela", "Charlie", "Doro"],
            activePlayers: [],
            currentRoundIndex: 0,
            startingDealerIndex: 0,
            phase: 'ansage',
            roundsData: [],
            isGameOver: false,
            globalEditMode: false,
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
                this.state.globalEditMode = false;
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
        
        const currentData = this.state.roundsData[this.state.currentRoundIndex];
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

    movePlayer(index, direction) {
        const players = this.state.activePlayers;
        if (direction === 'up' && index > 0) {
            [players[index], players[index - 1]] = [players[index - 1], players[index]];
            this.saveState();
        } else if (direction === 'down' && index < players.length - 1) {
            [players[index], players[index + 1]] = [players[index + 1], players[index]];
            this.saveState();
        }
    }

    setPlayerOrder(newOrder) {
        this.state.activePlayers = newOrder;
        this.saveState();
    }
    
    setInputValue(value) {
        const player = this.state.activePlayers[this.state.currentPlayerInputIndex];
        const rIndex = this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex;
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        
        this.state.roundsData[rIndex][player][phase === 'ansage' ? 'ansage' : 'gemacht'] = value;
        this.saveState();
    }

    isCurrentPhaseComplete() {
        const rIndex = this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex;
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        
        return this.state.activePlayers.every(player => {
            const key = phase === 'ansage' ? 'ansage' : 'gemacht';
            return this.state.roundsData[rIndex][player][key] !== null;
        });
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