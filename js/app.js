/**
 * ===========================================================================
 * SMART CARD COUNTER - PWA LOGIC (Refactored & Enhanced)
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
    activePlayers: [], // Die Reihenfolge in diesem Array ist die Spielreihenfolge!
    
    currentRoundIndex: 0,
    phase: 'ansage', // 'ansage' | 'stiche'
    roundsData: [],

    // Modal & Edit State
    isEditMode: false,
    editRoundIndex: 0,
    editPhase: 'ansage',
    currentPlayerInputIndex: 0,

    initGameData() {
        this.currentRoundIndex = 0;
        this.phase = 'ansage';
        this.roundsData = [];
        
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
            // Optional: direkt aktivieren
            this.activePlayers.push(name);
        }
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
        // Läuft von der 1. Runde bis zur aktuellen durch und berechnet alles neu (Wichtig für Edits)
        for (let r = 0; r <= State.currentRoundIndex; r++) {
            const roundData = State.roundsData[r];
            
            State.activePlayers.forEach(player => {
                const pData = roundData[player];
                
                // Punkte nur berechnen, wenn beide Werte existieren
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
        cancelInputBtn: document.getElementById('cancel-input-btn')
    },

    renderSetup() {
        // 1. Pool rendern
        this.elements.playerPool.innerHTML = '';
        State.availablePlayers.forEach(player => {
            const chip = document.createElement('div');
            chip.className = `player-chip ${State.activePlayers.includes(player) ? 'selected' : ''}`;
            chip.innerText = player;
            chip.onclick = () => {
                State.togglePlayer(player);
                this.renderSetup();
            };
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
                
                const nameSpan = document.createElement('span');
                nameSpan.innerHTML = `<strong>${index + 1}.</strong> ${player}`;
                
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
                
                row.appendChild(nameSpan);
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

        // Header
        this.elements.tableHeaderRow.innerHTML = '<th>Rnd</th>';
        State.activePlayers.forEach(player => {
            const th = document.createElement('th');
            th.innerText = player.substring(0, 4); // Namen kürzen für schmales Display
            this.elements.tableHeaderRow.appendChild(th);
        });

        // Body
        this.elements.tableBody.innerHTML = '';
        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = document.createElement('tr');
            
            if (index === State.currentRoundIndex) {
                tr.style.backgroundColor = 'var(--color-highlight-row)';
            }

            const tdRound = document.createElement('td');
            tdRound.className = 'round-cell';
            
            // Edit-Button hinzufügen, falls Runde <= aktuell ist
            let editBtnHtml = '';
            if (index <= State.currentRoundIndex) {
                editBtnHtml = `<button class="edit-btn" onclick="Events.openEditModal(${index})">✏️</button>`;
            }
            
            tdRound.innerHTML = `
                <div class="round-cell-content">
                    <span>${cardCount}</span>
                    ${editBtnHtml}
                </div>
            `;
            tr.appendChild(tdRound);

            State.activePlayers.forEach(player => {
                const td = document.createElement('td');
                const data = State.roundsData[index][player];
                
                const ansageStr = data.ansage !== null ? data.ansage : '-';
                const gemachtStr = data.gemacht !== null ? data.gemacht : '-';
                const scoreStr = data.gemacht !== null ? data.gesamtPunkte : '-';
                const scoreColor = data.punkte < 0 ? 'var(--color-danger)' : 'inherit';

                // Kompaktere Darstellung
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
        
        // Indikatoren rendern (Punkte)
        this.elements.modalIndicators.innerHTML = State.activePlayers.map((p, idx) => {
            const val = phase === 'ansage' ? State.roundsData[rIndex][p].ansage : State.roundsData[rIndex][p].gemacht;
            const isFilled = val !== null;
            const isActive = idx === State.currentPlayerInputIndex;
            return `<div class="indicator-dot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}"></div>`;
        }).join('');

        // Buttons rendern
        this.elements.buttonGrid.innerHTML = '';
        const currentValue = phase === 'ansage' ? State.roundsData[rIndex][player].ansage : State.roundsData[rIndex][player].gemacht;

        for (let i = 0; i <= cards; i++) {
            const btn = document.createElement('button');
            btn.className = `number-btn ${currentValue === i ? 'selected' : ''}`;
            btn.innerText = i;
            btn.onclick = () => {
                GameLogic.setValue(i);
                
                // Springe automatisch zum nächsten, außer es ist der Letzte
                if (State.currentPlayerInputIndex < State.activePlayers.length - 1) {
                    State.currentPlayerInputIndex++;
                }
                this.renderModalContent();
            };
            this.elements.buttonGrid.appendChild(btn);
        }

        // Pfeile de-/aktivieren
        this.elements.modalPrevBtn.style.visibility = State.currentPlayerInputIndex > 0 ? 'visible' : 'hidden';
        this.elements.modalNextBtn.style.visibility = State.currentPlayerInputIndex < State.activePlayers.length - 1 ? 'visible' : 'hidden';

        // "Fertig" Button anzeigen, wenn alle Werte haben
        if (GameLogic.isPhaseComplete()) {
            this.elements.saveInputBtn.classList.remove('hidden');
        } else {
            this.elements.saveInputBtn.classList.add('hidden');
        }
    },

    switchScreen(toGame) {
        if (toGame) {
            this.elements.setupScreen.classList.add('hidden');
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.gameHeader.classList.remove('hidden');
        } else {
            this.elements.gameScreen.classList.add('hidden');
            this.elements.gameHeader.classList.add('hidden');
            this.elements.setupScreen.classList.remove('hidden');
        }
    }
};

// --- 4. EVENTS ---
const Events = {
    init() {
        UI.elements.addNewPlayerBtn.addEventListener('click', () => {
            const name = UI.elements.newPlayerInput.value.trim();
            if (name) {
                State.addPlayer(name);
                UI.elements.newPlayerInput.value = '';
                UI.renderSetup();
            }
        });

        UI.elements.startGameBtn.addEventListener('click', () => {
            State.initGameData();
            UI.switchScreen(true);
            UI.renderGameTable();
        });

        UI.elements.backToSetupBtn.addEventListener('click', () => {
            if (confirm("Wirklich zurück? Der aktuelle Spielstand geht verloren!")) {
                UI.switchScreen(false);
            }
        });

        UI.elements.openInputModalBtn.addEventListener('click', () => {
            State.isEditMode = false;
            // Finde den ersten Spieler, der noch keinen Wert hat
            let firstEmptyIdx = State.activePlayers.findIndex(p => {
                const val = State.phase === 'ansage' ? State.roundsData[State.currentRoundIndex][p].ansage : State.roundsData[State.currentRoundIndex][p].gemacht;
                return val === null;
            });
            State.currentPlayerInputIndex = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
            
            UI.renderModalContent();
            UI.elements.modal.classList.remove('hidden');
        });

        UI.elements.cancelInputBtn.addEventListener('click', () => {
            UI.elements.modal.classList.add('hidden');
            UI.renderGameTable(); // Rendert evt. teilweise eingegebene Daten
        });

        // Modal Pfeile
        UI.elements.modalPrevBtn.addEventListener('click', () => {
            if (State.currentPlayerInputIndex > 0) {
                State.currentPlayerInputIndex--;
                UI.renderModalContent();
            }
        });

        UI.elements.modalNextBtn.addEventListener('click', () => {
            if (State.currentPlayerInputIndex < State.activePlayers.length - 1) {
                State.currentPlayerInputIndex++;
                UI.renderModalContent();
            }
        });

        // "Fertig & Speichern" Button im Modal
        UI.elements.saveInputBtn.addEventListener('click', () => {
            UI.elements.modal.classList.add('hidden');
            
            if (State.isEditMode) {
                GameLogic.recalculateAllScores();
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
    },

    // Wird vom HTML (onclick) aufgerufen
    openEditModal(rIndex) {
        const roundData = State.roundsData[rIndex];
        const firstPlayer = State.activePlayers[0];
        const hasGemacht = roundData[firstPlayer].gemacht !== null;
        
        let phaseToEdit = 'ansage';
        // Wenn schon Stiche gemacht wurden, frage was geändert werden soll
        if (hasGemacht) {
            const choice = confirm("Was möchtest du ändern?\n\nOK = Ansagen\nAbbrechen = Gemachte Stiche");
            phaseToEdit = choice ? 'ansage' : 'stiche';
        }

        State.isEditMode = true;
        State.editRoundIndex = rIndex;
        State.editPhase = phaseToEdit;
        State.currentPlayerInputIndex = 0;
        
        UI.renderModalContent();
        UI.elements.modal.classList.remove('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UI.renderSetup();
    Events.init();
});