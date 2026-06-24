import { test, expect } from '@playwright/test';

// Must match CONFIG.CARDS_SEQUENCE exactly.
const CARDS_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
const PLAYERS = ['Anna', 'Bob', 'Carol'];

// Clicks the number button with exactly the given value in the input modal grid.
async function clickNumber(page, value) {
    await page.locator('#dynamic-button-grid button')
        .filter({ hasText: new RegExp(`^${value}$`) })
        .click();
}

// Enters bids (all 0) for every player and saves.
async function enterBids(page) {
    await page.click('#open-input-modal-btn');
    await expect(page.locator('#input-modal')).not.toHaveClass(/hidden/);

    for (let p = 0; p < PLAYERS.length; p++) {
        await clickNumber(page, 0);
        if (p < PLAYERS.length - 1) {
            await page.click('#modal-next-btn');
        }
    }
    await page.click('#save-input-btn');
}

// Enters tricks for a round where Player 1 takes all cards (others auto-filled to 0).
// After clicking `cards` for Player 1, AutoFillService fills all remaining players
// with 0 (tricksAlreadyWon >= cards), so the Save button becomes enabled immediately.
async function enterTricks(page, cards) {
    await page.click('#open-input-modal-btn');
    await expect(page.locator('#input-modal')).not.toHaveClass(/hidden/);

    await clickNumber(page, cards);
    await expect(page.locator('#save-input-btn')).toBeEnabled();
    await page.click('#save-input-btn');
}

test('A-E1: complete 13-round game from setup to game-over podium', async ({ page }) => {
    await page.goto('/');

    // --- Setup: add 3 players via Enter key and start the game ---
    for (const name of PLAYERS) {
        await page.fill('#new-player-name', name);
        await page.press('#new-player-name', 'Enter');
        // Wait for the player's chip to appear in the pool before proceeding.
        // This explicit gate ensures the DOM has re-rendered after each addition,
        // making the loop robust even when the SW is caching assets concurrently.
        await expect(page.locator('#available-players-container')).toContainText(name);
    }
    // Verify all 3 are active before starting — guards against setup regressions.
    await expect(page.locator('#active-players-container .active-player-row')).toHaveCount(PLAYERS.length);
    await page.click('#start-game-btn');
    await expect(page.locator('#game-screen')).not.toHaveClass(/hidden/);

    // --- Play all 13 rounds ---
    for (let roundIdx = 0; roundIdx < CARDS_SEQUENCE.length; roundIdx++) {
        const cards = CARDS_SEQUENCE[roundIdx];
        await enterBids(page);
        await enterTricks(page, cards);
    }

    // --- Assert: game-over screen with podium is shown ---
    await expect(page.locator('#game-over-modal')).not.toHaveClass(/hidden/);
    await expect(page.locator('#podium-container')).toBeVisible();
    await expect(page.locator('#podium-container .podium-step')).toHaveCount(PLAYERS.length);
});
