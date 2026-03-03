import { GameModel } from './model.js';
import { GameView } from './view.js';
import { GameController } from './controller.js';

document.addEventListener('DOMContentLoaded', () => {
    const model = new GameModel();
    const view = new GameView();
    const app = new GameController(model, view);
});