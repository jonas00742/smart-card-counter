import { CONFIG } from '../config.js';

export class AppController {
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;
        this.deferredPrompt = null;

        this.initInstallPrompt();
        this.initRouter();
        this.bindEvents();
    }

    initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.view.toggleInstallButton(true);
        });
    }

    bindEvents() {
        this.eventBus.on('APP_INSTALL', this.handleInstallApp.bind(this));
        this.eventBus.on('GAME_GO_BACK', () => this.view.showConfirmBackModal());
        this.eventBus.on('CONFIRM_BACK_ACCEPT', this.handleConfirmBackAccept.bind(this));
        this.eventBus.on('CONFIRM_BACK_CANCEL', () => this.view.hideConfirmBackModal());
    }

    initRouter() {
        window.addEventListener('popstate', this.handlePopState.bind(this));
        if (this.model.state.roundsData && this.model.state.roundsData.length > 0) {
            window.history.replaceState({ screen: 'game' }, '', '#game');
            this.view.switchScreen(true);
            this.view.renderGameTable(this.model.state, this.model.getLeaderboard());

            const { currentRoundIndex, phase, roundsData, activePlayers } = this.model.state;
            if (currentRoundIndex === CONFIG.TOTAL_ROUNDS - 1 && phase === 'ansage' && roundsData[currentRoundIndex]) {
                if (!activePlayers.some(p => roundsData[currentRoundIndex][p]?.ansage !== null)) {
                    this.view.startPenultimateRoundBlinking();
                }
            }
        } else {
            window.history.replaceState({ screen: 'setup' }, '', '#setup');
            this.view.renderSetup(this.model.state);
        }
    }

    handlePopState() {
        const isGameScreenVisible = !this.view.elements.gameScreen.classList.contains('hidden');
        if (isGameScreenVisible && !this.model.state.isGameOver) {
            window.history.pushState({ screen: 'game' }, '', '#game');
            this.view.showConfirmBackModal();
            return;
        } 
        if (isGameScreenVisible && this.model.state.isGameOver) this.model.quitGame();
        this.view.switchScreen(false);
        this.view.renderSetup(this.model.state);
    }

    handleConfirmBackAccept() {
        this.view.hideConfirmBackModal();
        this.model.quitGame();
        window.history.replaceState({ screen: 'setup' }, '', '#setup');
        this.view.switchScreen(false);
        this.view.renderSetup(this.model.state);
    }

    async handleInstallApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') this.view.toggleInstallButton(false);
        this.deferredPrompt = null;
    }
}