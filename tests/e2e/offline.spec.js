import { test, expect } from '@playwright/test';

// A-E2: The service worker (sw.js) caches all critical app assets during the
// install event via event.waitUntil(), so by the time the SW controls the page
// (navigator.serviceWorker.controller !== null) every entry in ASSETS_TO_CACHE
// has been stored in the browser cache. This test proves that a full page reload
// with no network connection loads the app entirely from that cache.
test('A-E2: app loads and remains interactive from SW cache in offline mode', async ({ page, context }) => {
    // --- Step 1: First visit — triggers SW registration, install, and asset caching ---
    await page.goto('/');

    // --- Step 2: Wait for SW to control this page ---
    // The install event uses event.waitUntil(), which delays skipWaiting() until
    // every cache.add() call has completed. Once the SW is the active controller,
    // the entire ASSETS_TO_CACHE list has been written to the cache.
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    // --- Step 3: Disconnect the network ---
    // Any fetch that the SW cannot satisfy from cache will now fail with a
    // network error instead of reaching a real server.
    await context.setOffline(true);

    try {
        // --- Step 4: Reload — every fetch is handled by the SW's Cache-First strategy ---
        await page.reload();

        // --- Step 5: Assert the app shell loaded from cache ---
        // This proves that index.html, css/style.css, and all JS modules were
        // served by the SW without any network access.
        await expect(page.locator('#setup-screen')).toBeVisible();
        await expect(page.locator('#setup-header h1')).toBeVisible();

        // --- Step 6: Interact to prove JS executes correctly from cache ---
        // If any JS module were missing from the cache, the EventBus/model
        // wiring would fail and this player addition would not update the DOM.
        await page.fill('#new-player-name', 'OfflineTest');
        await page.press('#new-player-name', 'Enter');
        await expect(page.locator('#available-players-container')).toContainText('OfflineTest');
    } finally {
        // Always restore connectivity — prevents leaking offline state if the test fails.
        await context.setOffline(false);
    }
});
