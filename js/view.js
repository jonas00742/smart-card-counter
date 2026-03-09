import { CONFIG } from './config.js';

export class GameView {
    constructor() {
        this.elements = {
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            setupHeader: document.getElementById('setup-header'),
            gameHeader: document.getElementById('game-header'),
            currentCardsSpan: document.getElementById('current-cards'),
            
            playerPool: document.getElementById('available-players-container'),
            activePlayersList: document.getElementById('active-players-container'),
            newPlayerInput: document.getElementById('new-player-name'),
            addNewPlayerBtn: document.getElementById('add-new-player-btn'),
            installAppBtn: document.getElementById('install-app-btn'),
            startGameBtn: document.getElementById('start-game-btn'),
            backToSetupBtn: document.getElementById('back-to-setup-btn'),
            
            scoreTable: document.getElementById('score-table'),
            tableHeaderRow: document.getElementById('table-header-row'),
            tableBody: document.getElementById('table-body'),
            openInputModalBtn: document.getElementById('open-input-modal-btn'),
            
            modal: document.getElementById('input-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalSubtitle: document.getElementById('modal-subtitle'),
            modalPrevBtn: document.getElementById('modal-prev-btn'),
            modalNextBtn: document.getElementById('modal-next-btn'),
            modalIndicators: document.getElementById('modal-indicators'),
            buttonGrid: document.getElementById('dynamic-button-grid'),
            saveInputBtn: document.getElementById('save-input-btn'),
            cancelInputBtn: document.getElementById('cancel-input-btn'),

            editChoiceModal: document.getElementById('edit-choice-modal'),
            editAnsageBtn: document.getElementById('edit-ansage-btn'),
            editGemachtBtn: document.getElementById('edit-gemacht-btn'),
            cancelEditChoiceBtn: document.getElementById('cancel-edit-choice-btn'),

            leaderboardContainer: document.getElementById('leaderboard-container'),
            leaderboardList: document.getElementById('leaderboard-list'),
            gameOverModal: document.getElementById('game-over-modal'),
            podiumContainer: document.getElementById('podium-container'),
            closeGameOverBtn: document.getElementById('close-game-over-btn'),

            // --- NEU: Confirm Back Modal Elemente ---
            confirmBackModal: document.getElementById('confirm-back-modal'),
            confirmBackAcceptBtn: document.getElementById('confirm-back-accept-btn'),
            confirmBackCancelBtn: document.getElementById('confirm-back-cancel-btn')
        };
        
        this.draggedPlayerIndex = null;
    }

    // Helper to create DOM elements cleanly
    createElement(tag, options = {}, ...children) {
        const el = document.createElement(tag);
        const { className, text, html, dataset, events, ...attrs } = options;
        
        if (className) el.className = className;
        if (text !== undefined && text !== null) el.textContent = text;
        if (html) el.innerHTML = html;
        if (dataset) Object.entries(dataset).forEach(([k, v]) => el.dataset[k] = v);
        if (events) Object.entries(events).forEach(([k, v]) => el.addEventListener(k, v));
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
        
        children.forEach(child => child && el.appendChild(child));
        return el;
    }

    renderSetup(state) {
        this.elements.playerPool.innerHTML = '';
        state.availablePlayers.forEach(player => {
            const chip = this.createElement('li', { className: `player-chip ${state.activePlayers.includes(player) ? 'selected' : ''}` },
                this.createElement('span', { text: player, events: { click: () => this.onPlayerToggle(player) } }),
                this.createElement('button', { 
                    type: 'button',
                    className: 'delete-player-btn',
                    html: '&times;',
                    events: { click: (e) => {
                        e.stopPropagation();
                        if (confirm(`${player} komplett entfernen?`)) this.onPlayerRemove(player);
                    }}
                })
            );
            this.elements.playerPool.appendChild(chip);
        });

        this.elements.activePlayersList.innerHTML = '';
        if (state.activePlayers.length === 0) {
            this.elements.activePlayersList.innerHTML = '<li><p class="subtitle text-sm">Noch keine Spieler gewählt.</p></li>';
        } else {
            state.activePlayers.forEach((player, index) => {
                const row = this.createElement('li', { className: 'active-player-row' });
                this.setupDragEvents(row, index);

                const leftSide = this.createElement('div', { className: 'player-row-left', html: `<div class="drag-handle"></div><span><strong>${index + 1}.</strong> ${player}</span>` });
                
                const isDealer = index === state.startingDealerIndex;
                const centerSide = this.createElement('div', { className: 'player-row-center' },
                    this.createElement('button', {
                        type: 'button',
                        className: `dealer-btn ${isDealer ? 'active' : ''}`,
                        text: isDealer ? '🃏 Geber' : 'Geber?',
                        events: { click: () => this.onSetDealer(index) }
                    })
                );
                
                const controls = this.createElement('div', { className: 'order-controls' },
                    this.createElement('button', { type: 'button', text: '↑', disabled: index === 0, events: { click: () => this.onPlayerMove(index, 'up') } }),
                    this.createElement('button', { type: 'button', text: '↓', disabled: index === state.activePlayers.length - 1, events: { click: () => this.onPlayerMove(index, 'down') } })
                );
                
                row.appendChild(leftSide);
                row.appendChild(centerSide); 
                row.appendChild(controls);
                this.elements.activePlayersList.appendChild(row);
            });
        }
        this.elements.startGameBtn.disabled = state.activePlayers.length < 2;
    }

    renderGameTable(state, leaderboard = []) {
        const cards = CONFIG.CARDS_SEQUENCE[state.currentRoundIndex];
        this.elements.currentCardsSpan.innerText = cards;
        this.elements.openInputModalBtn.innerText = state.phase === 'ansage' ? `Eingabe starten (${cards} Karten)` : `Stiche eintragen (${cards} Karten)`;

        if (state.isGameOver) {
            this.elements.openInputModalBtn.classList.add('hidden');
            this.elements.leaderboardContainer.classList.remove('hidden');
            this.renderLeaderboard(leaderboard);
        } else {
            this.elements.openInputModalBtn.classList.remove('hidden');
            this.elements.leaderboardContainer.classList.add('hidden');
        }

        // Clear header except first column
        Array.from(this.elements.tableHeaderRow.children).slice(1).forEach(el => el.remove());

        const numPlayers = state.activePlayers.length;
        const currentDealerIndex = numPlayers > 0 ? (state.startingDealerIndex + state.currentRoundIndex) % numPlayers : 0;
        const currentDealer = state.activePlayers[currentDealerIndex];
        
        state.activePlayers.forEach(player => {
            const isDealer = player === currentDealer;
            const th = this.createElement('th', { 
                className: `player-col ${isDealer ? 'dealer-col-header' : ''}`,
                text: player.substring(0, 4)
            });
            this.elements.tableHeaderRow.appendChild(th);
        });

        this.elements.tableHeaderRow.appendChild(this.createElement('th', { className: 'status-col-header', text: '±' }));

        this.elements.tableBody.innerHTML = '';
        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;

        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = this.createElement('tr');
            if (index === state.currentRoundIndex && !state.isGameOver) tr.style.backgroundColor = 'var(--color-highlight-row)';

            const editBtnHtml = (index <= state.currentRoundIndex || state.isGameOver) 
                ? `<button class="edit-btn" data-rindex="${index}">${svgIcon}</button>` 
                : '';
            
            const tdRound = this.createElement('td', { className: 'round-cell', html: `<div class="round-cell-content"><span>${cardCount}</span>${editBtnHtml}</div>` });
            tr.appendChild(tdRound);

            let sumAnsage = 0;
            let allAnsagenMade = true;

            state.activePlayers.forEach(player => {
                const data = state.roundsData[index][player];
                
                if (data.ansage === null) allAnsagenMade = false;
                else sumAnsage += data.ansage;

                const ansageStr = data.ansage !== null ? data.ansage : '-';
                const gemachtStr = data.gemacht !== null ? data.gemacht : '-';
                const scoreStr = data.gemacht !== null ? data.gesamtPunkte : '-';
                const scoreColor = data.punkte < 0 ? 'var(--color-danger)' : 'inherit';

                const td = this.createElement('td', { 
                    className: 'player-col',
                    html: `<div class="cell-data"><span class="cell-stats">${ansageStr} / ${gemachtStr}</span><span class="cell-score" style="color: ${scoreColor}">${scoreStr}</span></div>`
                });
                tr.appendChild(td);
            });

            let statusHtml = '';
            if (allAnsagenMade) {
                if (sumAnsage === cardCount) statusHtml = '<span class="status-badge success">✓</span>';
                else if (sumAnsage > cardCount) statusHtml = '<span class="status-badge danger">+</span>';
                else statusHtml = '<span class="status-badge danger">-</span>';
            }
            
            tr.appendChild(this.createElement('td', { className: 'status-cell', html: statusHtml }));
            this.elements.tableBody.appendChild(tr);
        });

