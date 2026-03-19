import { CONFIG } from './config.js';

export class GameView {
    constructor() {
        this.elements = {
            setupScreen: document.getElementById('setup-screen'),
            gameScreen: document.getElementById('game-screen'),
            setupHeader: document.getElementById('setup-header'),
            gameHeader: document.getElementById('game-header'),
            backToSetupBtn: document.getElementById('back-to-setup-btn'),
            currentCardsSpan: document.getElementById('current-cards'),
            
            playerPool: document.getElementById('available-players-container'),
            activePlayersList: document.getElementById('active-players-container'),
            newPlayerInput: document.getElementById('new-player-name'),
            addNewPlayerBtn: document.getElementById('add-new-player-btn'),
            installAppBtn: document.getElementById('install-app-btn'),
            startGameBtn: document.getElementById('start-game-btn'),
            
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
            resetInputBtn: document.getElementById('reset-input-btn'),

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
            confirmBackCancelBtn: document.getElementById('confirm-back-cancel-btn'),

            // Custom Delete & Validation Modals
            deletePlayerModal: document.getElementById('delete-player-modal'),
            deletePlayerText: document.getElementById('delete-player-text'),
            confirmDeletePlayerBtn: document.getElementById('confirm-delete-player-btn'),
            cancelDeletePlayerBtn: document.getElementById('cancel-delete-player-btn'),

            validationModal: document.getElementById('validation-modal'),
            validationText: document.getElementById('validation-text'),
            closeValidationBtn: document.getElementById('close-validation-btn'),

            // FAB & Interim Modal
            fabInterimBtn: document.getElementById('fab-interim-btn'),
            interimModal: document.getElementById('interim-modal'),
            interimList: document.getElementById('interim-list'),
            closeInterimBtn: document.getElementById('close-interim-btn')
        };
        
        this.playerToDelete = null;

        // Bind internal UI events (Cancel/Close buttons)
        this.elements.cancelDeletePlayerBtn.addEventListener('click', () => this.hideDeletePlayerModal());
        this._bindBackdropClick(this.elements.deletePlayerModal, () => this.hideDeletePlayerModal());
        this.elements.closeValidationBtn.addEventListener('click', () => this.hideValidationAlert());
        this._bindBackdropClick(this.elements.validationModal, () => this.hideValidationAlert());
        this.elements.closeInterimBtn.addEventListener('click', () => this.hideInterimModal());
        this._bindBackdropClick(this.elements.interimModal, () => this.hideInterimModal());

        // Initialize Back Button appearance
        this.elements.backToSetupBtn.textContent = '◀';
        this.elements.backToSetupBtn.classList.add('header-back-btn');
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

    _bindBackdropClick(modal, handler) {
        modal.addEventListener('click', (e) => { if (e.target === modal) handler(); });
    }

    _getIcon(type) {
        const icons = {
            drag: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
            edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
            check: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            cross: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
            dash: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
        };
        return icons[type] || '';
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
                        this.showDeletePlayerModal(player);
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
                
                const leftSide = this.createElement('div', { className: 'player-row-left' },
                    this.createElement('div', { className: 'drag-handle-btn', html: this._getIcon('drag') }),
                    this.createElement('span', { html: `<strong>${index + 1}.</strong> ${player}` })
                );
                
                const isDealer = index === state.startingDealerIndex;
                const rightSide = this.createElement('div', { className: 'player-row-right' },
                    this.createElement('button', {
                        type: 'button',
                        className: `dealer-btn ${isDealer ? 'active' : ''}`,
                        text: isDealer ? '🃏 Geber' : 'Geber',
                        events: { click: () => this.onSetDealer(index) }
                    })
                );
                
                row.appendChild(leftSide);
                row.appendChild(rightSide);
                this.setupDragEvents(row);
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
            this.elements.fabInterimBtn.classList.add('hidden');
            this.renderLeaderboard(leaderboard);
        } else {
            this.elements.openInputModalBtn.classList.remove('hidden');
            this.elements.leaderboardContainer.classList.add('hidden');
            this.elements.fabInterimBtn.classList.remove('hidden');
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
                text: player.substring(0, 10)
            });
            this.elements.tableHeaderRow.appendChild(th);
        });

        this.elements.tableHeaderRow.appendChild(this.createElement('th', { className: 'status-col-header', text: '±' }));

        this.elements.tableBody.innerHTML = '';

        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = this.createElement('tr');
            if (index === state.currentRoundIndex && !state.isGameOver) tr.style.backgroundColor = 'var(--color-highlight-row)';

            const editBtnHtml = (index <= state.currentRoundIndex || state.isGameOver) 
                ? `<button class="edit-btn" data-rindex="${index}">${this._getIcon('edit')}</button>` 
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
                if (sumAnsage === cardCount) statusHtml = `<span class="status-badge success">${this._getIcon('check')}</span>`;
                else if (sumAnsage > cardCount) statusHtml = `<span class="status-badge danger">${this._getIcon('cross')}</span>`;
                else statusHtml = `<span class="status-badge accent">${this._getIcon('dash')}</span>`;
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

    _generateLeaderboardHtml(leaderboard, suffix = '') {
        return leaderboard.map((item, index) => {
            let medal = `${index + 1}.`;
            if (index === 0) medal = '🥇';
            if (index === 1) medal = '🥈';
            if (index === 2) medal = '🥉';
            return `<li>
                <span class="rank-medal">${medal}</span> 
                <span class="rank-name">${item.name}</span> 
                <strong>${item.score}${suffix}</strong>
            </li>`;
        }).join('');
    }

    renderLeaderboard(leaderboard) {
        this.elements.leaderboardList.innerHTML = this._generateLeaderboardHtml(leaderboard, ' Pkt');
    }

    renderInterimModal(leaderboard) {
        this.elements.interimList.innerHTML = this._generateLeaderboardHtml(leaderboard);
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

    showDeletePlayerModal(player) {
        this.playerToDelete = player;
        this.elements.deletePlayerText.innerText = `Möchtest du ${player} wirklich entfernen?`;
        this.elements.deletePlayerModal.classList.remove('hidden');
    }

    hideDeletePlayerModal() {
        this.elements.deletePlayerModal.classList.add('hidden');
        this.playerToDelete = null;
    }

    showValidationAlert(message) {
        this.elements.validationText.innerText = message;
        this.elements.validationModal.classList.remove('hidden');
    }

    hideValidationAlert() {
        this.elements.validationModal.classList.add('hidden');
    }

    showInterimModal(leaderboard) {
        this.renderInterimModal(leaderboard);
        this.elements.interimModal.classList.remove('hidden');
        this.elements.fabInterimBtn.classList.add('hidden');
    }

    hideInterimModal() {
        this.elements.interimModal.classList.add('hidden');
        this.elements.fabInterimBtn.classList.remove('hidden');
    }

    renderModalContent(state, isComplete) {
        const player = state.activePlayers[state.currentPlayerInputIndex];
        const rIndex = state.isEditMode ? state.editRoundIndex : state.currentRoundIndex;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const phase = state.isEditMode ? state.editPhase : state.phase;

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
        const ansageValue = state.roundsData[rIndex][player].ansage;

        let maxButtons = cards;

        if (phase === 'stiche') {
            const sumOthers = state.activePlayers.reduce((sum, p) => {
                return p !== player ? sum + (state.roundsData[rIndex][p].gemacht || 0) : sum;
            }, 0);
            maxButtons = Math.max(0, cards - sumOthers); 
        }

        for (let i = 0; i <= maxButtons; i++) {
            let extraClass = '';
            if (phase === 'stiche') {
                // Highlight the button that matches the bid, others are neutral
                if (i === ansageValue) extraClass = ' target-bid';
                else extraClass = ' non-target';
            }

            const btn = this.createElement('button', {
                type: 'button',
                className: `number-btn${extraClass} ${currentValue === i ? 'selected' : ''}`,
                text: i,
                events: { click: () => this.onNumberInput(i) }
            });
            this.elements.buttonGrid.appendChild(btn);
        }

        this.elements.modalPrevBtn.style.visibility = state.currentPlayerInputIndex > 0 ? 'visible' : 'hidden';
        this.elements.modalNextBtn.style.visibility = state.currentPlayerInputIndex < state.activePlayers.length - 1 ? 'visible' : 'hidden';
        
        if (this.elements.resetInputBtn) {
            // Only show the reset button during the 'stiche' phase as requested
            if (phase === 'stiche') {
                this.elements.resetInputBtn.classList.remove('hidden');
                const hasAnyInput = state.activePlayers.some(p => state.roundsData[rIndex][p].gemacht !== null);
                this.elements.resetInputBtn.disabled = !hasAnyInput;
            } else {
                this.elements.resetInputBtn.classList.add('hidden');
            }
        }

        if (isComplete) this.elements.saveInputBtn.classList.remove('hidden');
        else this.elements.saveInputBtn.classList.add('hidden');
    }

    switchScreen(toGame) {
        if (toGame) {
            this.elements.setupScreen.classList.add('hidden');
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.setupHeader.classList.add('hidden');
            this.elements.gameHeader.classList.remove('hidden');
            this.elements.fabInterimBtn.classList.remove('hidden');
        } else {
            this.elements.gameScreen.classList.add('hidden');
            this.elements.setupScreen.classList.remove('hidden');
            this.elements.gameHeader.classList.add('hidden');
            this.elements.setupHeader.classList.remove('hidden');
            this.elements.fabInterimBtn.classList.add('hidden');
        }
    }

    // Refactored to use Pointer Events (Mouse + Touch support)
    setupDragEvents(row) {
        const handle = row.querySelector('.drag-handle-btn');

        const handleDragStart = (e) => {
            // Only allow main button (left click) or touch
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            
            e.preventDefault();
            
            // 1. Calculate offsets and dimensions
            const rect = row.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            
            const container = this.elements.activePlayersList;
            const containerRect = container.getBoundingClientRect();

            // 2. Create placeholder to hold the space
            const placeholder = document.createElement('li');
            placeholder.className = 'active-player-row placeholder';
            placeholder.style.height = `${rect.height}px`;
            
            // 3. Style the dragged row to float
            row.style.width = `${rect.width}px`;
            row.style.height = `${rect.height}px`;
            row.style.position = 'fixed';
            row.style.top = `${rect.top}px`;
            row.style.left = `${rect.left}px`;
            row.style.zIndex = '1000';
            row.classList.add('dragging');

            // 4. Insert placeholder where row currently is
            row.parentNode.insertBefore(placeholder, row);

            const handleDragMove = (moveEvent) => {
                moveEvent.preventDefault();
                
                // Move the floating row
                let currentTop = moveEvent.clientY - offsetY;

                // Constrain movement to container bounds
                if (currentTop < containerRect.top) currentTop = containerRect.top;
                if (currentTop > containerRect.bottom - rect.height) currentTop = containerRect.bottom - rect.height;

                row.style.top = `${currentTop}px`;
                
                // Find siblings (excluding the floating row and the placeholder itself)
                const siblings = [...container.querySelectorAll('.active-player-row:not(.dragging):not(.placeholder)')];
                
                // Find where to move the placeholder
                const nextSibling = siblings.reduce((closest, sibling) => {
                    const box = sibling.getBoundingClientRect();
                    const offset = moveEvent.clientY - box.top - box.height / 2;
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: sibling };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
                
                if (nextSibling) {
                    container.insertBefore(placeholder, nextSibling);
                } else {
                    container.appendChild(placeholder);
                }
            };
    
            const handleDragEnd = () => {
                document.removeEventListener('pointermove', handleDragMove);
                document.removeEventListener('pointerup', handleDragEnd);
                document.removeEventListener('pointercancel', handleDragEnd);

                // Swap placeholder with actual row
                if (placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(row, placeholder);
                    placeholder.remove();
                }

                // Reset row styles
                row.style.width = '';
                row.style.height = '';
                row.style.position = '';
                row.style.top = '';
                row.style.left = '';
                row.style.zIndex = '';
                row.classList.remove('dragging');

                const newOrder = Array.from(this.elements.activePlayersList.children).map(r => r.querySelector('.player-row-left span').innerText.replace(/^\d+\.\s*/, '').trim());
                this.onPlayerReorder(newOrder);
            };

            document.addEventListener('pointermove', handleDragMove);
            document.addEventListener('pointerup', handleDragEnd);
            document.addEventListener('pointercancel', handleDragEnd);
        };
    
        handle.addEventListener('pointerdown', handleDragStart);
    }

    startPenultimateRoundBlinking() {
        document.body.classList.add('penultimate-round-warning');
    }

    stopPenultimateRoundBlinking() {
        document.body.classList.remove('penultimate-round-warning');
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
    
    bindRemovePlayer(handler) { 
        this.elements.confirmDeletePlayerBtn.addEventListener('click', () => {
            if (this.playerToDelete) handler(this.playerToDelete);
            this.hideDeletePlayerModal();
        });
    }

    bindReorderPlayers(handler) { this.onPlayerReorder = handler; }
    bindSetDealer(handler) { this.onSetDealer = handler; }
    bindStartGame(handler) { this.elements.startGameBtn.addEventListener('click', handler); }

    bindOpenInputModal(handler) { this.elements.openInputModalBtn.addEventListener('click', handler); }
    bindGoBack(handler) { this.elements.backToSetupBtn.addEventListener('click', handler); }
    bindTriggerRowEdit(handler) { this.onRowEditTriggered = handler; }
    bindModalCancel(handler) {
        this.elements.cancelInputBtn.addEventListener('click', handler);
        this._bindBackdropClick(this.elements.modal, handler);
    }
    bindModalPrev(handler) { this.elements.modalPrevBtn.addEventListener('click', handler); }
    bindModalNext(handler) { this.elements.modalNextBtn.addEventListener('click', handler); }
    bindNumberInput(handler) { this.onNumberInput = handler; }
    bindModalReset(handler) { 
        if (this.elements.resetInputBtn) this.elements.resetInputBtn.addEventListener('click', handler); 
    }
    bindModalSave(handler) { this.elements.saveInputBtn.addEventListener('click', handler); }
    bindEditChoiceClose(handler) {
        this.elements.cancelEditChoiceBtn.addEventListener('click', handler);
        this._bindBackdropClick(this.elements.editChoiceModal, handler);
    }
    bindEditChoiceSelect(handler) {
        this.elements.editAnsageBtn.addEventListener('click', () => handler('ansage'));
        this.elements.editGemachtBtn.addEventListener('click', () => handler('stiche'));
    }
    bindCloseGameOver(handler) { 
        this.elements.closeGameOverBtn.addEventListener('click', handler); 
        this._bindBackdropClick(this.elements.gameOverModal, handler);
    }

    bindConfirmBackAccept(handler) { this.elements.confirmBackAcceptBtn.addEventListener('click', handler); }
    bindConfirmBackCancel(handler) { 
        this.elements.confirmBackCancelBtn.addEventListener('click', handler); 
        this._bindBackdropClick(this.elements.confirmBackModal, handler);
    }

    bindToggleInterim(handler) { this.elements.fabInterimBtn.addEventListener('click', handler); }
}