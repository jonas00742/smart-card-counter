export const ICONS = {
    drag: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>`,
    check: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    cross: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    dash: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`
};

export function getIcon(type) {
    return ICONS[type] || '';
}

export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

export function createElement(tag, options = {}, ...children) {
    const el = document.createElement(tag);
    const { className, text, html, dataset, events, ...attrs } = options;
    
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    if (html) el.innerHTML = html;
    if (dataset) Object.entries(dataset).forEach(([k, v]) => el.dataset[k] = v);
    if (events) Object.entries(events).forEach(([k, v]) => el.addEventListener(k, v));
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    
    children.forEach(child => child && el.appendChild(child));
    return el;
}

export function bindBackdropClick(modal, handler) {
    modal.addEventListener('click', (e) => { if (e.target === modal) handler(); });
}

export function generateLeaderboardHtml(leaderboard, suffix = '') {
    const numPlayers = leaderboard.length;
    const worstRank = numPlayers > 0 ? leaderboard[numPlayers - 1].rank : -1;

    return leaderboard.map((item) => {
        let medal = `${item.rank}.`;
        if (item.rank === 1) medal = '🥇';
        else if (item.rank === 2) medal = '🥈';
        else if (item.rank === 3) medal = '🥉';
        
        if (numPlayers >= 4 && item.rank === worstRank && item.rank > 1) medal = '💩';

        return `<li>
            <span class="rank-medal">${medal}</span> 
            <span class="rank-name">${item.name}</span> 
            <strong>${item.score}${suffix}</strong>
        </li>`;
    }).join('');
}