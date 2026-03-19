import { createElement, getIcon, bindBackdropClick } from '../utils/dom.js';

export class SetupView {
    constructor() {
        this.elements = {
            playerPool: document.getElementById('available-players-container'),
            activePlayersList: document.getElementById('active-players-container'),
            newPlayerInput: document.getElementById('new-player-name'),
            addNewPlayerBtn: document.getElementById('add-new-player-btn'),
            installAppBtn: document.getElementById('install-app-btn'),
            startGameBtn: document.getElementById('start-game-btn'),
            
            deletePlayerModal: document.getElementById('delete-player-modal'),
            deletePlayerText: document.getElementById('delete-player-text'),
            confirmDeletePlayerBtn: document.getElementById('confirm-delete-player-btn'),
            cancelDeletePlayerBtn: document.getElementById('cancel-delete-player-btn')
        };
        
        this.playerToDelete = null;

        this.elements.cancelDeletePlayerBtn.addEventListener('click', () => this.hideDeletePlayerModal());
        bindBackdropClick(this.elements.deletePlayerModal, () => this.hideDeletePlayerModal());
    }

    renderSetup(state) {
        this.elements.playerPool.innerHTML = '';
        state.availablePlayers.forEach(player => {
            const chip = createElement('li', { className: `player-chip ${state.activePlayers.includes(player) ? 'selected' : ''}` },
                createElement('span', { text: player, events: { click: () => this.onPlayerToggle(player) } }),
                createElement('button', { 
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
                const row = createElement('li', { className: 'active-player-row' });
                
                const leftSide = createElement('div', { className: 'player-row-left' },
                    createElement('div', { className: 'drag-handle-btn', html: getIcon('drag') }),
                    createElement('span', { html: `<strong>${index + 1}.</strong> ${player}` })
                );
                
                const isDealer = index === state.startingDealerIndex;
                const rightSide = createElement('div', { className: 'player-row-right' },
                    createElement('button', {
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

    setupDragEvents(row) {
        const handle = row.querySelector('.drag-handle-btn');

        const handleDragStart = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            
            const rect = row.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            
            const container = this.elements.activePlayersList;
            const containerRect = container.getBoundingClientRect();

            const placeholder = document.createElement('li');
            placeholder.className = 'active-player-row placeholder';
            placeholder.style.height = `${rect.height}px`;
            
            row.style.width = `${rect.width}px`;
            row.style.height = `${rect.height}px`;
            row.style.position = 'fixed';
            row.style.top = `${rect.top}px`;
            row.style.left = `${rect.left}px`;
            row.style.zIndex = '1000';
            row.classList.add('dragging');

            row.parentNode.insertBefore(placeholder, row);

            const handleDragMove = (moveEvent) => {
                moveEvent.preventDefault();
                let currentTop = moveEvent.clientY - offsetY;

                if (currentTop < containerRect.top) currentTop = containerRect.top;
                if (currentTop > containerRect.bottom - rect.height) currentTop = containerRect.bottom - rect.height;

                row.style.top = `${currentTop}px`;
                
                const siblings = [...container.querySelectorAll('.active-player-row:not(.dragging):not(.placeholder)')];
                const nextSibling = siblings.reduce((closest, sibling) => {
                    const box = sibling.getBoundingClientRect();
                    const offset = moveEvent.clientY - box.top - box.height / 2;
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: sibling };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
                
                if (nextSibling) container.insertBefore(placeholder, nextSibling);
                else container.appendChild(placeholder);
            };
    
            const handleDragEnd = () => {
                document.removeEventListener('pointermove', handleDragMove);
                document.removeEventListener('pointerup', handleDragEnd);
                document.removeEventListener('pointercancel', handleDragEnd);

                if (placeholder.parentNode) {
                    placeholder.parentNode.insertBefore(row, placeholder);
                    placeholder.remove();
                }

                row.style.width = ''; row.style.height = ''; row.style.position = '';
                row.style.top = ''; row.style.left = ''; row.style.zIndex = '';
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

    showDeletePlayerModal(player) {
        this.playerToDelete = player;
        this.elements.deletePlayerText.innerText = `Möchtest du ${player} wirklich entfernen?`;
        this.elements.deletePlayerModal.classList.remove('hidden');
    }

    hideDeletePlayerModal() {
        this.elements.deletePlayerModal.classList.add('hidden');
        this.playerToDelete = null;
    }

    bindAddPlayer(handler) {
        this.elements.addNewPlayerBtn.addEventListener('click', () => {
            const name = this.elements.newPlayerInput.value.trim();
            if (name) { handler(name); this.elements.newPlayerInput.value = ''; }
        });
    }
    
    bindInstallApp(handler) { this.elements.installAppBtn.addEventListener('click', handler); }
    toggleInstallButton(show) { this.elements.installAppBtn.classList.toggle('hidden', !show); }
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
}