import { createElement, getIcon, generateLeaderboardHtml, bindBackdropClick } from '../utils/dom.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

export class GameTableView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.elements = {
            backToSetupBtn: document.getElementById('back-to-setup-btn'),
            currentCardsSpan: document.getElementById('current-cards'),
            scoreTable: document.getElementById('score-table'),
            tableHeaderRow: document.getElementById('table-header-row'),
            tableBody: document.getElementById('table-body'),
            openInputModalBtn: document.getElementById('open-input-modal-btn'),
            leaderboardContainer: document.getElementById('leaderboard-container'),
            leaderboardList: document.getElementById('leaderboard-list'),
            fabInterimBtn: document.getElementById('fab-interim-btn')
        };
        
        this.elements.backToSetupBtn.textContent = '◀';
        this.elements.backToSetupBtn.classList.add('header-back-btn');

        this.elements.backToSetupBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_GO_BACK));
        this.elements.openInputModalBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_OPEN_MODAL));

        this._initCheckButtonAndModal();
    }

    _initCheckButtonAndModal() {
        this.elements.fabCheckBtn = document.getElementById('fab-check-btn');
        if (!this.elements.fabCheckBtn) {
            const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            this.elements.fabCheckBtn = createElement('button', {
                id: 'fab-check-btn',
                className: 'fab-check-btn hidden',
                html: eyeIcon
            });
            document.body.appendChild(this.elements.fabCheckBtn);
        }
        this.elements.fabCheckBtn.addEventListener('click', () => this.eventBus.emit('GAME_TOGGLE_BIDS'));

        this.elements.bidsModal = document.getElementById('bids-check-modal');
        if (!this.elements.bidsModal) {
            this.elements.bidsModal = createElement('div', { id: 'bids-check-modal', className: 'modal hidden' });
            const content = createElement('div', { className: 'modal-content text-center' });
            content.style.padding = '15px'; // Etwas kompakteres Padding für das Modal
            content.innerHTML = `
                <div class="modal-header-custom" style="justify-content: center; margin-bottom: 10px;">
                    <h2 class="m-0" style="font-size: 1.5rem;">Angesagte Stiche</h2>
                </div>
                <div id="bids-list" class="flex-col-gap mb-md text-md"></div>
                <button id="close-bids-btn" class="primary-btn mt-sm">Schließen</button>
            `;
            this.elements.bidsModal.appendChild(content);
            document.body.appendChild(this.elements.bidsModal);
            
            const closeModal = () => {
                this.hideBidsModal();
                this.eventBus.emit('MODAL_BIDS_CLOSE');
            };
            document.getElementById('close-bids-btn').addEventListener('click', closeModal);
            bindBackdropClick(this.elements.bidsModal, closeModal);
        }

        // Synchronisiert die Sichtbarkeit des Check-Buttons mit dem Zwischenstand-Button
        if (this.elements.fabInterimBtn) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((m) => {
                    if (m.attributeName === 'class') {
                        const isInterimHidden = this.elements.fabInterimBtn.classList.contains('hidden');
                        if (isInterimHidden) {
                            if (this.elements.fabCheckBtn) this.elements.fabCheckBtn.classList.add('hidden');
                        } else {
                            if (this.elements.fabCheckBtn) {
                                const shouldShow = this.elements.fabCheckBtn.dataset.shouldShow === 'true';
                                this.elements.fabCheckBtn.classList.toggle('hidden', !shouldShow);
                            }
                        }
                    }
                });
            });
            observer.observe(this.elements.fabInterimBtn, { attributes: true, attributeFilter: ['class'] });
        }
    }

    renderGameTable(state, leaderboard = []) {
        this._renderTrendIndicator(state);
        this._renderActionButtons(state);
        this._renderTableHeader(state, leaderboard);
        this._renderTableBody(state);
        this._updateLeaderboardVisibility(state, leaderboard);
        this._updateCheckButtonVisibility(state);
    }

    _updateCheckButtonVisibility(state) {
        if (!this.elements.fabCheckBtn) return;
        const shouldShow = state.phase === 'stiche' && !state.isGameOver;
        this.elements.fabCheckBtn.dataset.shouldShow = shouldShow;
        this.elements.fabCheckBtn.classList.toggle('hidden', !shouldShow);
    }

    showBidsModal(state) {
        const rIndex = state.currentRoundIndex;
        const bidsList = document.getElementById('bids-list');
        if (bidsList) {
            bidsList.innerHTML = state.activePlayers.map(p => {
                const ansage = state.roundsData[rIndex][p].ansage;
                return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--color-border); background: var(--color-surface); border-radius: var(--radius-sm); margin-bottom: 4px; box-shadow: var(--shadow-sm);">
                            <strong style="font-size: 1.1rem;">${p}</strong>
                            <span style="font-size: 1.8rem; font-weight: bold; color: var(--color-success);">${ansage !== null ? ansage : '-'}</span>
                        </div>`;
            }).join('');
        }
        this.elements.bidsModal.classList.remove('hidden');
    }

    hideBidsModal() {
        if (this.elements.bidsModal) this.elements.bidsModal.classList.add('hidden');
    }

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
        if (!state.isGameOver) {
            this._updateInputButtonState(state, cards);
        }
        this.elements.openInputModalBtn.classList.toggle('hidden', state.isGameOver);
    }

    _renderTableHeader(state, leaderboard) {
        Array.from(this.elements.tableHeaderRow.children).slice(1).forEach(el => el.remove());

        const numPlayers = state.activePlayers.length;
        const currentDealerIndex = numPlayers > 0 ? (state.startingDealerIndex + state.currentRoundIndex) % numPlayers : 0;
        const currentDealer = state.activePlayers[currentDealerIndex];
        const startingPlayerIndex = numPlayers > 0 ? (currentDealerIndex + 1) % numPlayers : 0;
        const startingPlayer = state.activePlayers[startingPlayerIndex];
        
        let leadingPlayers = [];
        if (state.currentRoundIndex > 0 || state.isGameOver) {
            const maxScore = leaderboard.length > 0 ? leaderboard[0].score : -Infinity;
            leadingPlayers = leaderboard.filter(p => p.score === maxScore).map(p => p.name);
        }
        
        state.activePlayers.forEach(player => {
            const isDealer = player === currentDealer;
            const isStarter = player === startingPlayer;
            const isLeading = leadingPlayers.includes(player);
            
            let headerText = player.substring(0, 10);
            if (isStarter) headerText = '▶ ' + headerText;
            if (isLeading) headerText += ' 👑';

            const th = createElement('th', { 
                className: `player-col ${isDealer ? 'dealer-col-header' : ''} ${isStarter ? 'starter-col-header' : ''}`,
                text: headerText
            });
            
            let tooltips = [];
            if (isDealer) tooltips.push("Geber");
            if (isStarter) tooltips.push("Kommt raus (Start)");
            if (isLeading) tooltips.push("Aktuell auf Platz 1");
            if (tooltips.length > 0) th.title = tooltips.join(" | ");

            this.elements.tableHeaderRow.appendChild(th);
        });

        this.elements.tableHeaderRow.appendChild(createElement('th', { className: 'status-col-header', text: '±' }));
    }

    _updateLeaderboardVisibility(state, leaderboard) {
        this.elements.leaderboardContainer.classList.toggle('hidden', !state.isGameOver);
        if (state.isGameOver) {
            this.renderLeaderboard(leaderboard);
        }
    }

    _updateInputButtonState(state, cards) {
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

    _renderTableBody(state) {
        this.elements.tableBody.innerHTML = '';

        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = createElement('tr');
            
            let totalBids = 0;
            let allBidsMade = true;
            let isRowIncomplete = false;

            const isPastBidPhase = index < state.currentRoundIndex || (index === state.currentRoundIndex && state.phase === 'stiche') || state.isGameOver;
            const isPastTricksPhase = index < state.currentRoundIndex || state.isGameOver;

            state.activePlayers.forEach(player => {
                const data = state.roundsData[index][player];
                if (data.ansage === null) allBidsMade = false;
                else totalBids += data.ansage;

                if (isPastBidPhase && data.ansage === null) isRowIncomplete = true;
                if (isPastTricksPhase && data.gemacht === null) isRowIncomplete = true;
            });

            if (isRowIncomplete) tr.classList.add('row-warning');
            else if (index === state.currentRoundIndex && !state.isGameOver) tr.style.backgroundColor = 'var(--color-highlight-row)';

            const editBtnHtml = (index <= state.currentRoundIndex || state.isGameOver) 
                ? `<button class="edit-btn" data-rindex="${index}">${getIcon('edit')}</button>` 
                : '';
            
            const tdRound = createElement('td', { className: 'round-cell', html: `<div class="round-cell-content"><span>${cardCount}</span>${editBtnHtml}</div>` });
            tr.appendChild(tdRound);

            state.activePlayers.forEach(player => {
                const data = state.roundsData[index][player];
                const bidStr = data.ansage ?? '-';
                const wonStr = data.gemacht ?? '-';
                const scoreStr = data.gemacht !== null ? data.gesamtPunkte : '-';
                const scoreColor = data.punkte < 0 ? 'var(--color-danger)' : 'inherit';

                const td = createElement('td', { 
                    className: 'player-col',
                    html: `<div class="cell-data"><span class="cell-stats">${bidStr} / ${wonStr}</span><span class="cell-score" style="color: ${scoreColor}">${scoreStr}</span></div>`
                });
                tr.appendChild(td);
            });

            let statusHtml = '';
            if (isRowIncomplete) {
                statusHtml = `<span class="status-badge warning" title="Unvollständig">${getIcon('warning')}</span>`;
            } else if (allBidsMade) {
                if (totalBids === cardCount) {
                    statusHtml = `<span class="status-badge success">${getIcon('check')}</span>`;
                } else {
                    if (totalBids > cardCount) statusHtml = `<span class="status-badge danger">${getIcon('cross')}</span>`;
                    else statusHtml = `<span class="status-badge accent">${getIcon('dash')}</span>`;
                    
                    // Automatically add the top and bottom numbers dynamically
                    const diff = totalBids - cardCount;
                    const sign = diff > 0 ? '+' : '';
                    
                    let diffClass = '';
                    if (diff > 0) diffClass = 'status-value-positive';
                    else if (diff < 0) diffClass = 'status-value-negative';

                    statusHtml += `<span class="status-value-top">${totalBids}</span>`;
                    statusHtml += `<span class="status-value-bottom ${diffClass}">${sign}${diff}</span>`;
                }
            }
            
            tr.appendChild(createElement('td', { className: 'status-cell', html: statusHtml }));
            this.elements.tableBody.appendChild(tr);
        });

        this.elements.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rIndex = parseInt(e.currentTarget.dataset.rindex);
                this.eventBus.emit(EVENTS.GAME_TRIGGER_EDIT, rIndex);
            });
        });
    }

    renderLeaderboard(leaderboard) {
        this.elements.leaderboardList.innerHTML = generateLeaderboardHtml(leaderboard, ' Pkt');
    }

    startPenultimateRoundBlinking() { document.body.classList.add('penultimate-round-warning'); }
    stopPenultimateRoundBlinking() { document.body.classList.remove('penultimate-round-warning'); }
}