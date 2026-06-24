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

test('B-E2: editing a past bid triggers a cascade score recalculation visible in the table', async ({ page, context }) => {
    // Navigate to set the origin, then use CDP to forcefully wipe local_storage,
    // then navigate away and back so the app boots from an empty state.
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

    // Play 5 rounds (indices 0–4) with Anna taking all tricks each round.
    // After 5 rounds Bob has gesamtPunkte 10 at round 1 (rIndex=1) and 15 at round 2 (rIndex=2).
    for (let roundIdx = 0; roundIdx < 5; roundIdx++) {
        const cards = CARDS_SEQUENCE[roundIdx];
        await enterBids(page);
        await enterTricks(page, cards);
    }

    // Open the edit button for round 2 (rIndex=1, aria-label="Runde 2 bearbeiten")
    await page.click('[aria-label="Runde 2 bearbeiten"]');
    await expect(page.locator('#edit-choice-modal')).not.toHaveClass(/hidden/);

    // Choose to edit bids (Ansage)
    await page.click('#edit-ansage-btn');
    await expect(page.locator('#input-modal')).not.toHaveClass(/hidden/);

    // Modal opens at Anna (index 0). Navigate to Bob (index 1).
    await page.click('#modal-next-btn');

    // Set Bob's new bid to 2 (round 1 has 2 cards)
    await clickNumber(page, 2);
    await page.click('#save-input-btn');

    // Assert: Bob's cell in row 1 (rIndex=1) reflects the edited bid.
    // Bob bid=2, won=0 → punkte=−2; gesamtPunkte = 5 + (−2) = 3  (was 10)
    const row1 = page.locator('#table-body tr').nth(1);
    const bobCell1 = row1.locator('td').nth(2);  // td[0]=round, td[1]=Anna, td[2]=Bob
    await expect(bobCell1.locator('.cell-stats')).toHaveText('2/0');
    await expect(bobCell1.locator('.cell-score')).toHaveText('3');

    // Assert: Bob's cumulative score in row 2 (rIndex=2) cascaded.
    // Bob gesamtPunkte[2] = 3 + 5 = 8  (was 15)
    const row2 = page.locator('#table-body tr').nth(2);
    await expect(row2.locator('td').nth(2).locator('.cell-score')).toHaveText('8');
});
