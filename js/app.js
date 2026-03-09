import { GameModel } from './model.js';
import { GameView } from './view.js';
import { GameController } from './controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const model = new GameModel();
    const view = new GameView();
    new GameController(model, view);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.error('SW registration failed:', err));
    });
}