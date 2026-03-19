import { createElement, bindBackdropClick } from '../utils/dom.js';
import { CONFIG } from '../config.js';

export class InputModal {
    constructor() {
        this.elements = {
            modal: document.getElementById('input-modal'),
            modalTitle: document.getElementById('modal-title'),
            modalSubtitle: document.getElementById('modal-subtitle'),
            modalPrevBtn: document.getElementById('modal-prev-btn'),
            modalNextBtn: document.getElementById('modal-next-btn'),
            modalIndicators: document.getElementById('modal-indicators'),
            buttonGrid: document.getElementById('dynamic-button-grid'),
            saveInputBtn: document.getElementById('save-input-btn'),
            cancelInputBtn: document.getElementById('cancel-input-btn'),
            resetInputBtn: document.getElementById('reset-input-btn')
        };
    }

    renderModalContent(state, isComplete) {
        const player = state.activePlayers[state.currentPlayerInputIndex];
        const rIndex = state.isEditMode ? state.editRoundIndex : state.currentRoundIndex;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const phase = state.isEditMode ? state.editPhase : state.phase;
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';

        this.elements.modal.classList.remove('phase-ansage', 'phase-stiche');
        this.elements.modal.classList.add(`phase-${phase}`);

        const titlePrefix = state.isEditMode ? "Ändern: " : "";
        this.elements.modalTitle.innerText = `${titlePrefix}Stiche ${phase === 'ansage' ? 'ansagen' : 'gemacht'}?`;
        this.elements.modalSubtitle.innerText = player;

        this.elements.modalIndicators.innerHTML = state.activePlayers.map((p, idx) => {
            const val = state.roundsData[rIndex][p][key];
            return `<div class="indicator-dot ${val !== null ? 'filled' : ''} ${idx === state.currentPlayerInputIndex ? 'active' : ''}"></div>`;
        }).join('');

        this.elements.buttonGrid.innerHTML = '';
        const currentValue = state.roundsData[rIndex][player][key];
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
                if (i === ansageValue) extraClass = ' target-bid';
                else extraClass = ' non-target';
            }

            const btn = createElement('button', {
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
            this.elements.resetInputBtn.classList.toggle('hidden', phase !== 'stiche');
            if (phase === 'stiche') {
                const hasAnyInput = state.activePlayers.some(p => state.roundsData[rIndex][p].gemacht !== null);
                this.elements.resetInputBtn.disabled = !hasAnyInput;
            }
        }

        this.elements.saveInputBtn.classList.toggle('hidden', !isComplete);
    }

    bindModalCancel(handler) {
        this.elements.cancelInputBtn.addEventListener('click', handler);
        bindBackdropClick(this.elements.modal, handler);
    }
    bindModalPrev(handler) { this.elements.modalPrevBtn.addEventListener('click', handler); }
    bindModalNext(handler) { this.elements.modalNextBtn.addEventListener('click', handler); }
    bindNumberInput(handler) { this.onNumberInput = handler; }
    bindModalReset(handler) { if (this.elements.resetInputBtn) this.elements.resetInputBtn.addEventListener('click', handler); }
    bindModalSave(handler) { this.elements.saveInputBtn.addEventListener('click', handler); }
}