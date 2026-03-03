/**
 * ===========================================================================
 * SMART CARD COUNTER - PWA LOGIC
 * ===========================================================================
 */

const CONFIG = {
    CARDS_SEQUENCE: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1],
    TOTAL_ROUNDS: 13,
    POINTS_BASE: 5
};

// --- 1. STATE MANAGEMENT ---
const State = {
    availablePlayers: ["Alex", "Bela", "Charlie", "Doro"],
    activePlayers: [],
    
    currentRoundIndex: 0,
    phase: 'ansage', 
    roundsData: [],

    // Edit Logik
    globalEditMode: false,
    isEditMode: false,
    editRoundIndex: 0,
    editPhase: 'ansage',
    currentPlayerInputIndex: 0,

    // Drag & Drop Status
    draggedPlayerIndex: null,

    initGameData() {
        this.currentRoundIndex = 0;
        this.phase = 'ansage';
        this.roundsData = [];
        this.globalEditMode = false;
        
        for (let i = 0; i < CONFIG.TOTAL_ROUNDS; i++) {
            let roundObj = {};
            this.activePlayers.forEach(player => {
                roundObj[player] = { ansage: null, gemacht: null, punkte: 0, gesamtPunkte: 0 };
            });
            this.roundsData.push(roundObj);
        }
    },

    togglePlayer(player) {
        if (this.activePlayers.includes(player)) {
            this.activePlayers = this.activePlayers.filter(p => p !== player);
        } else {
            this.activePlayers.push(player);
        }
    },

    addPlayer(name) {
        if (name && !this.availablePlayers.includes(name)) {
            this.availablePlayers.push(name);
            this.activePlayers.push(name);
        }
    },

    removePlayer(player) {
        this.availablePlayers = this.availablePlayers.filter(p => p !== player);
        this.activePlayers = this.activePlayers.filter(p => p !== player);
    },

    movePlayer(index, direction) {
        if (direction === 'up' && index > 0) {
            const temp = this.activePlayers[index - 1];
            this.activePlayers[index - 1] = this.activePlayers[index];
            this.activePlayers[index] = temp;
        } else if (direction === 'down' && index < this.activePlayers.length - 1) {
            const temp = this.activePlayers[index + 1];
            this.activePlayers[index + 1] = this.activePlayers[index];
            this.activePlayers[index] = temp;
        }
    }
};

// --- 2. GAME LOGIC ---
const GameLogic = {
    setValue(value) {
        const player = State.activePlayers[State.currentPlayerInputIndex];
        const rIndex = State.isEditMode ? State.editRoundIndex : State.currentRoundIndex;
        const phase = State.isEditMode ? State.editPhase : State.phase;
        
        if (phase === 'ansage') {
            State.roundsData[rIndex][player].ansage = value;
        } else {
            State.roundsData[rIndex][player].gemacht = value;
        }
    },

    isPhaseComplete() {
        const rIndex = State.isEditMode ? State.editRoundIndex : State.currentRoundIndex;
        const phase = State.isEditMode ? State.editPhase : State.phase;
        
        return State.activePlayers.every(player => {
            const val = phase === 'ansage' ? State.roundsData[rIndex][player].ansage : State.roundsData[rIndex][player].gemacht;
            return val !== null;
        });
    },

    recalculateAllScores() {
        for (let r = 0; r <= State.currentRoundIndex; r++) {
            const roundData = State.roundsData[r];
            
            State.activePlayers.forEach(player => {
                const pData = roundData[player];
                if (pData.gemacht !== null && pData.ansage !== null) {
                    if (pData.ansage === pData.gemacht) {
                        pData.punkte = CONFIG.POINTS_BASE + pData.gemacht;
                    } else {
                        pData.punkte = -Math.abs(pData.ansage - pData.gemacht);
                    }
                } else {
                    pData.punkte = 0;
                }
                const prevTotal = r === 0 ? 0 : State.roundsData[r - 1][player].gesamtPunkte;
                pData.gesamtPunkte = prevTotal + pData.punkte;
            });
        }
    }
};

