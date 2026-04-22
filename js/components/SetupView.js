import { createElement, getIcon, bindBackdropClick, sanitizeHTML } from '../utils/dom.js';
import { EVENTS } from '../core/events.js';

export class SetupView {
    constructor(eventBus) {
        this.eventBus = eventBus;
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

        const handleAddPlayer = () => {
            const name = sanitizeHTML(this.elements.newPlayerInput.value.trim());
            if (name) { 
                this.eventBus.emit(EVENTS.SETUP_ADD_PLAYER, name); 
                this.elements.newPlayerInput.value = ''; 
            }
        };

        this.elements.addNewPlayerBtn.addEventListener('click', handleAddPlayer);

        this.elements.newPlayerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddPlayer();
            }
        });

        this.elements.installAppBtn.addEventListener('click', () => this.eventBus.emit(EVENTS.APP_INSTALL));
        this.elements.startGameBtn.addEventListener('click', () => {
            if (!this.isManualDealer && this.lastProps && this.lastProps.activePlayers.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.lastProps.activePlayers.length);
                this.eventBus.emit(EVENTS.SETUP_SET_DEALER, randomIndex);
            }
            this.eventBus.emit(EVENTS.SETUP_START_GAME);
        });
        this.elements.confirmDeletePlayerBtn.addEventListener('click', () => {
            if (this.playerToDelete) this.eventBus.emit(EVENTS.SETUP_REMOVE_PLAYER, this.playerToDelete);
            this.hideDeletePlayerModal();
        });

        this.isManualDealer = true;
        this.dealerCheckboxContainer = createElement('div', { className: 'dealer-checkbox-container' });
        this.elements.activePlayersList.parentNode.insertBefore(this.dealerCheckboxContainer, this.elements.activePlayersList);
        
        this.dealerCheckboxContainer.innerHTML = `
            <label class="custom-checkbox-wrapper">
                <div class="custom-checkbox">
                    <input type="checkbox" id="manual-dealer-checkbox" checked>
                    <span class="checkmark"></span>
                </div>
                <div class="checkbox-text-content">
                    <div class="checkbox-title">Geber auswählen</div>
                    <div class="checkbox-status text-sm text-muted" id="dealer-status-text"></div>
                </div>
            </label>
        `;
        this.elements.manualDealerCheckbox = this.dealerCheckboxContainer.querySelector('#manual-dealer-checkbox');
        this.elements.dealerStatusText = this.dealerCheckboxContainer.querySelector('#dealer-status-text');

        this.elements.manualDealerCheckbox.addEventListener('change', (e) => {
            this.isManualDealer = e.target.checked;
            if (this.lastProps) this.renderSetup(this.lastProps);
        });
    }

    renderSetup(props) {
        this.lastProps = props;
        const { availablePlayers, activePlayers, startingDealerIndex } = props;

        const currentDealer = activePlayers[startingDealerIndex];
        this.elements.dealerStatusText.innerText = this.isManualDealer 
            ? (currentDealer ? `${currentDealer} startet zu geben` : 'Noch kein Geber gewählt')
            : 'Geber wird zufällig gewählt';

        this.elements.playerPool.innerHTML = '';
        availablePlayers.forEach(player => {
            const chip = createElement('li', { className: `player-chip ${activePlayers.includes(player) ? 'selected' : ''}` },
                createElement('span', { text: player, events: { click: () => this.eventBus.emit(EVENTS.SETUP_TOGGLE_PLAYER, player) } }),
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
        if (activePlayers.length === 0) {
            this.elements.activePlayersList.innerHTML = '<li><p class="subtitle text-sm">Noch keine Spieler gewählt.</p></li>';
        } else {
            activePlayers.forEach((player, index) => {
                const row = createElement('li', { className: 'active-player-row' });
                
                const leftSide = createElement('div', { className: 'player-row-left' },
                    createElement('div', { className: 'drag-handle-btn', html: getIcon('drag') }),
                    createElement('span', { html: `<strong>${index + 1}.</strong> ${player}` })
                );
                
                const isDealer = index === startingDealerIndex;
                const rightSide = createElement('div', { className: 'player-row-right' });
                
                if (this.isManualDealer) {
                    rightSide.appendChild(createElement('button', {
                        type: 'button',
                        className: `dealer-btn ${isDealer ? 'active' : ''}`,
                        text: isDealer ? '🃏 Geber' : 'Geber',
                        events: { click: () => this.eventBus.emit(EVENTS.SETUP_SET_DEALER, index) }
                    }));
                }
                
                row.appendChild(leftSide);
                row.appendChild(rightSide);
                this.setupDragEvents(row);
                this.elements.activePlayersList.appendChild(row);
            });
        }
        this.elements.startGameBtn.disabled = activePlayers.length < 2;
    }

    setupDragEvents(row) {
        const handle = row.querySelector('.drag-handle-btn');

        const handleDragStart = (e) => {
            // Only allow left mouse button or touch interaction
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            e.preventDefault();
            
            // Set up dimensions and starting positions
            const rect = row.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            
            const container = this.elements.activePlayersList;
            const containerRect = container.getBoundingClientRect();

            // Create placeholder element to maintain space in the list
            const placeholder = document.createElement('li');
            placeholder.className = 'active-player-row placeholder';
            placeholder.style.height = `${rect.height}px`;
            
            // Style the dragged row for absolute positioning over the list
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

                // Constrain the dragging boundary vertically within the container
                if (currentTop < containerRect.top) currentTop = containerRect.top;
                if (currentTop > containerRect.bottom - rect.height) currentTop = containerRect.bottom - rect.height;

                row.style.top = `${currentTop}px`;
                
                // Determine the correct insertion point visually
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
                this.eventBus.emit(EVENTS.SETUP_REORDER_PLAYERS, newOrder);
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
    toggleInstallButton(show) { this.elements.installAppBtn.classList.toggle('hidden', !show); }
}