        this.elements.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rIndex = parseInt(e.currentTarget.dataset.rindex);
                this.onRowEditTriggered(rIndex);
            });
        });
    }

    renderLeaderboard(leaderboard) {
        this.elements.leaderboardList.innerHTML = leaderboard.map((item, index) => {
            let medal = `${index + 1}.`;
            if (index === 0) medal = '🥇';
            if (index === 1) medal = '🥈';
            if (index === 2) medal = '🥉';
            return `<li>
                <span class="rank-medal">${medal}</span> 
                <span class="rank-name">${item.name}</span> 
                <strong>${item.score} Pkt</strong>
            </li>`;
        }).join('');
    }

    showGameOver(leaderboard) {
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.podiumContainer.innerHTML = '';
        
        const podiumOrder = [];
        if (leaderboard.length > 1) podiumOrder.push({ ...leaderboard[1], place: 2 });
        if (leaderboard.length > 0) podiumOrder.push({ ...leaderboard[0], place: 1 });
        if (leaderboard.length > 2) podiumOrder.push({ ...leaderboard[2], place: 3 });

        podiumOrder.forEach(item => {
            const step = this.createElement('div', { 
                className: `podium-step place-${item.place}`,
                html: `<div class="podium-name">${item.name}</div><div class="podium-score">${item.score} Pkt</div><div class="podium-block">${item.place}</div>`
            });
            this.elements.podiumContainer.appendChild(step);
        });
    }

    showConfirmBackModal() {
        this.elements.confirmBackModal.classList.remove('hidden');
    }

    hideConfirmBackModal() {
        this.elements.confirmBackModal.classList.add('hidden');
    }

    renderModalContent(state, isComplete) {
        const player = state.activePlayers[state.currentPlayerInputIndex];
        const rIndex = state.isEditMode ? state.editRoundIndex : state.currentRoundIndex;
        const phase = state.isEditMode ? state.editPhase : state.phase;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        
        this.elements.modal.classList.remove('phase-ansage', 'phase-stiche');
        this.elements.modal.classList.add(`phase-${phase}`);
        
        let titlePrefix = state.isEditMode ? "Ändern: " : "";
        this.elements.modalTitle.innerText = phase === 'ansage' ? `${titlePrefix}Stiche ansagen?` : `${titlePrefix}Stiche gemacht?`;
        this.elements.modalSubtitle.innerText = player;
        
        this.elements.modalIndicators.innerHTML = state.activePlayers.map((p, idx) => {
            const val = state.roundsData[rIndex][p][phase === 'ansage' ? 'ansage' : 'gemacht'];
            return `<div class="indicator-dot ${val !== null ? 'filled' : ''} ${idx === state.currentPlayerInputIndex ? 'active' : ''}"></div>`;
        }).join('');

        this.elements.buttonGrid.innerHTML = '';
        const currentValue = state.roundsData[rIndex][player][phase === 'ansage' ? 'ansage' : 'gemacht'];

        let maxButtons = cards;
        
        if (phase === 'stiche') {
            const sumOthers = state.activePlayers.reduce((sum, p) => {
                return p !== player ? sum + (state.roundsData[rIndex][p].gemacht || 0) : sum;
            }, 0);
            maxButtons = Math.max(0, cards - sumOthers); 
        }

        for (let i = 0; i <= maxButtons; i++) {
            const btn = this.createElement('button', {
                type: 'button',
                className: `number-btn ${currentValue === i ? 'selected' : ''}`,
                text: i,
                events: { click: () => this.onNumberInput(i) }
            });
            this.elements.buttonGrid.appendChild(btn);
        }

        this.elements.modalPrevBtn.style.visibility = state.currentPlayerInputIndex > 0 ? 'visible' : 'hidden';
        this.elements.modalNextBtn.style.visibility = state.currentPlayerInputIndex < state.activePlayers.length - 1 ? 'visible' : 'hidden';
        if (isComplete) this.elements.saveInputBtn.classList.remove('hidden');
        else this.elements.saveInputBtn.classList.add('hidden');
    }

    switchScreen(toGame) {
        if (toGame) {
            this.elements.setupScreen.classList.add('hidden');
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.setupHeader.classList.add('hidden');
            this.elements.gameHeader.classList.remove('hidden');
        } else {
            this.elements.gameScreen.classList.add('hidden');
            this.elements.setupScreen.classList.remove('hidden');
            this.elements.gameHeader.classList.add('hidden');
            this.elements.setupHeader.classList.remove('hidden');
        }
    }

    // Refactored to use Pointer Events (Mouse + Touch support)
    setupDragEvents(row, index) {
        const handleDragStart = (e) => {
            if (!e.target.classList.contains('drag-handle')) return;
            e.preventDefault(); // Prevent scrolling on touch
            this.draggedPlayerIndex = index;
            row.classList.add('dragging');
            row.setPointerCapture(e.pointerId);
        };

        const handleDragMove = (e) => {
            if (this.draggedPlayerIndex === null) return;
            e.preventDefault();
            
            const targetElement = document.elementFromPoint(e.clientX, e.clientY);
            if (!targetElement) return;
            
            const targetRow = targetElement.closest('.active-player-row');
            if (targetRow && targetRow !== row) {
                const allRows = Array.from(this.elements.activePlayersList.children);
                const targetIndex = allRows.indexOf(targetRow);
                const currentIndex = allRows.indexOf(row);
                if (targetIndex > currentIndex) targetRow.after(row);
                else targetRow.before(row);
            }
        };

        const handleDragEnd = (e) => {
            if (this.draggedPlayerIndex !== null) {
                row.classList.remove('dragging');
                row.releasePointerCapture(e.pointerId);
                const newOrder = Array.from(this.elements.activePlayersList.children).map(r => r.querySelector('.player-row-left span').innerText.replace(/^\d+\.\s*/, '').trim());
                this.draggedPlayerIndex = null;
                this.onPlayerReorder(newOrder); 
            }
        };

        row.addEventListener('pointerdown', handleDragStart);
        row.addEventListener('pointermove', handleDragMove);
        row.addEventListener('pointerup', handleDragEnd);
        row.addEventListener('pointercancel', handleDragEnd);
    }

    bindAddPlayer(handler) {
        this.elements.addNewPlayerBtn.addEventListener('click', () => {
            const name = this.elements.newPlayerInput.value.trim();
            if (name) { handler(name); this.elements.newPlayerInput.value = ''; }
        });
    }
    
    bindInstallApp(handler) { this.elements.installAppBtn.addEventListener('click', handler); }
    toggleInstallButton(show) { show ? this.elements.installAppBtn.classList.remove('hidden') : this.elements.installAppBtn.classList.add('hidden'); }
    bindTogglePlayer(handler) { this.onPlayerToggle = handler; }
    bindRemovePlayer(handler) { this.onPlayerRemove = handler; }
    bindMovePlayer(handler) { this.onPlayerMove = handler; }
    bindReorderPlayers(handler) { this.onPlayerReorder = handler; }
    bindSetDealer(handler) { this.onSetDealer = handler; }
    bindStartGame(handler) { this.elements.startGameBtn.addEventListener('click', handler); }
    bindBackToSetup(handler) { this.elements.backToSetupBtn.addEventListener('click', handler); }

    bindOpenInputModal(handler) { this.elements.openInputModalBtn.addEventListener('click', handler); }
    bindTriggerRowEdit(handler) { this.onRowEditTriggered = handler; }
    bindModalCancel(handler) {
        this.elements.cancelInputBtn.addEventListener('click', handler);
        this.elements.modal.addEventListener('click', (e) => { if (e.target === this.elements.modal) handler(); });
    }
    bindModalPrev(handler) { this.elements.modalPrevBtn.addEventListener('click', handler); }
    bindModalNext(handler) { this.elements.modalNextBtn.addEventListener('click', handler); }
    bindNumberInput(handler) { this.onNumberInput = handler; }
    bindModalSave(handler) { this.elements.saveInputBtn.addEventListener('click', handler); }
    bindEditChoiceClose(handler) {
        this.elements.cancelEditChoiceBtn.addEventListener('click', handler);
        this.elements.editChoiceModal.addEventListener('click', (e) => { if (e.target === this.elements.editChoiceModal) handler(); });
    }
    bindEditChoiceSelect(handler) {
        this.elements.editAnsageBtn.addEventListener('click', () => handler('ansage'));
        this.elements.editGemachtBtn.addEventListener('click', () => handler('stiche'));
    }
    bindCloseGameOver(handler) { this.elements.closeGameOverBtn.addEventListener('click', handler); }

    bindConfirmBackAccept(handler) { this.elements.confirmBackAcceptBtn.addEventListener('click', handler); }
    bindConfirmBackCancel(handler) { this.elements.confirmBackCancelBtn.addEventListener('click', handler); }
}