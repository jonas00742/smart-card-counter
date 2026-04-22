import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

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
        this.eventBus.on(EVENTS.APP_INSTALL, this.handleInstallApp.bind(this));
        this.eventBus.on(EVENTS.GAME_GO_BACK, () => this.view.showConfirmBackModal());
        this.eventBus.on(EVENTS.CONFIRM_BACK_ACCEPT, this.handleConfirmBackAccept.bind(this));
        this.eventBus.on(EVENTS.CONFIRM_BACK_CANCEL, () => this.view.hideConfirmBackModal());
    }

    initRouter() {
        window.addEventListener('popstate', this.handlePopState.bind(this));

        const hasOngoingGame = this.model.state.roundsData && this.model.state.roundsData.length > 0;

        if (hasOngoingGame) {
            this._restoreOngoingGame();
        } else {
            this._initializeSetupScreen();
        }
    }

    _restoreOngoingGame() {
        window.history.replaceState({ screen: 'game' }, '', '#game');
        this.view.switchScreen(true);
        this._updateGameTableView();

        // Check if penultimate round warning is needed
        const { currentRoundIndex, phase, roundsData, activePlayers } = this.model.state;
        const isPenultimateRound = currentRoundIndex === CONFIG.TOTAL_ROUNDS - 1;

        if (isPenultimateRound && phase === 'ansage' && roundsData[currentRoundIndex]) {
            const noBidsEnteredYet = !activePlayers.some(p => roundsData[currentRoundIndex][p]?.ansage !== null);
            if (noBidsEnteredYet) this.view.startPenultimateRoundBlinking();
        }
    }

    _getGameTableProps() {
        return {
            state: this.model.state,
            leaderboard: this.model.getLeaderboard()
        }
    }

    _updateGameTableView() {
        const props = this._getGameTableProps();
        this.view.renderGameTable(props);
    }

    _initializeSetupScreen() {
        window.history.replaceState({ screen: 'setup' }, '', '#setup');
        const { availablePlayers, activePlayers, startingDealerIndex } = this.model.state;
        this.view.renderSetup({ availablePlayers, activePlayers, startingDealerIndex });
    }

    handlePopState() {
        const isGameScreenVisible = this.view.isGameScreenVisible();
        if (isGameScreenVisible && !this.model.state.isGameOver) {
            window.history.pushState({ screen: 'game' }, '', '#game');
            this.view.showConfirmBackModal();
            return;
        }
        if (isGameScreenVisible && this.model.state.isGameOver) this.model.quitGame();
        this.view.switchScreen(false);
        const { availablePlayers, activePlayers, startingDealerIndex } = this.model.state;
        this.view.renderSetup({ availablePlayers, activePlayers, startingDealerIndex });
    }

    handleConfirmBackAccept() {
        this.view.hideConfirmBackModal();
        this.model.quitGame();
        window.history.replaceState({ screen: 'setup' }, '', '#setup');
        this.view.switchScreen(false);
        const { availablePlayers, activePlayers, startingDealerIndex } = this.model.state;
        this.view.renderSetup({ availablePlayers, activePlayers, startingDealerIndex });
    }

    async handleInstallApp() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') this.view.toggleInstallButton(false);
        this.deferredPrompt = null;
    }
}