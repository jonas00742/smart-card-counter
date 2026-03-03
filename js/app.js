/**
 * ===========================================================================
 * SMART CARD COUNTER - PWA LOGIC
 * ===========================================================================
 */

// --- 1. CONFIGURATION ---
const CONFIG = {
    CARDS_SEQUENCE: [1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1],
    TOTAL_ROUNDS: 13,
    POINTS_BASE: 5
};

// --- 2. STATE MANAGEMENT ---
// Beinhaltet ausschließlich die Daten der App.
const State = {
    availablePlayers: ["Alex", "Bela", "Charlie", "Doro"],
    activePlayers: [],
    
    currentRoundIndex: 0,
    phase: 'ansage', // 'ansage' | 'stiche'
    currentPlayerInputIndex: 0,
    roundsData: [],

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
            this.activePlayers.push(name);
        }
    },

    removePlayer(player) {
        this.availablePlayers = this.availablePlayers.filter(p => p !== player);
        this.activePlayers = this.activePlayers.filter(p => p !== player);
    }
};

// --- 3. GAME LOGIC ---
// Behandelt Spielregeln, Punkteberechnung und Rundenübergänge.
const GameLogic = {
    processInput(value) {
        const player = State.activePlayers[State.currentPlayerInputIndex];
        const roundData = State.roundsData[State.currentRoundIndex];
        
        if (State.phase === 'ansage') {
            roundData[player].ansage = value;
        } else {
            roundData[player].gemacht = value;
        }

        State.currentPlayerInputIndex++;

        // Prüfen, ob alle Spieler für diese Phase getippt haben
        if (State.currentPlayerInputIndex >= State.activePlayers.length) {
            this.handlePhaseCompletion();
            return true; // Modal schließen
        }
        return false; // Modal offen lassen für nächsten Spieler
    },

    handlePhaseCompletion() {
        if (State.phase === 'ansage') {
            State.phase = 'stiche';
        } else {
            this.calculateScores();
            State.phase = 'ansage';
            State.currentRoundIndex++;
            
            if (State.currentRoundIndex >= CONFIG.TOTAL_ROUNDS) {
                alert("Spiel beendet! (Statistik-Screen kommt später)");
                State.currentRoundIndex = CONFIG.TOTAL_ROUNDS - 1; // Auf letzter Runde fixieren
                UI.elements.openInputModalBtn.classList.add('hidden');
            }
        }
    },

    calculateScores() {
        const rIndex = State.currentRoundIndex;
        const roundData = State.roundsData[rIndex];
        
        State.activePlayers.forEach(player => {
            const pData = roundData[player];
            
            if (pData.ansage === pData.gemacht) {
                pData.punkte = CONFIG.POINTS_BASE + pData.gemacht;
            } else {
                pData.punkte = -Math.abs(pData.ansage - pData.gemacht);
            }
            
            const prevTotal = rIndex === 0 ? 0 : State.roundsData[rIndex - 1][player].gesamtPunkte;
            pData.gesamtPunkte = prevTotal + pData.punkte;
        });
    }
};

