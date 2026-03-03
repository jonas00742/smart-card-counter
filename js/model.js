import { CONFIG } from './config.js';

export class GameModel {
    constructor() {
        this.state = {
            availablePlayers: ["Alex", "Bela", "Charlie", "Doro"],
            activePlayers: [],
            currentRoundIndex: 0,
            phase: 'ansage', 
            roundsData: [],
            
            globalEditMode: false,
            isEditMode: false,
            editRoundIndex: 0,
            editPhase: 'ansage',
            currentPlayerInputIndex: 0
        };
    }

    initGameData() {
        this.state.currentRoundIndex = 0;
        this.state.phase = 'ansage';
        this.state.roundsData = [];
        this.state.globalEditMode = false;
        
        for (let i = 0; i < CONFIG.TOTAL_ROUNDS; i++) {
            let roundObj = {};
            this.state.activePlayers.forEach(player => {
                roundObj[player] = { ansage: null, gemacht: null, punkte: 0, gesamtPunkte: 0 };
            });
            this.state.roundsData.push(roundObj);
        }
    }

    addPlayer(name) {
        if (name && !this.state.availablePlayers.includes(name)) {
            this.state.availablePlayers.push(name);
            this.state.activePlayers.push(name);
        }
    }

    removePlayer(player) {
        this.state.availablePlayers = this.state.availablePlayers.filter(p => p !== player);
        this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
    }

    togglePlayerActive(player) {
        if (this.state.activePlayers.includes(player)) {
            this.state.activePlayers = this.state.activePlayers.filter(p => p !== player);
        } else {
            this.state.activePlayers.push(player);
        }
    }

    movePlayer(index, direction) {
        if (direction === 'up' && index > 0) {
            const temp = this.state.activePlayers[index - 1];
            this.state.activePlayers[index - 1] = this.state.activePlayers[index];
            this.state.activePlayers[index] = temp;
        } else if (direction === 'down' && index < this.state.activePlayers.length - 1) {
            const temp = this.state.activePlayers[index + 1];
            this.state.activePlayers[index + 1] = this.state.activePlayers[index];
            this.state.activePlayers[index] = temp;
        }
    }

    setPlayerOrder(newOrder) {
        this.state.activePlayers = newOrder;
    }

    setInputValue(value) {
        const player = this.state.activePlayers[this.state.currentPlayerInputIndex];
        const rIndex = this.state.isEditMode ? this.state.editRoundIndex : this.state.currentRoundIndex;
        const phase = this.state.isEditMode ? this.state.editPhase : this.state.phase;
        
        if (phase === 'ansage') {
            this.state.roundsData[rIndex][player].ansage = value;
        } else {
            this.state.roundsData[rIndex][player].gemacht = value;
        }
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
                } else {
                    pData.punkte = 0;
                }
                const prevTotal = r === 0 ? 0 : this.state.roundsData[r - 1][player].gesamtPunkte;
                pData.gesamtPunkte = prevTotal + pData.punkte;
            });
        }
    }
}