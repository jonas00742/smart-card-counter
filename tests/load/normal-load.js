import http from 'k6/http';
import { check, group, sleep } from 'k6';

// B-L1: Normal-Load Test — 50 virtual users, 2 minutes.
//
// Goal: Verify that all critical app assets are served reliably under a
//       representative concurrent user load (10× the A-L1 smoke test).
//       A-L1 proved the server can handle 5 VUs; this test confirms it
//       scales to a realistic number of simultaneous users.
//
// Success criteria:
//   - Error rate  < 5 %    (http_req_failed)
//   - p95 latency < 1000 ms (http_req_duration)
//
// Prerequisites:
//   The static server must be running before k6 is launched.
//   Start it with:  npx http-server . -p 3000 -c-1
//
// Run (default host):
//   k6 run tests/load/normal-load.js
//
// Run against a deployed instance:
//   k6 run --env BASE_URL=https://example.com tests/load/normal-load.js

export const options = {
    vus: 50,
    duration: '2m',
    thresholds: {
        http_req_failed:   ['rate<0.05'],    // < 5 % of all requests may fail
        http_req_duration: ['p(95)<1000'],   // p95 response time under 1000 ms
    },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {

    // ── App Shell ────────────────────────────────────────────────────────────
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
        check(responses[1], { 'index.html: status 200':    (r) => r.status === 200 });
        check(responses[2], { 'manifest.json: status 200': (r) => r.status === 200 });
        check(responses[3], { 'favicon.ico: status 200':   (r) => r.status === 200 });
        check(responses[4], { 'style.css: status 200':     (r) => r.status === 200 });
    });

    // ── JavaScript Modules ───────────────────────────────────────────────────
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

    sleep(1);
}
