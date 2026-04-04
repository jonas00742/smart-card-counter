import { createElement, bindBackdropClick } from '../utils/dom.js';
import { EVENTS } from '../core/events.js';

export class InputModal {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this._cacheElements();
        this._bindEvents();
    }

    _cacheElements() {
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
    }

    _bindEvents() {
        this.elements.cancelInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_CANCEL));
        bindBackdropClick(this.elements.modal, () => this.eventBus.emit(EVENTS.MODAL_CANCEL));
        this.elements.modalPrevBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_PREV));
        this.elements.modalNextBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_NEXT));
        this.elements.resetInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_RESET));
        this.elements.saveInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_SAVE));
        this.elements.magicInputBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.MODAL_MAGIC_FILL));

        this.elements.buttonGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.number-btn');
            if (btn) {
                const val = parseInt(btn.dataset.value, 10);
                this.eventBus.emit(EVENTS.MODAL_NUMBER_INPUT, val);
            }
        });
    }

    renderModalContent(props) {
        const {
            player,
            phase,
            cards,
            currentValue,
            targetBidValue,
            isEditMode,
            indicators,
            isMagicPossible,
            isComplete,
            showPrev,
            showNext,
            hasAnyInput,
            maxButtons
        } = props;

        this.elements.modal.className = `modal ${phase === 'ansage' ? 'phase-bid' : 'phase-tricks'}`;
        this.elements.modalTitle.innerText = `${isEditMode ? "Ändern: " : ""}Stiche ${phase === 'ansage' ? 'ansagen' : 'gemacht'}?`;
        this.elements.modalSubtitle.innerText = player;

        this.elements.modalIndicators.innerHTML = indicators.map(dot => 
            `<div class="indicator-dot ${dot.isFilled ? 'filled' : ''} ${dot.isActive ? 'active' : ''}"></div>`
        ).join('');

        this._renderButtons(cards, phase, currentValue, targetBidValue, maxButtons);

        this.elements.magicInputBtn.classList.toggle('hidden', !isMagicPossible);
        this.elements.magicInputBtn.disabled = !isMagicPossible;

        this.elements.modalPrevBtn.style.visibility = showPrev ? 'visible' : 'hidden';
        this.elements.modalNextBtn.style.visibility = showNext ? 'visible' : 'hidden';
        
        this.elements.resetInputBtn.classList.toggle('hidden', phase !== 'stiche');
        this.elements.resetInputBtn.disabled = phase === 'stiche' && !hasAnyInput;

        this.elements.saveInputBtn.disabled = !isComplete;
    }

    _renderButtons(cards, phase, currentValue, targetBidValue, maxButtons) {
        // Ensure we only rebuild DOM if the number of cards changes
        if (this.elements.buttonGrid.children.length !== cards + 1) {
            this.elements.buttonGrid.innerHTML = '';
            for (let i = 0; i <= cards; i++) {
                this.elements.buttonGrid.appendChild(createElement('button', {
                    type: 'button',
                    className: 'number-btn',
                    text: i,
                    dataset: { value: i }
                }));
            }
        }

        // Efficiently update button classes
        Array.from(this.elements.buttonGrid.children).forEach((btn, i) => {
            btn.className = 'number-btn'; // Reset classes
            if (i > maxButtons) {
                btn.classList.add('hidden');
            } else {
                if (phase === 'stiche') {
                    if (i === targetBidValue) btn.classList.add('target-bid');
                    else btn.classList.add('non-target');
                }
                if (currentValue === i) {
                    btn.classList.add('selected');
                }
            }
        });
    }
}