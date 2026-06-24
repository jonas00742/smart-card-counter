import http from 'k6/http';
import { check, group, sleep } from 'k6';

// A-L1: Baseline Smoke Test — 5 virtual users, 30 seconds.
//
// Goal: Confirm that every critical app asset listed in sw.js ASSETS_TO_CACHE
//       is reachable and responds within acceptable time limits under minimal
//       concurrent load. A failure here means either an asset path is wrong
//       (which would silently break offline mode) or the server is too slow.
//
// Success criteria:
//   - Error rate  < 1 %   (http_req_failed)
//   - p95 latency < 500 ms (http_req_duration)
//
// Prerequisites:
//   The static server must be running before k6 is launched.
//   Start it with:  npx http-server . -p 3000 -c-1
//
// Run (default host):
//   k6 run tests/load/baseline.js
//
// Run against a deployed instance:
//   k6 run --env BASE_URL=https://example.com tests/load/baseline.js

export const options = {
    vus: 5,
    duration: '30s',
    thresholds: {
        http_req_failed:   ['rate<0.01'],   // < 1 % of all requests may fail
        http_req_duration: ['p(95)<500'],   // p95 response time under 500 ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {

    // ── App Shell ────────────────────────────────────────────────────────────
    // The entry-point HTML, stylesheet, and PWA manifest must always be served
    // correctly — these are the minimum required for the app to appear at all.
    group('App Shell', function () {
        const responses = http.batch([
            ['GET', `${BASE_URL}/`],
            ['GET', `${BASE_URL}/index.html`],
            ['GET', `${BASE_URL}/manifest.json`],
            ['GET', `${BASE_URL}/favicon.ico`],
            ['GET', `${BASE_URL}/css/style.css`],
        ]);

        check(responses[0], {
            'index /: status 200':      (r) => r.status === 200,
            'index /: valid HTML body': (r) => r.body !== null && r.body.includes('<html'),
        });
        check(responses[1], { 'index.html: status 200':  (r) => r.status === 200 });
        check(responses[2], { 'manifest.json: status 200': (r) => r.status === 200 });
        check(responses[3], { 'favicon.ico: status 200': (r) => r.status === 200 });
        check(responses[4], { 'style.css: status 200':   (r) => r.status === 200 });
    });

    // ── JavaScript Modules ───────────────────────────────────────────────────
    // All 16 ES modules are requested in parallel, mirroring how a browser
    // resolves the import graph. A missing or renamed module would return 404
    // here before it ever breaks a user session.
    group('JavaScript Modules', function () {
        const scripts = [
            '/js/app.js',
            '/js/config.js',
            '/js/model.js',
            '/js/view.js',
            '/js/components/FeedbackModals.js',
            '/js/components/GameTableView.js',
            '/js/components/InputModal.js',
            '/js/components/SetupView.js',
            '/js/controllers/AppController.js',
            '/js/controllers/RoundController.js',
            '/js/controllers/SetupController.js',
            '/js/core/AutoFillService.js',
            '/js/core/EventBus.js',
            '/js/core/events.js',
            '/js/core/ScoreEngine.js',
            '/js/utils/dom.js',
        ];

        const responses = http.batch(scripts.map(s => ['GET', `${BASE_URL}${s}`]));

        responses.forEach((res, i) => {
            check(res, {
                [`${scripts[i]}: status 200`]: (r) => r.status === 200,
            });
        });
    });

    // ── Static Assets ────────────────────────────────────────────────────────
    // Icons and audio files are cached by the SW for offline use. Fetching
    // them confirms their paths are correct and the server serves them.
    group('Static Assets', function () {
        const assets = [
            '/assets/icon-192.png',
            '/assets/icon-512.png',
            '/assets/Danger%20Alarm.mp3',
            '/assets/Fah.mp3',
        ];

        const responses = http.batch(assets.map(a => ['GET', `${BASE_URL}${a}`]));

        responses.forEach((res, i) => {
            check(res, {
                [`${assets[i]}: status 200`]: (r) => r.status === 200,
            });
        });
    });

    // 1-second think time between full page-load simulations.
    sleep(1);
}
