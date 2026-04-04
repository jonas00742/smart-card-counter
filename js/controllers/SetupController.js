import { EVENTS } from '../core/events.js';

export class SetupController {
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;
        this.bindEvents();
    }

    bindEvents() {
        this.eventBus.on(EVENTS.SETUP_ADD_PLAYER, this.handleAddPlayer.bind(this));
        this.eventBus.on(EVENTS.SETUP_TOGGLE_PLAYER, this.handleTogglePlayer.bind(this));
        this.eventBus.on(EVENTS.SETUP_REMOVE_PLAYER, this.handleRemovePlayer.bind(this));
        this.eventBus.on(EVENTS.SETUP_REORDER_PLAYERS, this.handleReorderPlayers.bind(this));
        this.eventBus.on(EVENTS.SETUP_SET_DEALER, this.handleSetDealer.bind(this));
        this.eventBus.on(EVENTS.SETUP_START_GAME, this.handleStartGame.bind(this));
    }

    _updateSetupView() {
        const { availablePlayers, activePlayers, startingDealerIndex } = this.model.state;
        this.view.renderSetup({ availablePlayers, activePlayers, startingDealerIndex });
    }

    handleAddPlayer(name) { this.model.addPlayer(name); this._updateSetupView(); }
    handleTogglePlayer(player) { this.model.togglePlayerActive(player); this._updateSetupView(); }
    handleRemovePlayer(player) { this.model.removePlayer(player); this._updateSetupView(); }
    handleReorderPlayers(newOrder) { this.model.setPlayerOrder(newOrder); this._updateSetupView(); }
    handleSetDealer(index) { this.model.setStartingDealer(index); this._updateSetupView(); }

    handleStartGame() {
        this.model.initGameData();
        window.history.pushState({ screen: 'game' }, '', '#game');
        this.view.switchScreen(true);
        this._updateGameTableView();
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
}