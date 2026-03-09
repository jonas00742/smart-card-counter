import { CONFIG } from './config.js';

export class GameModel {
    constructor() {
        this.storageKey = 'smartCounterState';
        this.loadState();
    }

    initDefaultState() {
        this.state = {
            availablePlayers: ["Alex", "Bela", "Charlie", "Doro"],
            activePlayers: [],
            currentRoundIndex: 0,
            startingDealerIndex: 0,
            phase: 'ansage', 
            roundsData: [],
            isGameOver: false, // --- NEU ---
            
            globalEditMode: false,
            isEditMode: false,
            editRoundIndex: 0,
            editPhase: 'ansage',
            currentPlayerInputIndex: 0
        };
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.state = JSON.parse(saved);
                this.state.globalEditMode = false;
                this.state.isEditMode = false;
                if (this.state.startingDealerIndex === undefined) this.state.startingDealerIndex = 0;
                if (this.state.isGameOver === undefined) this.state.isGameOver = false; // --- NEU ---
            } catch (e) {
                this.initDefaultState();
            }
        } else {
            this.initDefaultState();
        }
    }

    saveState() { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }

    initGameData() {
        this.state.currentRoundIndex = 0;
        this.state.phase = 'ansage';
        this.state.roundsData = [];
        this.state.globalEditMode = false;
        this.state.isGameOver = false; // --- NEU ---
        
        for (let i = 0; i < CONFIG.TOTAL_ROUNDS; i++) {
            let roundObj = {};
            this.state.activePlayers.forEach(player => {
                roundObj[player] = { ansage: null, gemacht: null, punkte: 0, gesamtPunkte: 0 };
            });
            this.state.roundsData.push(roundObj);
        }
        this.saveState();
    }

    quitGame() {
        this.state.roundsData = []; 
        this.state.isGameOver = false;
        this.saveState();
    }

    // --- NEU: Sortiertes Leaderboard abrufen ---
    getLeaderboard() {
        if (!this.state.roundsData || this.state.roundsData.length === 0) return [];
        const rIndex = this.state.currentRoundIndex;
        
        const scores = this.state.activePlayers.map(player => ({
            name: player,
            score: this.state.roundsData[rIndex][player].gesamtPunkte
        }));
        
        // Sortiert nach Punkten absteigend
        return scores.sort((a, b) => b.score - a.score);
    }

    setStartingDealer(index) { this.state.startingDealerIndex = index; this.saveState(); }
    _checkDealerBounds() {
        if (this.state.activePlayers.length === 0) this.state.startingDealerIndex = 0;
        else if (this.state.startingDealerIndex >= this.state.activePlayers.length) this.state.startingDealerIndex = this.state.activePlayers.length - 1;
    }
    addPlayer(name) {
        if (name && !this.state.availablePlayers.includes(name)) {
            this.state.availablePlayers.push(name); this.state.activePlayers.push(name); this.saveState();
        }
    }
    removePlayer(player) {
        this.state.availablePlayers = this.state.availablePlayers.filter(p => p !== player);
        this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
        this._checkDealerBounds(); this.saveState();
    }
    togglePlayerActive(player) {
        if (this.state.activePlayers.includes(player)) this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
        else this.state.activePlayers.push(player);
        this._checkDealerBounds(); this.saveState();
    }
    movePlayer(index, direction) {
        if (direction === 'up' && index > 0) {
            const temp = this.state.activePlayers[index - 1];
            this.state.activePlayers[index - 1] = this.state.activePlayers[index];
            this.state.activePlayers[index] = temp; this.saveState();
        } else if (direction === 'down' && index < this.state.activePlayers.length - 1) {
            const temp = this.state.activePlayers[index + 1];
            this.state.activePlayers[index + 1] = this.state.activePlayers[index];
            this.state.activePlayers[index] = temp; this.saveState();
        }
    }
    setPlayerOrder(newOrder) { this.state.activePlayers = newOrder; this.saveState(); }
    
    setInputValue(value) {
        const player = this.state.activePlayers[this.state.currentPlayerInputIndex];
        const rIndex = this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex;
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        
        if (phase === 'ansage') this.state.roundsData[rIndex][player].ansage = value;
        else this.state.roundsData[rIndex][player].gemacht = value;
        this.saveState();
    }
    isCurrentPhaseComplete() {
        const rIndex = this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex;
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        return this.state.activePlayers.every(player => {
            const val = phase === 'ansage' ? this.state.roundsData[rIndex][player].ansage : this.state.roundsData[rIndex][player].gemacht;
            return val !== null;
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
}