import { createElement, bindBackdropClick, generateLeaderboardHtml } from '../utils/dom.js';
import { EVENTS } from '../core/events.js';

export class FeedbackModals {
    constructor(eventBus) {
        this.eventBus = eventBus;
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

        this.elements.cancelEditChoiceBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.EDIT_CHOICE_CLOSE));
        bindBackdropClick(this.elements.editChoiceModal, () => this.eventBus.emit(EVENTS.EDIT_CHOICE_CLOSE));

        this.elements.editAnsageBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.EDIT_CHOICE_SELECT, 'ansage'));
        this.elements.editGemachtBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.EDIT_CHOICE_SELECT, 'stiche'));

        this.elements.closeGameOverBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.GAME_OVER_CLOSE));
        bindBackdropClick(this.elements.gameOverModal, () => this.eventBus.emit(EVENTS.GAME_OVER_CLOSE));

        this.elements.confirmBackAcceptBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.CONFIRM_BACK_ACCEPT));
        
        this.elements.confirmBackCancelBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.CONFIRM_BACK_CANCEL));
        bindBackdropClick(this.elements.confirmBackModal, () => this.eventBus.emit(EVENTS.CONFIRM_BACK_CANCEL));

        this.elements.fabInterimBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.TOGGLE_INTERIM));
    }

    showGameOver(leaderboard) {
        this.elements.gameOverModal.classList.remove('hidden');
        this.elements.podiumContainer.innerHTML = '';
        
        const podiumOrder = [];
        const rank2 = leaderboard.filter(p => p.rank === 2);
        const rank1 = leaderboard.filter(p => p.rank === 1);
        const rank3 = leaderboard.filter(p => p.rank === 3);

        rank2.forEach(item => podiumOrder.push({ ...item, place: 2 }));
        rank1.forEach(item => podiumOrder.push({ ...item, place: 1 }));
        rank3.forEach(item => podiumOrder.push({ ...item, place: 3 }));

        podiumOrder.forEach(item => {
            const step = createElement('div', { 
                className: `podium-step place-${item.place}`,
                html: `<div class="podium-name">${item.name}</div><div class="podium-score">${item.score} Pkt</div><div class="podium-block">${item.rank}</div>`
            });
            this.elements.podiumContainer.appendChild(step);
        });

        const oldLosers = this.elements.gameOverModal.querySelectorAll('.place-loser-wrapper');
        oldLosers.forEach(el => el.remove());

        if (leaderboard.length >= 4) {
            const worstRank = leaderboard[leaderboard.length - 1].rank;
            if (worstRank > 1) {
                const losers = leaderboard.filter(p => p.rank === worstRank);
                losers.forEach((loser, i) => {
                    const loserStep = createElement('div', {
                        className: `place-loser-wrapper`,
                        // Added a tiny delay multiplier so tied losers plop down one after another
                        html: `<div class="loser-crater" style="animation-delay: ${1.4 + i*0.1}s"></div>
                               <div class="podium-step place-loser" style="animation-delay: ${1.2 + i*0.1}s"><div class="podium-name">${loser.name}</div><div class="podium-score">${loser.score} Pkt</div><div class="podium-block">💩</div></div>`
                    });
                    this.elements.podiumContainer.insertAdjacentElement('afterend', loserStep);
                });
            }
        }
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
}