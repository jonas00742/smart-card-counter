export class SetupController {
    constructor(model, view, eventBus) {
        this.model = model;
        this.view = view;
        this.eventBus = eventBus;
        this.bindEvents();
    }

    bindEvents() {
        this.eventBus.on('SETUP_ADD_PLAYER', this.handleAddPlayer.bind(this));
        this.eventBus.on('SETUP_TOGGLE_PLAYER', this.handleTogglePlayer.bind(this));
        this.eventBus.on('SETUP_REMOVE_PLAYER', this.handleRemovePlayer.bind(this));
        this.eventBus.on('SETUP_REORDER_PLAYERS', this.handleReorderPlayers.bind(this));
        this.eventBus.on('SETUP_SET_DEALER', this.handleSetDealer.bind(this));
        this.eventBus.on('SETUP_START_GAME', this.handleStartGame.bind(this));
    }

    handleAddPlayer(name) { this.model.addPlayer(name); this.view.renderSetup(this.model.state); }
    handleTogglePlayer(player) { this.model.togglePlayerActive(player); this.view.renderSetup(this.model.state); }
    handleRemovePlayer(player) { this.model.removePlayer(player); this.view.renderSetup(this.model.state); }
    handleReorderPlayers(newOrder) { this.model.setPlayerOrder(newOrder); this.view.renderSetup(this.model.state); }
    handleSetDealer(index) { this.model.setStartingDealer(index); this.view.renderSetup(this.model.state); }

    handleStartGame() {
        this.model.initGameData();
        window.history.pushState({ screen: 'game' }, '', '#game');
        this.view.switchScreen(true);
        this.view.renderGameTable(this.model.state, this.model.getLeaderboard());
    }
}