import { GameModel } from './model.js';
import { GameView } from './view.js';
import { EventBus } from './core/EventBus.js';
import { AppController } from './controllers/AppController.js';
import { SetupController } from './controllers/SetupController.js';
import { RoundController } from './controllers/RoundController.js';

document.addEventListener('DOMContentLoaded', () => {
    const eventBus = new EventBus();
    const model = new GameModel();
    const view = new GameView(eventBus);

    new AppController(model, view, eventBus);
    new SetupController(model, view, eventBus);
    new RoundController(model, view, eventBus);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
    });

    // Reload the page when a new Service Worker takes control (updates)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}