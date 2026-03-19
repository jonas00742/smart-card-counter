import { CONFIG } from '../config.js';

export class ScoreEngine {
    static recalculateAllScores(state) {
        for (let r = 0; r <= state.currentRoundIndex; r++) {
            const roundData = state.roundsData[r];
            state.activePlayers.forEach(player => {
                const pData = roundData[player];
                if (pData.gemacht !== null && pData.ansage !== null) {
                    pData.punkte = pData.ansage === pData.gemacht
                        ? CONFIG.POINTS_BASE + pData.gemacht 
                        : -Math.abs(pData.ansage - pData.gemacht);
                } else pData.punkte = 0;
                
                const prevTotal = r === 0 ? 0 : state.roundsData[r - 1][player].gesamtPunkte;
                pData.gesamtPunkte = prevTotal + pData.punkte;
            });
        }
    }

    static validateSticheSum(state, roundIndex) {
        const cards = CONFIG.CARDS_SEQUENCE[roundIndex];
        const sumGemacht = state.activePlayers.reduce((sum, p) => {
            return sum + (state.roundsData[roundIndex][p].gemacht || 0);
        }, 0);

        return sumGemacht === cards 
            ? { valid: true } 
            : { valid: false, message: `Logik-Fehler:\nEs wurden ${cards} Karten ausgeteilt, aber ${sumGemacht} Stiche eingetragen.` };
    }
}