import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    // Run all E2E tests serially. With 4 tests each triggering a service-worker
    // install (20+ asset requests each), parallel execution overwhelms the
    // single http-server instance and causes intermittent failures.
    workers: 1,
    use: {
        baseURL: 'http://localhost:3000',
    },
    webServer: {
        command: 'node node_modules/http-server/bin/http-server . -p 3000 -c-1 --silent',
        port: 3000,
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        { name: 'chromium', use: { browserName: 'chromium' } },
    ],
});
