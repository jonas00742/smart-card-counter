import { createElement, bindBackdropClick, generateLeaderboardHtml } from '../utils/dom.js';

export class FeedbackModals {
    constructor() {
        this.elements = {
            editChoiceModal: document.getElementById('edit-choice-modal'),
            editAnsageBtn: document.getElementById('edit-ansage-btn'),
            editGemachtBtn: document.getElementById('edit-gemacht-btn'),
            cancelEditChoiceBtn: document.getElementById('cancel-edit-choice-btn'),

            gameOverModal: document.getElementById('game-over-modal'),
            podiumContainer: document.getElementById('podium-container'),
            closeGameOverBtn: document.getElementById('close-game-over-btn'),

            confirmBackModal: document.getElementById('confirm-back-modal'),
            confirmBackAcceptBtn: document.getElementById('confirm-back-accept-btn'),
            confirmBackCancelBtn: document.getElementById('confirm-back-cancel-btn'),

            validationModal: document.getElementById('validation-modal'),
            validationText: document.getElementById('validation-text'),
            closeValidationBtn: document.getElementById('close-validation-btn'),

            fabInterimBtn: document.getElementById('fab-interim-btn'),
            interimModal: document.getElementById('interim-modal'),
            interimList: document.getElementById('interim-list'),
            closeInterimBtn: document.getElementById('close-interim-btn')
        };

        this.elements.closeValidationBtn.addEventListener('click', () => this.hideValidationAlert());
        bindBackdropClick(this.elements.validationModal, () => this.hideValidationAlert());
        this.elements.closeInterimBtn.addEventListener('click', () => this.hideInterimModal());
        bindBackdropClick(this.elements.interimModal, () => this.hideInterimModal());
    }

    showGameOver(leaderboard) {
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.podiumContainer.innerHTML = '';
        
        const podiumOrder = [];
        if (leaderboard.length > 1) podiumOrder.push({ ...leaderboard[1], place: 2 });
        if (leaderboard.length > 0) podiumOrder.push({ ...leaderboard[0], place: 1 });
        if (leaderboard.length > 2) podiumOrder.push({ ...leaderboard[2], place: 3 });

        podiumOrder.forEach(item => {
            const step = createElement('div', { 
                className: `podium-step place-${item.place}`,
                html: `<div class="podium-name">${item.name}</div><div class="podium-score">${item.score} Pkt</div><div class="podium-block">${item.place}</div>`
            });
            this.elements.podiumContainer.appendChild(step);
        });
    }

    showConfirmBackModal() { this.elements.confirmBackModal.classList.remove('hidden'); }
    hideConfirmBackModal() { this.elements.confirmBackModal.classList.add('hidden'); }
    
    showValidationAlert(message) {
        this.elements.validationText.innerText = message;
        this.elements.validationModal.classList.remove('hidden');
    }
    hideValidationAlert() { this.elements.validationModal.classList.add('hidden'); }

    renderInterimModal(leaderboard) {
        this.elements.interimList.innerHTML = generateLeaderboardHtml(leaderboard);
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

    bindEditChoiceClose(handler) {
        this.elements.cancelEditChoiceBtn.addEventListener('click', handler);
        bindBackdropClick(this.elements.editChoiceModal, handler);
    }
    bindEditChoiceSelect(handler) {
        this.elements.editAnsageBtn.addEventListener('click', () => handler('ansage'));
        this.elements.editGemachtBtn.addEventListener('click', () => handler('stiche'));
    }
    bindCloseGameOver(handler) { 
        this.elements.closeGameOverBtn.addEventListener('click', handler); 
        bindBackdropClick(this.elements.gameOverModal, handler);
    }
    bindConfirmBackAccept(handler) { this.elements.confirmBackAcceptBtn.addEventListener('click', handler); }
    bindConfirmBackCancel(handler) { 
        this.elements.confirmBackCancelBtn.addEventListener('click', handler); 
        bindBackdropClick(this.elements.confirmBackModal, handler);
    }
    bindToggleInterim(handler) { this.elements.fabInterimBtn.addEventListener('click', handler); }
}