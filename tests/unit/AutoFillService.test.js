import { AutoFillService } from '../../js/core/AutoFillService.js';
import { CONFIG } from '../../js/config.js';

describe('AutoFillService', () => {
    test('B-U4: sole remaining player is auto-filled with the exact number of tricks still available', () => {
        const service = new AutoFillService();
        const state = {
            activePlayers: ['Alice', 'Bob', 'Carol'],
            roundsData: Array.from({ length: CONFIG.TOTAL_ROUNDS }, () => ({
                Alice: { gemacht: null },
                Bob:   { gemacht: null },
                Carol: { gemacht: null },
            })),
        };
        // Round index 4 → CARDS_SEQUENCE[4] = 5 cards; Alice and Bob already took 3 tricks total
        state.roundsData[4].Alice.gemacht = 2;
        state.roundsData[4].Bob.gemacht   = 1;
        // Carol.gemacht is null — the one player needing auto-fill

        const changed = service.applyAutoFill(state, { rIndex: 4, phase: 'stiche' });

        // 5 cards − 3 already won = 2 remaining for Carol
        expect(changed).toBe(true);
        expect(state.roundsData[4].Carol.gemacht).toBe(2);
        expect(service.autoFilledPlayers).toContain('Carol');
    });
});