// --- 4. UI & RENDERING ---
// Kümmert sich ausschließlich um das Updaten des DOMs basierend auf dem State.
const UI = {
    elements: {
        // Screens & Headers
        setupScreen: document.getElementById('setup-screen'),
        gameScreen: document.getElementById('game-screen'),
        setupHeader: document.getElementById('setup-header'),
        gameHeader: document.getElementById('game-header'),
        currentCardsSpan: document.getElementById('current-cards'),
        
        // Setup Elements
        playerPool: document.getElementById('available-players-container'),
        newPlayerInput: document.getElementById('new-player-name'),
        addNewPlayerBtn: document.getElementById('add-new-player-btn'),
        startGameBtn: document.getElementById('start-game-btn'),
        backToSetupBtn: document.getElementById('back-to-setup-btn'),
        
        // Table Elements
        tableHeaderRow: document.getElementById('table-header-row'),
        tableBody: document.getElementById('table-body'),
        openInputModalBtn: document.getElementById('open-input-modal-btn'),
        
        // Modal Elements
        modal: document.getElementById('input-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalSubtitle: document.getElementById('modal-subtitle'),
        buttonGrid: document.getElementById('dynamic-button-grid'),
        cancelInputBtn: document.getElementById('cancel-input-btn')
    },

    renderSetup() {
        this.elements.playerPool.innerHTML = '';
        
        State.availablePlayers.forEach(player => {
            const chip = document.createElement('div');
            chip.className = `player-chip ${State.activePlayers.includes(player) ? 'selected' : ''}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.innerText = player;
            nameSpan.onclick = () => {
                State.togglePlayer(player);
                this.renderSetup();
            };
            chip.appendChild(nameSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-player-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`${player} wirklich löschen?`)) {
                    State.removePlayer(player);
                    this.renderSetup();
                }
            };
            chip.appendChild(deleteBtn);
            
            this.elements.playerPool.appendChild(chip);
        });

        this.elements.startGameBtn.disabled = State.activePlayers.length < 2;
    },

    renderGameTable() {
        const cards = CONFIG.CARDS_SEQUENCE[State.currentRoundIndex];
        this.elements.currentCardsSpan.innerText = cards;
        
        this.elements.openInputModalBtn.innerText = State.phase === 'ansage' 
            ? `Ansagen eintragen (${cards} Karten)` 
            : `Stiche eintragen (${cards} Karten)`;

        // Render Header
        this.elements.tableHeaderRow.innerHTML = '<th>Karten</th>';
        State.activePlayers.forEach(player => {
            const th = document.createElement('th');
            th.innerText = player;
            this.elements.tableHeaderRow.appendChild(th);
        });

        // Render Body
        this.elements.tableBody.innerHTML = '';
        CONFIG.CARDS_SEQUENCE.forEach((cardCount, index) => {
            const tr = document.createElement('tr');
            
            if (index === State.currentRoundIndex) {
                tr.style.backgroundColor = 'var(--color-highlight-row)';
            }

            const tdRound = document.createElement('td');
            tdRound.className = 'round-cell';
            tdRound.innerText = cardCount;
            tr.appendChild(tdRound);

            State.activePlayers.forEach(player => {
                const td = document.createElement('td');
                const data = State.roundsData[index][player];
                
                const ansageStr = data.ansage !== null ? data.ansage : '-';
                const gemachtStr = data.gemacht !== null ? data.gemacht : '-';
                const showScore = data.gemacht !== null;
                const scoreStr = showScore ? data.gesamtPunkte : '-';
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
        const cards = CONFIG.CARDS_SEQUENCE[State.currentRoundIndex];
        
        this.elements.modalTitle.innerText = State.phase === 'ansage' ? 'Wie viele Stiche?' : 'Wie viele bekommen?';
        this.elements.modalSubtitle.innerText = `Spieler: ${player} (Karten: ${cards})`;
        
        this.elements.buttonGrid.innerHTML = '';
        for (let i = 0; i <= cards; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.innerText = i;
            btn.onclick = () => {
                const isPhaseComplete = GameLogic.processInput(i);
                if (isPhaseComplete) {
                    this.elements.modal.classList.add('hidden');
                    this.renderGameTable();
                } else {
                    this.renderModalContent(); // Refresh für nächsten Spieler
                }
            };
            this.elements.buttonGrid.appendChild(btn);
        }
    },

    switchScreen(toGame) {
        if (toGame) {
            this.elements.setupScreen.classList.add('hidden');
            this.elements.setupHeader.classList.add('hidden');
            this.elements.gameScreen.classList.remove('hidden');
            this.elements.gameHeader.classList.remove('hidden');
        } else {
            this.elements.gameScreen.classList.add('hidden');
            this.elements.gameHeader.classList.add('hidden');
            this.elements.setupScreen.classList.remove('hidden');
            this.elements.setupHeader.classList.remove('hidden');
            this.elements.openInputModalBtn.classList.remove('hidden');
        }
    }
};

// --- 5. EVENTS & INITIALIZATION ---
// Bündelt alle statischen Event-Listener und den Startpunkt.
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
            State.currentPlayerInputIndex = 0;
            UI.renderModalContent();
            UI.elements.modal.classList.remove('hidden');
        });

        UI.elements.cancelInputBtn.addEventListener('click', () => {
            UI.elements.modal.classList.add('hidden');
        });
    }
};

// --- APP START ---
document.addEventListener('DOMContentLoaded', () => {
    UI.renderSetup();
    Events.init();
});