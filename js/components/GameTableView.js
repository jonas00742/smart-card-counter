import { createElement, getIcon, generateLeaderboardHtml, bindBackdropClick } from '../utils/dom.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

export class GameTableView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
        this.elements = {
            backToSetupBtn: document.getElementById('back-to-setup-btn'),
            currentCardsSpan: document.getElementById('current-cards'),
            scoreTable: document.getElementById('score-table'),
            tableHeaderRow: document.getElementById('table-header-row'),
            tableBody: document.getElementById('table-body'),
            openInputModalBtn: document.getElementById('open-input-modal-btn'),
            leaderboardContainer: document.getElementById('leaderboard-container'),
            leaderboardList: document.getElementById('leaderboard-list'),
            fabInterimBtn: document.getElementById('fab-interim-btn'),
            fabCheckBtn: document.getElementById('fab-check-btn'),
            bidsModal: document.getElementById('bids-check-modal'),
            bidsList: document.getElementById('bids-list'),
            closeBidsBtn: document.getElementById('close-bids-btn'),
        };
    }

    _bindEvents() {
        this.elements.backToSetupBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_GO_BACK));
        this.elements.openInputModalBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_OPEN_MODAL));
        this.elements.fabCheckBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_TOGGLE_BIDS));

        const closeBidsModal = () => {
            this.hideBidsModal();
            this.eventBus.emit(EVENTS.MODAL_BIDS_CLOSE);
        };
        this.elements.closeBidsBtn.addEventListener('click', closeBidsModal);
        bindBackdropClick(this.elements.bidsModal, closeBidsModal);

        // Re-delegate edit clicks whenever the table body changes
        this.elements.tableBody.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                const rIndex = parseInt(editBtn.dataset.rindex, 10);
                this.eventBus.emit(EVENTS.GAME_TRIGGER_EDIT, rIndex);
            }
        });
    }
    
    renderGameTable(props) {
        const { state, leaderboard } = props;
        this._renderTrendIndicator(state);
        this._renderActionButtons(state);
        this._renderTableHeader(state, leaderboard);
        this._renderTableBody(state);
        this._updateLeaderboardVisibility(state, leaderboard);
        this._updateFabVisibility(state);
    }
    
    showBidsModal(props) {
        const { currentRoundIndex, activePlayers, roundsData } = props;
        this.elements.bidsList.innerHTML = activePlayers.map(p => {
            const ansage = roundsData[currentRoundIndex][p].ansage;
            return `
                <div class="bids-modal-row">
                    <strong>${p}</strong>
                    <span class="bids-modal-value">${ansage !== null ? ansage : '-'}</span>
                </div>
            `;
        }).join('');
        this.elements.bidsModal.classList.remove('hidden');
    }

    hideBidsModal() {
        this.elements.bidsModal.classList.add('hidden');
    }

    startPenultimateRoundBlinking() { 
        document.body.classList.add('penultimate-round-warning'); 
        const alarmSound = new Audio('assets/Danger Alarm.mp3');
        alarmSound.play().catch(err => console.warn('Audio playback failed:', err));
    }
    stopPenultimateRoundBlinking() { document.body.classList.remove('penultimate-round-warning'); }

    // --- Private Rendering Methods ---

    _renderTrendIndicator(state) {
        const cards = CONFIG.CARDS_SEQUENCE[state.currentRoundIndex];
        let arrowHtml = '';
        if (!state.isGameOver && state.currentRoundIndex < CONFIG.TOTAL_ROUNDS - 1) {
            const nextCards = CONFIG.CARDS_SEQUENCE[state.currentRoundIndex + 1];
            if (nextCards > cards) arrowHtml = '<span class="trend-arrow">↑</span>';
            else if (nextCards < cards) arrowHtml = '<span class="trend-arrow">↓</span>';
        }
        this.elements.currentCardsSpan.innerHTML = `${cards}${arrowHtml}`;
    }

    _renderActionButtons(state) {
        const cards = CONFIG.CARDS_SEQUENCE[state.currentRoundIndex];
        this.elements.openInputModalBtn.classList.toggle('hidden', state.isGameOver);
        if (state.isGameOver) return;

        const phaseKey = state.phase === 'ansage' ? 'ansage' : 'gemacht';
        const enteredCount = state.activePlayers.filter(p => 
            state.roundsData[state.currentRoundIndex][p][phaseKey] !== null
        ).length;

        const allEntered = enteredCount === state.activePlayers.length;
        const someEntered = enteredCount > 0;
        const btn = this.elements.openInputModalBtn;

        btn.classList.remove('pulse-animation', 'btn-continue');
        
        if (allEntered) {
            btn.innerText = `Eingabe bestätigen (${cards} Karten)`;
            btn.classList.add('pulse-animation');
        } else if (someEntered) {
            btn.innerText = `Eingabe fortsetzen (${cards} Karten)`;
            btn.classList.add('btn-continue');
        } else {
            btn.innerText = state.phase === 'ansage' ? `Eingabe starten (${cards} Karten)` : `Stiche eintragen (${cards} Karten)`;
        }
    }

    _renderTableHeader(state, leaderboard) {
        this.elements.tableHeaderRow.innerHTML = '<th class="narrow-col">Runde</th>'; // Reset header

        const numPlayers = state.activePlayers.length;
        const currentDealerIndex = numPlayers > 0 ? (state.startingDealerIndex + state.currentRoundIndex) % numPlayers : 0;
        const startingPlayerIndex = numPlayers > 0 ? (currentDealerIndex + 1) % numPlayers : 0;
        
        const leadingPlayerNames = (state.currentRoundIndex > 0 || state.isGameOver) && leaderboard.length > 0
            ? leaderboard.filter(p => p.rank === 1).map(p => p.name)
            : [];
        
        state.activePlayers.forEach((player, index) => {
            const isDealer = index === currentDealerIndex;
            const isStarter = index === startingPlayerIndex;
            const isLeading = leadingPlayerNames.includes(player);
            
            let headerText = player.substring(0, 10);
            if (isStarter) headerText = '▶ ' + headerText;
            if (isLeading) headerText += ' 👑';

            const tooltips = [];
            if (isDealer) tooltips.push("Geber");
            if (isStarter) tooltips.push("Kommt raus");
            if (isLeading) tooltips.push("Führend");
            
            const th = createElement('th', { 
                className: `player-col ${isDealer ? 'dealer-col-header' : ''}`,
                text: headerText,
                title: tooltips.join(" | ")
            });
            this.elements.tableHeaderRow.appendChild(th);
        });

        this.elements.tableHeaderRow.appendChild(createElement('th', { className: 'status-col-header', text: '±' }));
    }

    _renderTableBody(state) {
        this.elements.tableBody.innerHTML = '';
        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const row = this._createTableRow(state, index, cardCount);
            this.elements.tableBody.appendChild(row);
        });
    }

    _createTableRow(state, rIndex, cardCount) {
        const roundData = state.roundsData[rIndex];
        const { totalBids, allBidsMade, isRowIncomplete } = this._getRoundStatus(state, rIndex);
        
        const tr = createElement('tr');
        if (isRowIncomplete) tr.classList.add('row-warning');
        else if (rIndex === state.currentRoundIndex && !state.isGameOver) {
            tr.style.backgroundColor = 'var(--color-highlight-row)';
        }

        const editBtnHtml = (rIndex <= state.currentRoundIndex || state.isGameOver)
            ? `<button class="edit-btn" data-rindex="${rIndex}">${getIcon('edit')}</button>`
            : '';
        tr.appendChild(createElement('td', { className: 'round-cell', html: `<div class="round-cell-content"><span>${cardCount}</span>${editBtnHtml}</div>` }));

        state.activePlayers.forEach(player => {
            tr.appendChild(this._createPlayerCell(roundData[player]));
        });

        tr.appendChild(this._createStatusCell(allBidsMade, isRowIncomplete, totalBids, cardCount));

        return tr;
    }

    _getRoundStatus(state, rIndex) {
        let totalBids = 0;
        let allBidsMade = true;
        let isRowIncomplete = false;

        const isPastBidPhase = rIndex < state.currentRoundIndex || (rIndex === state.currentRoundIndex && state.phase === 'stiche') || state.isGameOver;
        const isPastTricksPhase = rIndex < state.currentRoundIndex || state.isGameOver;

        for (const player of state.activePlayers) {
            const data = state.roundsData[rIndex][player];
            if (data.ansage === null) allBidsMade = false;
            else totalBids += data.ansage;
            if (isPastBidPhase && data.ansage === null) isRowIncomplete = true;
            if (isPastTricksPhase && data.gemacht === null) isRowIncomplete = true;
        }
        return { totalBids, allBidsMade, isRowIncomplete };
    }

    _createPlayerCell(playerData) {
        const { ansage, gemacht, gesamtPunkte, punkte } = playerData;
        const bidStr = ansage ?? '-';
        const wonStr = gemacht ?? '-';
        const scoreStr = gemacht !== null ? gesamtPunkte : '-';
        const scoreColor = punkte < 0 ? 'var(--color-danger)' : 'inherit';

        return createElement('td', {
            className: 'player-col',
            html: `<div class="cell-data"><span class="cell-stats">${bidStr}/${wonStr}</span><span class="cell-score" style="color: ${scoreColor}">${scoreStr}</span></div>`
        });
    }

    _createStatusCell(allBidsMade, isRowIncomplete, totalBids, cardCount) {
        let statusHtml = '';
        if (isRowIncomplete) {
            statusHtml = `<span class="status-badge warning" title="Unvollständig">${getIcon('warning')}</span>`;
        } else if (allBidsMade) {
            const diff = totalBids - cardCount;
            if (diff === 0) {
                statusHtml = `<span class="status-badge success">${getIcon('check')}</span>`;
            } else {
                const badgeType = diff > 0 ? 'danger' : 'accent';
                const iconType = diff > 0 ? 'cross' : 'dash';
                const diffSign = diff > 0 ? '+' : '';
                const diffClass = diff > 0 ? 'status-value-positive' : 'status-value-negative';

                statusHtml = `
                    <span class="status-badge ${badgeType}">${getIcon(iconType)}</span>
                    <span class="status-value-top">${totalBids}</span>
                    <span class="status-value-bottom ${diffClass}">${diffSign}${diff}</span>
                `;
            }
        }
        return createElement('td', { className: 'status-cell', html: statusHtml });
    }

    _updateLeaderboardVisibility(state, leaderboard) {
        this.elements.leaderboardContainer.classList.toggle('hidden', !state.isGameOver);
        if (state.isGameOver) {
            this.elements.leaderboardList.innerHTML = generateLeaderboardHtml(leaderboard, ' Pkt');
        }
    }

    _updateFabVisibility(state) {
        const isFabInterimVisible = !state.isGameOver;
        this.elements.fabInterimBtn.classList.toggle('hidden', !isFabInterimVisible);

        const isFabCheckVisible = isFabInterimVisible && state.phase === 'stiche';
        this.elements.fabCheckBtn.classList.toggle('hidden', !isFabCheckVisible);
    }
}