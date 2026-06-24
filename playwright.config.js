import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
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