// --- 3. UI & RENDERING ---
const UI = {
    elements: {
        setupScreen: document.getElementById('setup-screen'),
        gameScreen: document.getElementById('game-screen'),
        setupHeader: document.getElementById('setup-header'),
        gameHeader: document.getElementById('game-header'),
        currentCardsSpan: document.getElementById('current-cards'),
        
        playerPool: document.getElementById('available-players-container'),
        activePlayersList: document.getElementById('active-players-container'),
        newPlayerInput: document.getElementById('new-player-name'),
        addNewPlayerBtn: document.getElementById('add-new-player-btn'),
        startGameBtn: document.getElementById('start-game-btn'),
        backToSetupBtn: document.getElementById('back-to-setup-btn'),
        
        scoreTable: document.getElementById('score-table'),
        tableHeaderRow: document.getElementById('table-header-row'),
        tableBody: document.getElementById('table-body'),
        openInputModalBtn: document.getElementById('open-input-modal-btn'),
        mainEditToggleBtn: document.getElementById('main-edit-toggle-btn'),
        
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
        cancelEditChoiceBtn: document.getElementById('cancel-edit-choice-btn')
    },

    renderSetup() {
        // 1. Spieler-Pool rendern
        this.elements.playerPool.innerHTML = '';
        State.availablePlayers.forEach(player => {
            const chip = document.createElement('div');
            chip.className = `player-chip ${State.activePlayers.includes(player) ? 'selected' : ''}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.innerText = player;
            nameSpan.onclick = () => { State.togglePlayer(player); this.renderSetup(); };
            chip.appendChild(nameSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-player-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`${player} komplett entfernen?`)) {
                    State.removePlayer(player);
                    this.renderSetup();
                }
            };
            chip.appendChild(deleteBtn);
            this.elements.playerPool.appendChild(chip);
        });

        // 2. Aktive Spieler rendern (Reihenfolge)
        this.elements.activePlayersList.innerHTML = '';
        if (State.activePlayers.length === 0) {
            this.elements.activePlayersList.innerHTML = '<p class="subtitle">Noch keine Spieler gewählt.</p>';
        } else {
            State.activePlayers.forEach((player, index) => {
                const row = document.createElement('div');
                row.className = 'active-player-row';

                // --- MOBILE TOUCH DRAG & DROP LOGIK ---
                row.addEventListener('touchstart', (e) => {
                    if (!e.target.classList.contains('drag-handle')) return;
                    State.draggedPlayerIndex = index;
                    row.classList.add('dragging');
                }, {passive: true});

                row.addEventListener('touchmove', (e) => {
                    if (State.draggedPlayerIndex === null) return;
                    
                    // Verhindert Scrollen beim Ziehen
                    if (e.target.classList.contains('drag-handle')) {
                        e.preventDefault(); 
                    }
                    
                    const touch = e.touches[0];
                    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (!targetElement) return;

                    const targetRow = targetElement.closest('.active-player-row');
                    
                    if (targetRow && targetRow !== row) {
                        const allRows = Array.from(this.elements.activePlayersList.children);
                        const targetIndex = allRows.indexOf(targetRow);
                        const currentIndex = allRows.indexOf(row);

                        // DOM-Elemente visuell verschieben
                        if (targetIndex > currentIndex) {
                            targetRow.after(row);
                        } else {
                            targetRow.before(row);
                        }
                    }
                }, {passive: false});

                row.addEventListener('touchend', () => {
                    if (State.draggedPlayerIndex !== null) {
                        row.classList.remove('dragging');
                        
                        // Neue Reihenfolge aus dem DOM auslesen
                        const newOrder = Array.from(this.elements.activePlayersList.children).map(r => {
                            const text = r.querySelector('.player-row-left span').innerText;
                            return text.replace(/^\d+\.\s*/, '').trim(); // "1. Alex" -> "Alex"
                        });
                        
                        State.activePlayers = newOrder;
                        State.draggedPlayerIndex = null;
                        this.renderSetup(); // Neu rendern für saubere Zahlen
                    }
                });
                // --- ENDE DRAG & DROP ---

                const leftSide = document.createElement('div');
                leftSide.className = 'player-row-left';
                leftSide.innerHTML = `<div class="drag-handle"></div><span><strong>${index + 1}.</strong> ${player}</span>`;
                
                const controls = document.createElement('div');
                controls.className = 'order-controls';
                
                const upBtn = document.createElement('button');
                upBtn.innerHTML = '↑';
                upBtn.disabled = index === 0;
                upBtn.onclick = () => { State.movePlayer(index, 'up'); this.renderSetup(); };
                
                const downBtn = document.createElement('button');
                downBtn.innerHTML = '↓';
                downBtn.disabled = index === State.activePlayers.length - 1;
                downBtn.onclick = () => { State.movePlayer(index, 'down'); this.renderSetup(); };

                controls.appendChild(upBtn);
                controls.appendChild(downBtn);
                
                row.appendChild(leftSide);
                row.appendChild(controls);
                this.elements.activePlayersList.appendChild(row);
            });
        }

        this.elements.startGameBtn.disabled = State.activePlayers.length < 2;
    },

    renderGameTable() {
        const cards = CONFIG.CARDS_SEQUENCE[State.currentRoundIndex];
        this.elements.currentCardsSpan.innerText = cards;
        
        this.elements.openInputModalBtn.innerText = State.phase === 'ansage' 
            ? `Eingabe starten (${cards} Karten)` 
            : `Stiche eintragen (${cards} Karten)`;

        // Edit Mode Toggle UI
        if (State.globalEditMode) {
            this.elements.scoreTable.classList.add('edit-mode-active');
            this.elements.mainEditToggleBtn.classList.add('active');
        } else {
            this.elements.scoreTable.classList.remove('edit-mode-active');
            this.elements.mainEditToggleBtn.classList.remove('active');
        }

        // Header
        while (this.elements.tableHeaderRow.children.length > 1) {
            this.elements.tableHeaderRow.removeChild(this.elements.tableHeaderRow.lastChild);
        }
        State.activePlayers.forEach(player => {
            const th = document.createElement('th');
            th.innerText = player.substring(0, 4);
            this.elements.tableHeaderRow.appendChild(th);
        });

        // Body
        this.elements.tableBody.innerHTML = '';
        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = document.createElement('tr');
            if (index === State.currentRoundIndex) tr.style.backgroundColor = 'var(--color-highlight-row)';

            const tdRound = document.createElement('td');
            tdRound.className = 'round-cell';
            
            let editBtnHtml = index <= State.currentRoundIndex 
                ? `<button class="edit-btn" onclick="Events.triggerRowEdit(${index})">✏️</button>` 
                : '';
            
            tdRound.innerHTML = `<div class="round-cell-content"><span>${cardCount}</span>${editBtnHtml}</div>`;
            tr.appendChild(tdRound);

            State.activePlayers.forEach(player => {
                const td = document.createElement('td');
                const data = State.roundsData[index][player];
                
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
            this.elements.tableBody.appendChild(tr);
        });
    },

    renderModalContent() {
        const player = State.activePlayers[State.currentPlayerInputIndex];
        const rIndex = State.isEditMode ? State.editRoundIndex : State.currentRoundIndex;
        const phase = State.isEditMode ? State.editPhase : State.phase;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        
        let titlePrefix = State.isEditMode ? "Ändern: " : "";
        this.elements.modalTitle.innerText = phase === 'ansage' ? `${titlePrefix}Stiche ansagen?` : `${titlePrefix}Stiche gemacht?`;
        this.elements.modalSubtitle.innerText = player;
        
        this.elements.modalIndicators.innerHTML = State.activePlayers.map((p, idx) => {
            const val = phase === 'ansage' ? State.roundsData[rIndex][p].ansage : State.roundsData[rIndex][p].gemacht;
            return `<div class="indicator-dot ${val !== null ? 'filled' : ''} ${idx === State.currentPlayerInputIndex ? 'active' : ''}"></div>`;
        }).join('');

        this.elements.buttonGrid.innerHTML = '';
        const currentValue = phase === 'ansage' ? State.roundsData[rIndex][player].ansage : State.roundsData[rIndex][player].gemacht;

        for (let i = 0; i <= cards; i++) {
            const btn = document.createElement('button');
            btn.className = `number-btn ${currentValue === i ? 'selected' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                GameLogic.setValue(i);
                if (State.currentPlayerInputIndex < State.activePlayers.length - 1) {
                    State.currentPlayerInputIndex++;
                }
                this.renderModalContent();
            };
            this.elements.buttonGrid.appendChild(btn);
        }

        this.elements.modalPrevBtn.style.visibility = State.currentPlayerInputIndex > 0 ? 'visible' : 'hidden';
        this.elements.modalNextBtn.style.visibility = State.currentPlayerInputIndex < State.activePlayers.length - 1 ? 'visible' : 'hidden';

        if (GameLogic.isPhaseComplete()) {
            this.elements.saveInputBtn.classList.remove('hidden');
        } else {
            this.elements.saveInputBtn.classList.add('hidden');
        }
    },

switchScreen(toGame) {
        if (toGame) {
            // Screens umschalten
            this.elements.setupScreen.classList.add('hidden');
            this.elements.gameScreen.classList.remove('hidden');
            
            // Headers umschalten: Setup verstecken, Game anzeigen!
            this.elements.setupHeader.classList.add('hidden');
            this.elements.gameHeader.classList.remove('hidden');
        } else {
            // Screens umschalten
            this.elements.gameScreen.classList.add('hidden');
            this.elements.setupScreen.classList.remove('hidden');
            
            // Headers umschalten: Game verstecken, Setup anzeigen!
            this.elements.gameHeader.classList.add('hidden');
            this.elements.setupHeader.classList.remove('hidden');
        }
    }
};

// --- 4. EVENTS ---
const Events = {
    init() {
        // Setup Screen Events
        UI.elements.addNewPlayerBtn.addEventListener('click', () => {
            const name = UI.elements.newPlayerInput.value.trim();
            if (name) { State.addPlayer(name); UI.elements.newPlayerInput.value = ''; UI.renderSetup(); }
        });

        UI.elements.startGameBtn.addEventListener('click', () => {
            State.initGameData();
            UI.switchScreen(true);
            UI.renderGameTable();
        });

        UI.elements.backToSetupBtn.addEventListener('click', () => this.handleBackAction());

        // Swipe Gestures für "Zurück"
        let touchstartX = 0;
        let touchendX = 0;
        UI.elements.gameScreen.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, {passive: true});
        
        UI.elements.gameScreen.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            if (touchendX - touchstartX > 100) { // Wischen nach rechts
                this.handleBackAction();
            }
        }, {passive: true});

        // Edit Mode Toggle
        UI.elements.mainEditToggleBtn.addEventListener('click', () => {
            State.globalEditMode = !State.globalEditMode;
            UI.renderGameTable();
        });

        // Input Modal Events
        UI.elements.openInputModalBtn.addEventListener('click', () => {
            State.isEditMode = false;
            let firstEmptyIdx = State.activePlayers.findIndex(p => {
                const val = State.phase === 'ansage' ? State.roundsData[State.currentRoundIndex][p].ansage : State.roundsData[State.currentRoundIndex][p].gemacht;
                return val === null;
            });
            State.currentPlayerInputIndex = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
            UI.renderModalContent();
            UI.elements.modal.classList.remove('hidden');
        });

        // Schließen durch Klick außerhalb
        UI.elements.modal.addEventListener('click', (e) => {
            if (e.target === UI.elements.modal) {
                UI.elements.modal.classList.add('hidden');
                UI.renderGameTable();
            }
        });

        UI.elements.cancelInputBtn.addEventListener('click', () => {
            UI.elements.modal.classList.add('hidden');
            UI.renderGameTable();
        });

        UI.elements.modalPrevBtn.addEventListener('click', () => {
            if (State.currentPlayerInputIndex > 0) { State.currentPlayerInputIndex--; UI.renderModalContent(); }
        });

        UI.elements.modalNextBtn.addEventListener('click', () => {
            if (State.currentPlayerInputIndex < State.activePlayers.length - 1) { State.currentPlayerInputIndex++; UI.renderModalContent(); }
        });

        UI.elements.saveInputBtn.addEventListener('click', () => {
            UI.elements.modal.classList.add('hidden');
            
            if (State.isEditMode) {
                GameLogic.recalculateAllScores();
                State.globalEditMode = false; // Optional: Schließt Edit-Mode direkt danach
            } else {
                if (State.phase === 'ansage') {
                    State.phase = 'stiche';
                } else {
                    GameLogic.recalculateAllScores();
                    State.phase = 'ansage';
                    State.currentRoundIndex++;
                    
                    if (State.currentRoundIndex >= CONFIG.TOTAL_ROUNDS) {
                        alert("Spiel beendet!");
                        State.currentRoundIndex = CONFIG.TOTAL_ROUNDS - 1;
                        UI.elements.openInputModalBtn.classList.add('hidden');
                    }
                }
            }
            UI.renderGameTable();
        });

        // Edit Choice Modal Events
        UI.elements.editChoiceModal.addEventListener('click', (e) => {
            if (e.target === UI.elements.editChoiceModal) {
                UI.elements.editChoiceModal.classList.add('hidden');
            }
        });

        UI.elements.cancelEditChoiceBtn.addEventListener('click', () => {
            UI.elements.editChoiceModal.classList.add('hidden');
        });

        UI.elements.editAnsageBtn.addEventListener('click', () => {
            UI.elements.editChoiceModal.classList.add('hidden');
            this.startEditModal('ansage');
        });

        UI.elements.editGemachtBtn.addEventListener('click', () => {
            UI.elements.editChoiceModal.classList.add('hidden');
            this.startEditModal('stiche');
        });
    },

    handleBackAction() {
        if (!UI.elements.gameScreen.classList.contains('hidden')) {
            if (confirm("Wirklich zurück? Der aktuelle Spielstand geht verloren!")) {
                UI.switchScreen(false);
            }
        }
    },

    triggerRowEdit(rIndex) {
        const roundData = State.roundsData[rIndex];
        const firstPlayer = State.activePlayers[0];
        const hasGemacht = roundData[firstPlayer].gemacht !== null;
        
        State.editRoundIndex = rIndex;

        if (hasGemacht) {
            UI.elements.editChoiceModal.classList.remove('hidden');
        } else {
            this.startEditModal('ansage');
        }
    },

    startEditModal(phase) {
        State.isEditMode = true;
        State.editPhase = phase;
        State.currentPlayerInputIndex = 0;
        
        UI.renderModalContent();
        UI.elements.modal.classList.remove('hidden');
    }
};

// Startpunkt
document.addEventListener('DOMContentLoaded', () => {
    UI.renderSetup();
    Events.init();
});