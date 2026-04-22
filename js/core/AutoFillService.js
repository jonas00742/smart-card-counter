import { CONFIG } from '../config.js';

export class AutoFillService {
    constructor() {
        this.autoFilledPlayers = [];
    }

    clearTracker() { this.autoFilledPlayers = []; }
    removePlayer(player) { this.autoFilledPlayers = this.autoFilledPlayers.filter(p => p !== player); }

    resetAutoFilledValues(state, rIndex) {
        if (this.autoFilledPlayers.length === 0) return false;

        const roundData = state.roundsData[rIndex];
        this.autoFilledPlayers.forEach(player => { roundData[player].gemacht = null; });
        this.clearTracker();
        
        return true; // Indicates the state has changed
    }

    applyAutoFill(state, currentContext) {
        const { rIndex, phase } = currentContext;
        if (phase !== 'stiche') return false;

        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const roundData = state.roundsData[rIndex];
        
        let tricksAlreadyWon = 0;
        const playersNeedingInput = [];
        
        state.activePlayers.forEach(p => {
            const val = roundData[p].gemacht;
            if (val !== null) tricksAlreadyWon += val;
            else playersNeedingInput.push(p);
        });

        if (playersNeedingInput.length > 0) {
            let fillValue = null;
            if (tricksAlreadyWon >= cards) fillValue = 0;
            else if (playersNeedingInput.length === 1) fillValue = Math.max(0, cards - tricksAlreadyWon);

            if (fillValue !== null) {
                playersNeedingInput.forEach(p => {
                    roundData[p].gemacht = fillValue;
                    if (!this.autoFilledPlayers.includes(p)) this.autoFilledPlayers.push(p);
                });
                return true; // Indicates the state has changed
            }
        }
        return false;
    }
}