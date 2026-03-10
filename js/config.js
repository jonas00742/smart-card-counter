export const CONFIG = (() => {
    const CARDS_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];

    return Object.freeze({
        CARDS_SEQUENCE,
        TOTAL_ROUNDS: CARDS_SEQUENCE.length,
        POINTS_BASE: 5
    });
})();