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

            // --- NEU: Elemente für Game Over & Leaderboard ---
            leaderboardContainer: document.getElementById('leaderboard-container'),
            leaderboardList: document.getElementById('leaderboard-list'),
            gameOverModal: document.getElementById('game-over-modal'),
            podiumContainer: document.getElementById('podium-container'),
            closeGameOverBtn: document.getElementById('close-game-over-btn')
        };
        
        this.draggedPlayerIndex = null;
    }

    renderSetup(state) {
        this.elements.playerPool.innerHTML = '';
        state.availablePlayers.forEach(player => {
            const chip = document.createElement('div');
            chip.className = `player-chip ${state.activePlayers.includes(player) ? 'selected' : ''}`;
            const nameSpan = document.createElement('span');
            nameSpan.innerText = player;
            nameSpan.onclick = () => this.onPlayerToggle(player);
            chip.appendChild(nameSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-player-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`${player} komplett entfernen?`)) this.onPlayerRemove(player);
            };
            chip.appendChild(deleteBtn);
            this.elements.playerPool.appendChild(chip);
        });

        this.elements.activePlayersList.innerHTML = '';
        if (state.activePlayers.length === 0) {
            this.elements.activePlayersList.innerHTML = '<p class="subtitle text-sm">Noch keine Spieler gewählt.</p>';
        } else {
            state.activePlayers.forEach((player, index) => {
                const row = document.createElement('div');
                row.className = 'active-player-row';
                this.setupDragEvents(row, index);

                const leftSide = document.createElement('div');
                leftSide.className = 'player-row-left';
                leftSide.innerHTML = `<div class="drag-handle"></div><span><strong>${index + 1}.</strong> ${player}</span>`;
                
                const centerSide = document.createElement('div');
                centerSide.className = 'player-row-center';
                const isDealer = index === state.startingDealerIndex;
                const dealerBtn = document.createElement('button');
                dealerBtn.className = `dealer-btn ${isDealer ? 'active' : ''}`;
                dealerBtn.innerHTML = isDealer ? '🃏 Geber' : 'Geber?';
                dealerBtn.onclick = () => this.onSetDealer(index);
                centerSide.appendChild(dealerBtn);
                
                const controls = document.createElement('div');
                controls.className = 'order-controls';
                
                const upBtn = document.createElement('button');
                upBtn.innerHTML = '↑';
                upBtn.disabled = index === 0;
                upBtn.onclick = () => this.onPlayerMove(index, 'up');
                
                const downBtn = document.createElement('button');
                downBtn.innerHTML = '↓';
                downBtn.disabled = index === state.activePlayers.length - 1;
                downBtn.onclick = () => this.onPlayerMove(index, 'down');

                controls.appendChild(upBtn);
                controls.appendChild(downBtn);
                
                row.appendChild(leftSide);
                row.appendChild(centerSide); 
                row.appendChild(controls);
                this.elements.activePlayersList.appendChild(row);
            });
        }
        this.elements.startGameBtn.disabled = state.activePlayers.length < 2;
    }

    // --- GEÄNDERT: Nimmt nun auch das Leaderboard entgegen ---
    renderGameTable(state, leaderboard = []) {
        const cards = CONFIG.CARDS_SEQUENCE[state.currentRoundIndex];
        this.elements.currentCardsSpan.innerText = cards;
        this.elements.openInputModalBtn.innerText = state.phase === 'ansage' ? `Eingabe starten (${cards} Karten)` : `Stiche eintragen (${cards} Karten)`;

        // Toggle Game Over View Elements
        if (state.isGameOver) {
            this.elements.openInputModalBtn.classList.add('hidden');
            this.elements.leaderboardContainer.classList.remove('hidden');
            this.renderLeaderboard(leaderboard);
        } else {
            this.elements.openInputModalBtn.classList.remove('hidden');
            this.elements.leaderboardContainer.classList.add('hidden');
        }

        while (this.elements.tableHeaderRow.children.length > 1) {
            this.elements.tableHeaderRow.removeChild(this.elements.tableHeaderRow.lastChild);
        }

        const numPlayers = state.activePlayers.length;
        let currentDealerIndex = 0;
        if (numPlayers > 0) currentDealerIndex = (state.startingDealerIndex + state.currentRoundIndex) % numPlayers;
        const currentDealer = state.activePlayers[currentDealerIndex];
        
        state.activePlayers.forEach(player => {
            const th = document.createElement('th');
            th.className = 'player-col'; 
            if (player === currentDealer) {
                th.innerText = player.substring(0, 4);
                th.classList.add('dealer-col-header');
            } else {
                th.innerText = player.substring(0, 4);
            }
            this.elements.tableHeaderRow.appendChild(th);
        });

        const thStatus = document.createElement('th');
        thStatus.className = 'narrow-col';
        thStatus.innerText = '±'; 
        this.elements.tableHeaderRow.appendChild(thStatus);

        this.elements.tableBody.innerHTML = '';
        const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`;

        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = document.createElement('tr');
            if (index === state.currentRoundIndex && !state.isGameOver) tr.style.backgroundColor = 'var(--color-highlight-row)';

            const tdRound = document.createElement('td');
            tdRound.className = 'round-cell';
            
            // In Game Over Mode (or past rounds), allow editing
            let editBtnHtml = (index <= state.currentRoundIndex || state.isGameOver) 
                ? `<button class="edit-btn" data-rindex="${index}">${svgIcon}</button>` 
                : '';
            
            tdRound.innerHTML = `<div class="round-cell-content"><span>${cardCount}</span>${editBtnHtml}</div>`;
            tr.appendChild(tdRound);

            let sumAnsage = 0;
            let allAnsagenMade = true;

            state.activePlayers.forEach(player => {
                const td = document.createElement('td');
                td.className = 'player-col'; 
                const data = state.roundsData[index][player];
                
                if (data.ansage === null) allAnsagenMade = false;
                else sumAnsage += data.ansage;

                const ansageStr = data.ansage !== null ? data.ansage : '-';
                const gemachtStr = data.gemacht !== null ? data.gemacht : '-';
                const scoreStr = data.gemacht !== null ? data.gesamtPunkte : '-';
                const scoreColor = data.punkte < 0 ? 'var(--color-danger)' : 'inherit';

                td.innerHTML = `
                    <div class="cell-data">
                        <span class="cell-stats">${ansageStr} / ${gemachtStr}</span>
                        <span class="cell-score" style="color: ${scoreColor}">${scoreStr}</span>
                    </div>
                `;
                tr.appendChild(td);
            });

            const tdStatus = document.createElement('td');
            tdStatus.className = 'status-cell';

            if (allAnsagenMade) {
                if (sumAnsage === cardCount) tdStatus.innerHTML = '<span class="status-badge success">✓</span>';
                else if (sumAnsage > cardCount) tdStatus.innerHTML = '<span class="status-badge danger">+</span>';
                else tdStatus.innerHTML = '<span class="status-badge danger">-</span>';
            } else tdStatus.innerHTML = '';
            
            tr.appendChild(tdStatus);
            this.elements.tableBody.appendChild(tr);
        });

        this.elements.tableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rIndex = parseInt(e.currentTarget.dataset.rindex);
                this.onRowEditTriggered(rIndex);
            });
        });
    }

    // --- NEU: Leaderboard unter Tabelle ---
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

    // --- NEU: Podest Modal ---
    showGameOver(leaderboard) {
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.podiumContainer.innerHTML = '';
        
        // Reihenfolge für Podest-Ansicht umbauen: Platz 2, Platz 1, Platz 3
        const podiumOrder = [];
        if (leaderboard.length > 1) podiumOrder.push({ ...leaderboard[1], place: 2 });
        if (leaderboard.length > 0) podiumOrder.push({ ...leaderboard[0], place: 1 });
        if (leaderboard.length > 2) podiumOrder.push({ ...leaderboard[2], place: 3 });

        podiumOrder.forEach(item => {
            const step = document.createElement('div');
            step.className = `podium-step place-${item.place}`;
            step.innerHTML = `
                <div class="podium-name">${item.name}</div>
                <div class="podium-score">${item.score} Pkt</div>
                <div class="podium-block">${item.place}</div>
            `;
            this.elements.podiumContainer.appendChild(step);
        });
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
            const val = phase === 'ansage' ? state.roundsData[rIndex][p].ansage : state.roundsData[rIndex][p].gemacht;
            return `<div class="indicator-dot ${val !== null ? 'filled' : ''} ${idx === state.currentPlayerInputIndex ? 'active' : ''}"></div>`;
        }).join('');

        this.elements.buttonGrid.innerHTML = '';
        const currentValue = phase === 'ansage' ? state.roundsData[rIndex][player].ansage : state.roundsData[rIndex][player].gemacht;

        let maxButtons = cards;
        
        if (phase === 'stiche') {
            let sumOthers = 0;
            state.activePlayers.forEach(p => {
                if (p !== player) {
                    const val = state.roundsData[rIndex][p].gemacht;
                    if (val !== null) sumOthers += val;
                }
            });
            maxButtons = Math.max(0, cards - sumOthers); 
        }

        for (let i = 0; i <= maxButtons; i++) {
            const btn = document.createElement('button');
            btn.className = `number-btn ${currentValue === i ? 'selected' : ''}`;
            btn.innerText = i;
            btn.onclick = () => this.onNumberInput(i);
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

    setupDragEvents(row, index) {
        row.addEventListener('touchstart', (e) => {
            if (!e.target.classList.contains('drag-handle')) return;
            this.draggedPlayerIndex = index;
            row.classList.add('dragging');
        }, {passive: true});
        row.addEventListener('touchmove', (e) => {
            if (this.draggedPlayerIndex === null) return;
            e.preventDefault();
            const touch = e.touches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!targetElement) return;
            const targetRow = targetElement.closest('.active-player-row');
            if (targetRow && targetRow !== row) {
                const allRows = Array.from(this.elements.activePlayersList.children);
                const targetIndex = allRows.indexOf(targetRow);
                const currentIndex = allRows.indexOf(row);
                if (targetIndex > currentIndex) targetRow.after(row);
                else targetRow.before(row);
            }
        }, {passive: false});
        row.addEventListener('touchend', () => {
            if (this.draggedPlayerIndex !== null) {
                row.classList.remove('dragging');
                const newOrder = Array.from(this.elements.activePlayersList.children).map(r => r.querySelector('.player-row-left span').innerText.replace(/^\d+\.\s*/, '').trim());
                this.draggedPlayerIndex = null;
                this.onPlayerReorder(newOrder); 
            }
        });
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

    bindSwipeBack(handler) {
        let touchstartX = 0;
        this.elements.gameScreen.addEventListener('touchstart', e => touchstartX = e.changedTouches[0].screenX, {passive: true});
        this.elements.gameScreen.addEventListener('touchend', e => {
            if (e.changedTouches[0].screenX - touchstartX > 100) handler();
        }, {passive: true});
    }

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
}