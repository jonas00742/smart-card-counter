import { createElement, bindBackdropClick } from '../utils/dom.js';
import { CONFIG } from '../config.js';
import { EVENTS } from '../core/events.js';

export class InputModal {
    constructor(eventBus) {
        this.eventBus = eventBus;
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
            resetInputBtn: document.getElementById('reset-input-btn'),
            magicInputBtn: document.getElementById('magic-input-btn')
        };

        this.elements.cancelInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_CANCEL));
        bindBackdropClick(this.elements.modal, () => this.eventBus.emit(EVENTS.MODAL_CANCEL));
        this.elements.modalPrevBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_PREV));
        this.elements.modalNextBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_NEXT));
        if (this.elements.resetInputBtn) this.elements.resetInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_RESET));
        this.elements.saveInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_SAVE));
        if (this.elements.magicInputBtn) {
            this.elements.magicInputBtn.addEventListener('click', () => this.eventBus.emit('modal:magicFill'));
        }

        this.elements.buttonGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.number-btn');
            if (btn) {
                const val = parseInt(btn.dataset.value, 10);
                this.eventBus.emit(EVENTS.MODAL_NUMBER_INPUT, val);
            }
        });
    }

    renderModalContent(state, isComplete) {
        const player = state.activePlayers[state.currentPlayerInputIndex];
        const rIndex = state.isEditMode ? state.editRoundIndex : state.currentRoundIndex;
        const cards = CONFIG.CARDS_SEQUENCE[rIndex];
        const phase = state.isEditMode ? state.editPhase : state.phase;
        const key = phase === 'ansage' ? 'ansage' : 'gemacht';

        const phaseClass = phase === 'ansage' ? 'phase-bid' : 'phase-tricks';
        this.elements.modal.classList.remove('phase-bid', 'phase-tricks');
        this.elements.modal.classList.add(phaseClass);

        const titlePrefix = state.isEditMode ? "Ändern: " : "";
        this.elements.modalTitle.innerText = `${titlePrefix}Stiche ${phase === 'ansage' ? 'ansagen' : 'gemacht'}?`;
        this.elements.modalSubtitle.innerText = player;

        this.elements.modalIndicators.innerHTML = state.activePlayers.map((p, idx) => {
            const val = state.roundsData[rIndex][p][key];
            return `<div class="indicator-dot ${val !== null ? 'filled' : ''} ${idx === state.currentPlayerInputIndex ? 'active' : ''}"></div>`;
        }).join('');

        const currentValue = state.roundsData[rIndex][player][key];
        const targetBidValue = state.roundsData[rIndex][player].ansage;

        let maxButtons = cards;

        if (phase === 'stiche') {
            const sumOtherWon = state.activePlayers.reduce((sum, p) => {
                return p !== player ? sum + (state.roundsData[rIndex][p].gemacht || 0) : sum;
            }, 0);
            maxButtons = Math.max(0, cards - sumOtherWon); 
        }

        // Ensure we only rebuild DOM if round layout cards change
        if (this.elements.buttonGrid.children.length !== cards + 1) {
            this.elements.buttonGrid.innerHTML = '';
            for (let i = 0; i <= cards; i++) {
                const btn = createElement('button', {
                    type: 'button',
                    className: 'number-btn',
                    text: i,
                    dataset: { value: i }
                });
                this.elements.buttonGrid.appendChild(btn);
            }
        }

        // Loop through existing buttons and update classes efficiently
        Array.from(this.elements.buttonGrid.children).forEach((btn, i) => {
            btn.className = 'number-btn';
            if (i > maxButtons) btn.classList.add('hidden');
            else {
                if (phase === 'stiche') {
                    if (i === targetBidValue) btn.classList.add('target-bid');
                    else btn.classList.add('non-target');
                }
                if (currentValue === i) btn.classList.add('selected');
            }
        });

        if (this.elements.magicInputBtn) {
            if (phase === 'stiche') {
                let totalBids = 0;
                let isMagicPossible = true;
                let allFilled = true;
                
                state.activePlayers.forEach(p => {
                    const bid = state.roundsData[rIndex][p].ansage;
                    const wonTricks = state.roundsData[rIndex][p].gemacht;
                    if (bid !== null) totalBids += bid;
                    
                    if (wonTricks !== null) {
                        if (wonTricks !== bid) isMagicPossible = false;
                    } else {
                        allFilled = false;
                    }
                });

                const isMagicRound = totalBids === cards;
                this.elements.magicInputBtn.classList.toggle('hidden', !isMagicRound);
                this.elements.magicInputBtn.disabled = !isMagicPossible || allFilled;
            } else {
                this.elements.magicInputBtn.classList.add('hidden');
            }
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

        this.elements.saveInputBtn.disabled = !isComplete;
    }
}