import { GameModel } from './model.js';
import { GameView } from './view.js';
import { GameController } from './controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const model = new GameModel();
    const view = new GameView();
    const app = new GameController(model, view);
});

// --- NEU: SERVICE WORKER REGISTRIERUNG ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('Service Worker erfolgreich registriert mit Scope:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker Registrierung fehlgeschlagen:', error);
            });
    });
}