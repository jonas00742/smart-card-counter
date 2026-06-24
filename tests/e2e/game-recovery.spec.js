import { test, expect } from '@playwright/test';

const CARDS_SEQUENCE = [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
const PLAYERS = ['Anna', 'Bob', 'Carol'];

async function clickNumber(page, value) {
    await page.locator('#dynamic-button-grid button')
        .filter({ hasText: new RegExp(`^${value}$`) })
        .click();
}

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

async function enterTricks(page, cards) {
    await page.click('#open-input-modal-btn');
    await expect(page.locator('#input-modal')).not.toHaveClass(/hidden/);
    await clickNumber(page, cards);
    await expect(page.locator('#save-input-btn')).toBeEnabled();
    await page.click('#save-input-btn');
}

test('B-E1: page reload mid-game restores the game screen and resumes from the correct round', async ({ page, context }) => {
    await page.goto('/');
    const cdp = await context.newCDPSession(page);
    await cdp.send('Storage.clearDataForOrigin', {
        origin: 'http://localhost:3000',
        storageTypes: 'local_storage',
    });
    await page.goto('about:blank');
    await page.goto('/');

    for (const name of PLAYERS) {
        await page.fill('#new-player-name', name);
        await page.press('#new-player-name', 'Enter');
        await expect(page.locator('#available-players-container')).toContainText(name);
    }
    await page.click('#start-game-btn');
    await expect(page.locator('#game-screen')).not.toHaveClass(/hidden/);

    // Play 5 rounds (indices 0–4) with Anna taking all tricks each round
    for (let roundIdx = 0; roundIdx < 5; roundIdx++) {
        const cards = CARDS_SEQUENCE[roundIdx];
        await enterBids(page);
        await enterTricks(page, cards);
    }

    // Reload — the app must restore game state from localStorage
    await page.reload();

    // Assert: game screen visible, setup screen hidden
    await expect(page.locator('#game-screen')).not.toHaveClass(/hidden/);
    await expect(page.locator('#setup-screen')).toHaveClass(/hidden/);

    // Assert: FAB button reflects round index 5 → CARDS_SEQUENCE[5] = 6 cards
    await expect(page.locator('#open-input-modal-btn')).toContainText('6 Karten');
});
