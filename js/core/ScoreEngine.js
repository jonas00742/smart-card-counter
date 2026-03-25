import { CONFIG } from '../config.js';

export class ScoreEngine {
    static recalculateAllScores(state) {
        for (let roundIdx = 0; roundIdx <= state.currentRoundIndex; roundIdx++) {
            const roundData = state.roundsData[roundIdx];
            state.activePlayers.forEach(player => {
                const playerData = roundData[player];
                
                // Calculate base points for the current round
                if (playerData.gemacht !== null && playerData.ansage !== null) {
                    const bid = playerData.ansage;
                    const tricksWon = playerData.gemacht;
                    
                    playerData.punkte = (bid === tricksWon)
                        ? CONFIG.POINTS_BASE + tricksWon 
                        : -Math.abs(bid - tricksWon);
                } else {
                    playerData.punkte = 0;
                }
                
                // Accumulate total points globally
                const previousTotal = roundIdx === 0 ? 0 : state.roundsData[roundIdx - 1][player].gesamtPunkte;
                playerData.gesamtPunkte = previousTotal + playerData.punkte;
            });
        }
    }

    static validateTricksSum(state, roundIndex) {
        const totalCards = CONFIG.CARDS_SEQUENCE[roundIndex];
        const totalTricksWon = state.activePlayers.reduce((sum, player) => {
            return sum + (state.roundsData[roundIndex][player].gemacht || 0);
        }, 0);

        return totalTricksWon === totalCards 
            ? { valid: true } 
            : { valid: false, message: `Logik-Fehler:\nEs wurden ${totalCards} Karten ausgeteilt, aber ${totalTricksWon} Stiche eingetragen.` };
    }
}