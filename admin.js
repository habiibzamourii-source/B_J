// CONFIGURATION SUPABASE
const SUPABASE_URL = 'https://wwqgzbtimtsmkicasmmz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cWd6YnRpbXRzbWtpY2FzbW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MTQxOTEsImV4cCI6MjEwMDk5MDE5MX0.LZPq_dSV-dTf6tHff7gV-EOeLkmxIHYx_EQRkWA8RL4';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let globalTicketsP1 = [];
let globalTicketsP2 = [];
let searchQuery = '';

let currentTab = localStorage.getItem('active_tab_preference') || 'p1';
if (currentTab === 'all') currentTab = 'p1';

// Navigation & Sidebar
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }
}

function toggleBilanTable() {
  const content = document.getElementById('bilan-table-wrapper');
  const chevron = document.getElementById('bilan-chevron');
  if (content && chevron) {
    const isOpen = content.classList.toggle('open');
    chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

function switchTab(tab) {
  currentTab = tab;
  localStorage.setItem('active_tab_preference', tab);

  document.querySelectorAll('.sidebar-nav .tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.querySelector(`[data-tab="${tab}"]`);
  if (targetBtn) targetBtn.classList.add('active');

  const grid = document.getElementById('postes-grid');
  if (grid) grid.className = `postes-grid view-${tab}`;

  if (window.innerWidth <= 1024) toggleSidebar();
}

// Clic simple sur l'en-tête : Ouvre/ferme la liste des tickets
function toggleGroup(event, groupId) {
  const el = document.getElementById(groupId);
  if (!el) return;
  el.classList.toggle('open');
}

// Clic sur l'icône 📈 : Empêche la fermeture du groupe et bascule le tableau des cotes
function toggleCotesPanel(event, groupId) {
  if (event) {
    event.stopPropagation();
    if (event.preventDefault) event.preventDefault();
  }
  
  const el = document.getElementById(groupId);
  if (el) {
    const willShow = !el.classList.contains('show-cotes');
    el.classList.toggle('show-cotes', willShow);
    if (willShow) {
      el.classList.add('open');
    }
  }
}

function handleSearch(event) {
  searchQuery = event.target.value.toLowerCase().trim();
  renderAllViews();
}

function checkNumInSelection(selectionStr, targetNum) {
  if (!selectionStr || !targetNum) return false;
  const numClean = targetNum.toString().trim();
  if (!numClean) return false;
  const selectedNums = selectionStr.toString().split(/[\/\-\s,]+/).map(n => n.trim());
  return selectedNums.includes(numClean);
}

function syncCotesInputs(groupId) {
  const case1 = document.getElementById(`${groupId}-c1`);
  const case2 = document.getElementById(`${groupId}-c3`);
  if (case1 && case2) {
    case2.value = case1.value;
  }
  applyCotesFilterAndCalculate(groupId);
}

// Calcul des gains et mise à jour des badges
function applyCotesFilterAndCalculate(groupId) {
  const groupCard = document.getElementById(groupId);
  if (!groupCard) return;

  const c1 = document.getElementById(`${groupId}-c1`)?.value.trim() || '';
  const l1 = parseFloat(document.getElementById(`${groupId}-c2`)?.value) || 0;

  const c2 = document.getElementById(`${groupId}-c3`)?.value.trim() || '';
  const l2 = parseFloat(document.getElementById(`${groupId}-c4`)?.value) || 0;

  const c3 = document.getElementById(`${groupId}-c5`)?.value.trim() || '';
  const l3 = parseFloat(document.getElementById(`${groupId}-c6`)?.value) || 0;

  const c4 = document.getElementById(`${groupId}-c7`)?.value.trim() || '';
  const l4 = parseFloat(document.getElementById(`${groupId}-c8`)?.value) || 0;

  const tickets = groupCard.querySelectorAll('.ticket-wrapper');
  let totalGainGroupe = 0;

  tickets.forEach(ticketEl => {
    const isCancelled = ticketEl.getAttribute('data-is-cancelled') === 'true';
    if (isCancelled) {
      ticketEl.style.display = 'none';
      return;
    }

    const numGagnant = ticketEl.getAttribute('data-num-gagnant') || '';
    const numPlace = ticketEl.getAttribute('data-num-place') || '';
    const numGP = ticketEl.getAttribute('data-num-gp') || '';

    const mtGagnant = parseFloat(ticketEl.getAttribute('data-mt-gagnant')) || 0;
    const mtPlace = parseFloat(ticketEl.getAttribute('data-mt-place')) || 0;
    const mtGP = parseFloat(ticketEl.getAttribute('data-mt-gp')) || 0;

    let match = false;
    let ticketGain = 0;

    if (!c1 && !c3 && !c4) {
      match = true;
    } else {
      if (c1) {
        if (checkNumInSelection(numGagnant, c1)) {
          match = true;
          if (l1 > 0) ticketGain += mtGagnant * l1;
        }
        if (checkNumInSelection(numGP, c1)) {
          match = true;
          if (l1 > 0) ticketGain += mtGP * l1;
          if (l2 > 0) ticketGain += mtGP * l2;
        }
      }

      if (c3) {
        if (checkNumInSelection(numPlace, c3)) {
          match = true;
          if (l3 > 0) ticketGain += mtPlace * l3;
        }
        if (checkNumInSelection(numGP, c3) && !checkNumInSelection(numGP, c1)) {
          match = true;
          if (l3 > 0) ticketGain += mtGP * l3;
        }
      }

      if (c4) {
        if (checkNumInSelection(numPlace, c4)) {
          match = true;
          if (l4 > 0) ticketGain += mtPlace * l4;
        }
        if (checkNumInSelection(numGP, c4) && !checkNumInSelection(numGP, c1)) {
          match = true;
          if (l4 > 0) ticketGain += mtGP * l4;
        }
      }
    }

    if (match) {
      ticketEl.style.display = 'flex';
      totalGainGroupe += ticketGain;

      const gainBadge = ticketEl.querySelector('.calculated-gain-badge');
      if (gainBadge) {
        if (ticketGain > 0) {
          gainBadge.textContent = `Gain: ${ticketGain.toLocaleString('fr-FR')} DT`;
          gainBadge.style.display = 'inline-block';
        } else {
          gainBadge.style.display = 'none';
        }
      }
    } else {
      ticketEl.style.display = 'none';
    }
  });

  const totalGainTableEl = document.getElementById(`${groupId}-total-gain`);
  if (totalGainTableEl) {
    totalGainTableEl.textContent = `${totalGainGroupe.toLocaleString('fr-FR')} DT`;
  }

  const groupHeaderGainEl = document.getElementById(`${groupId}-header-gain`);
  if (groupHeaderGainEl) {
    if (totalGainGroupe > 0) {
      groupHeaderGainEl.textContent = `${totalGainGroupe.toLocaleString('fr-FR')} DT`;
      groupHeaderGainEl.style.display = 'inline-flex';
    } else {
      groupHeaderGainEl.style.display = 'none';
    }
  }

  if (groupId.startsWith('cotes-grp-')) {
    updateConsolidatedGainsAndProfit();
  }
}

function updateConsolidatedGainsAndProfit() {
  let gainsP1 = 0;
  let gainsP2 = 0;

  const cotesContainer = document.getElementById('cotes-groups-list');
  if (!cotesContainer) return;

  const accordions = cotesContainer.querySelectorAll('.group-accordion');

  accordions.forEach(acc => {
    const visibleTickets = acc.querySelectorAll('.ticket-wrapper');
    visibleTickets.forEach(ticketEl => {
      if (ticketEl.style.display !== 'none' && ticketEl.getAttribute('data-is-cancelled') !== 'true') {
        const origin = ticketEl.getAttribute('data-origin-poste');
        const gainBadge = ticketEl.querySelector('.calculated-gain-badge');
        let gainVal = 0;

        if (gainBadge && gainBadge.style.display !== 'none') {
          const txt = gainBadge.textContent || '';
          gainVal = parseFloat(txt.replace('Gain:', '').replace('DT', '').replace(/\s/g, '')) || 0;
        }

        if (origin === 'P1') gainsP1 += gainVal;
        else if (origin === 'P2') gainsP2 += gainVal;
      }
    });
  });

  const totalGainsGlobal = gainsP1 + gainsP2;
  const netText = document.getElementById('cotes-net')?.textContent || '0 DT';
  const recetteNetteTotale = parseFloat(netText.replace('DT', '').replace(/\s/g, '')) || 0;
  const beneficeDuJour = recetteNetteTotale - totalGainsGlobal;

  const elGainsP1 = document.getElementById('cotes-gains-p1');
  if (elGainsP1) elGainsP1.textContent = `${gainsP1.toLocaleString('fr-FR')} DT`;

  const elGainsP2 = document.getElementById('cotes-gains-p2');
  if (elGainsP2) elGainsP2.textContent = `${gainsP2.toLocaleString('fr-FR')} DT`;

  const elGainsTotal = document.getElementById('cotes-gains-total');
  if (elGainsTotal) elGainsTotal.textContent = `${totalGainsGlobal.toLocaleString('fr-FR')} DT`;

  const elProfit = document.getElementById('cotes-profit');
  if (elProfit) elProfit.textContent = `${beneficeDuJour.toLocaleString('fr-FR')} DT`;
}

function renderBetBlock(title, typeClass, num, amount) {
  if (!num) return '';
  return `
    <div class="bet-item ${typeClass}">
      <div class="bet-header">
        <span>${title}</span>
        <span>${parseFloat(amount || 0).toLocaleString('fr-FR')} DT</span>
      </div>
      <div class="bet-body">Sélection : N° ${num}</div>
    </div>
  `;
}

function renderTicketItem(t, index, prefix) {
  const isCanc = t.is_cancelled === true || parseFloat(t.total_general) === 0;
  const amt = isCanc ? (parseFloat(t.original_total || t.total_general) || 0) : (parseFloat(t.total_general) || 0);
  const ticketUniqueId = `${prefix}-t-${t.id || index}`;

  const pays = (t.pays && t.pays.trim()) ? t.pays.trim() : 'N/A';
  const course = (t.course && t.course.trim()) ? t.course.trim() : 'C1';
  const originPoste = t.originPoste || (prefix === 'p1' ? 'P1' : 'P2');
  const isCotesView = (prefix === 'cotes');

  const ticketPayload = encodeURIComponent(JSON.stringify({ ...t, originPoste, pays, course, amt, isCanc }));

  let rowContentHTML = '';

  if (isCotesView) {
    const badgeClass = originPoste === 'P1' ? 'p1' : 'p2';
    rowContentHTML = `
      <span class="badge-poste ${badgeClass}">${originPoste}</span>
      <div class="code-pill">🎫 ${t.code || 'SANS-CODE'}</div>
      <div class="t-amount" style="margin-left: auto;">
        <span class="calculated-gain-badge" style="display:none;"></span>
      </div>
    `;
  } else {
    rowContentHTML = `
      <div class="code-pill">🎫 ${t.code || 'SANS-CODE'}</div>
      <div class="t-amount" style="margin-left: auto; margin-right: 12px;">
        ${amt.toLocaleString('fr-FR')} DT
      </div>
      <div class="t-status">
        ${isCanc ? '<span class="status-tag cancelled">Annulé</span>' : '<span class="status-tag printed">Imprimé</span>'}
      </div>
    `;
  }

  return `
    <div class="ticket-wrapper ${isCanc ? 'is-cancelled' : ''}" 
         id="${ticketUniqueId}" 
         data-is-cancelled="${isCanc}"
         data-origin-poste="${originPoste}"
         data-num-gagnant="${t.num_gagnant || ''}"
         data-num-place="${t.num_place || ''}"
         data-num-gp="${t.num_gagnant_place || ''}"
         data-mt-gagnant="${t.montant_gagnant || 0}"
         data-mt-place="${t.montant_place || 0}"
         data-mt-gp="${t.montant_gagnant_place || 0}">
      
      <div class="ticket-row" data-ticket-json="${ticketPayload}" data-ticket-target="${ticketUniqueId}">
        ${rowContentHTML}
      </div>
    </div>
  `;
}

// Clic unique sur le ticket
document.addEventListener('click', function(e) {
  const row = e.target.closest('.ticket-row');
  if (row && row.dataset.ticketJson) {
    e.stopPropagation();
    openTicketModal(row.dataset.ticketJson, row.dataset.ticketTarget);
  }
});

function openTicketModal(jsonString, ticketUniqueId) {
  const t = JSON.parse(decodeURIComponent(jsonString));
  
  const badgePosteHTML = t.originPoste === 'P1'
    ? '<span class="badge-poste p1">P1</span>'
    : '<span class="badge-poste p2">P2</span>';

  const sourceTicketEl = document.getElementById(ticketUniqueId);
  const gainBadgeEl = sourceTicketEl ? sourceTicketEl.querySelector('.calculated-gain-badge') : null;
  let gainModalHTML = '';
  
  if (gainBadgeEl && gainBadgeEl.style.display !== 'none' && gainBadgeEl.textContent.trim() !== '') {
    gainModalHTML = `<div style="margin-top: 10px;">${gainBadgeEl.outerHTML}</div>`;
  }

  const blocksHTML = [
    renderBetBlock('Pari Gagnant', 'gagnant', t.num_gagnant, t.montant_gagnant),
    renderBetBlock('Pari Placé', 'place', t.num_place, t.montant_place),
    renderBetBlock('Pari Gagnant / Placé', 'gp', t.num_gagnant_place, t.montant_gagnant_place)
  ].filter(Boolean).join('');

  const modalHTML = `
    <div class="modal-overlay" id="ticket-modal-overlay" onclick="closeTicketModal()">
      <div class="modal-content" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>Détails du Ticket</h3>
          <button class="btn-close-modal" onclick="closeTicketModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="receipt-box ${t.isCanc ? 'is-cancelled' : ''}">
            <div class="receipt-header-stacked">
              <div class="modal-line line-code">
                <strong>Code :</strong> <code>${t.code || 'N/A'}</code>
              </div>
              <div class="modal-line line-location">
                ${badgePosteHTML}
                <span class="tag-pays">${t.pays}</span>
                <span class="tag-course">${t.course}</span>
              </div>
              <div class="modal-line line-date">
                📅 <span>${t.ticket_date || 'Inconnu'}</span>
              </div>
            </div>

            <div class="bets-list" style="margin-top: 14px;">
              ${blocksHTML || '<div class="empty-state">Aucun pari enregistré</div>'}
            </div>

            ${gainModalHTML}

            <div class="receipt-footer" style="margin-top: 14px;">
              <span class="status-tag ${t.isCanc ? 'cancelled' : 'printed'}">${t.isCanc ? 'ANNULÉ' : 'VALIDE'}</span>
              <span class="receipt-total">${t.amt.toLocaleString('fr-FR')} DT</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="closeTicketModal()" style="width: 100%;">Fermer</button>
        </div>
      </div>
    </div>
  `;

  closeTicketModal();
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeTicketModal() {
  const modal = document.getElementById('ticket-modal-overlay');
  if (modal) modal.remove();
}

function renderPoste(tickets, prefix) {
  const openGroups = new Set();
  const openCotesPanels = new Set();
  const inputValues = {};

  document.querySelectorAll(`#${prefix}-groups-list .group-accordion`).forEach(acc => {
    const id = acc.id;
    if (acc.classList.contains('open')) openGroups.add(id);
    if (acc.classList.contains('show-cotes')) openCotesPanels.add(id);

    for (let i = 1; i <= 8; i++) {
      const inp = document.getElementById(`${id}-c${i}`);
      if (inp) inputValues[`${id}-c${i}`] = inp.value;
    }
  });

  let filteredTickets = tickets;
  if (searchQuery) {
    filteredTickets = tickets.filter(t => {
      const code = (t.code || '').toLowerCase();
      const pays = (t.pays || '').toLowerCase();
      const course = (t.course || '').toLowerCase();
      return code.includes(searchQuery) || pays.includes(searchQuery) || course.includes(searchQuery);
    });
  }

  let grossTotal = 0, cancelledTotal = 0, netTotal = 0, cancelledCount = 0;
  const groups = {};

  filteredTickets.forEach(ticket => {
    const isCancelled = ticket.is_cancelled === true || parseFloat(ticket.total_general) === 0;
    const amount = parseFloat(ticket.original_total || ticket.total_general) || 0;
    const currentNet = isCancelled ? 0 : (parseFloat(ticket.total_general) || 0);

    grossTotal += amount;
    if (isCancelled) { 
      cancelledTotal += amount;
      cancelledCount++;
    } else { 
      netTotal += currentNet;
    }

    const pays = (ticket.pays && ticket.pays.trim()) ? ticket.pays.trim() : 'N/A';
    const course = (ticket.course && ticket.course.trim()) ? ticket.course.trim() : 'C1';

    const cleanPays = pays.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '_');
    const cleanCourse = course.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, '_');
    const key = `${cleanPays}_${cleanCourse}`;

    if (!groups[key]) {
      groups[key] = { pays, course, netRevenue: 0, tickets: [] };
    }

    if (!isCancelled) groups[key].netRevenue += currentNet;
    groups[key].tickets.push(ticket);
  });

  if (prefix !== 'cotes') {
    const elGross = document.getElementById(`${prefix}-gross`);
    if (elGross) elGross.textContent = `${grossTotal.toLocaleString('fr-FR')} DT`;
    const elCanc = document.getElementById(`${prefix}-cancelled`);
    if (elCanc) elCanc.textContent = `${cancelledTotal.toLocaleString('fr-FR')} DT`;
    const elCancCount = document.getElementById(`${prefix}-cancelled-count`);
    if (elCancCount) elCancCount.textContent = `${cancelledCount} ticket(s)`;
    const elNet = document.getElementById(`${prefix}-net`);
    if (elNet) elNet.textContent = `${netTotal.toLocaleString('fr-FR')} DT`;
    const elTotalCount = document.getElementById(`${prefix}-total-count`);
    if (elTotalCount) elTotalCount.textContent = filteredTickets.length;
  } else {
    const elGross = document.getElementById('cotes-gross');
    if (elGross) elGross.textContent = `${grossTotal.toLocaleString('fr-FR')} DT`;
    const elCanc = document.getElementById('cotes-cancelled');
    if (elCanc) elCanc.textContent = `${cancelledTotal.toLocaleString('fr-FR')} DT`;
    const elNet = document.getElementById('cotes-net');
    if (elNet) elNet.textContent = `${netTotal.toLocaleString('fr-FR')} DT`;
    const elTotalCount = document.getElementById('cotes-total-count');
    if (elTotalCount) elTotalCount.textContent = filteredTickets.length;
  }

  const container = document.getElementById(`${prefix}-groups-list`);
  if (!container) return;
  container.innerHTML = '';

  const keys = Object.keys(groups).sort();
  if (keys.length === 0) {
    container.innerHTML = `<div class="empty-state">Aucun ticket correspondant.</div>`;
    if (prefix === 'cotes') updateConsolidatedGainsAndProfit();
    return;
  }

  const isCotesView = (prefix === 'cotes');

  keys.forEach((key, index) => {
    const group = groups[key];
    const groupId = `${prefix}-grp-${key}`;
    
    group.tickets.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const ticketsHTML = group.tickets.map((t, i) => renderTicketItem(t, i, prefix)).join('');

    const cotesPanelHTML = isCotesView ? `
      <div class="cotes-panel-container">
        <div class="cotes-panel-title">
          <span>📈 Tableau des Cotes - ${group.pays} (${group.course})</span>
          <span style="font-size:0.95rem; color:#a7f3d0; font-weight:800;">
            Gain Groupe Estimé : <strong id="${groupId}-total-gain">0 DT</strong>
          </span>
        </div>
        <div class="cotes-table-wrapper">
          <table class="cotes-table">
            <thead>
              <tr>
                <th>Ligne / Section</th>
                <th>Numéro</th>
                <th>Cote</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>L1</strong></td>
                <td><input type="number" id="${groupId}-c1" class="cotes-input" placeholder="Case 1 (Num)" oninput="syncCotesInputs('${groupId}')"></td>
                <td><input type="number" step="0.1" id="${groupId}-c2" class="cotes-input" placeholder="Case 2 (Cote L1)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
              </tr>
              <tr>
                <td><strong>L2</strong></td>
                <td><input type="number" id="${groupId}-c3" class="cotes-input readonly" placeholder="Case 2 (auto)" readonly></td>
                <td><input type="number" step="0.1" id="${groupId}-c4" class="cotes-input" placeholder="Case 4 (Cote L2)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
              </tr>
              <tr>
                <td><strong>L3</strong></td>
                <td><input type="number" id="${groupId}-c5" class="cotes-input" placeholder="Case 3 (Num)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
                <td><input type="number" step="0.1" id="${groupId}-c6" class="cotes-input" placeholder="Case 6 (Cote L3)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
              </tr>
              <tr>
                <td><strong>L4</strong></td>
                <td><input type="number" id="${groupId}-c7" class="cotes-input" placeholder="Case 4 (Num)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
                <td><input type="number" step="0.1" id="${groupId}-c8" class="cotes-input" placeholder="Case 8 (Cote L4)" oninput="applyCotesFilterAndCalculate('${groupId}')"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
          <button type="button" 
                  class="btn-primary" 
                  id="${groupId}-btn-save" 
                  style="padding: 10px 20px; font-size: 0.95rem; background-color: #047857;">
            ✅ OK / Enregistrer & Masquer
          </button>
        </div>
      </div>
    ` : '';

const card = document.createElement('div');
card.className = 'group-accordion';
    card.id = groupId;

    const groupHeaderGainHTML = isCotesView 
      ? `<span class="group-estimated-gain-badge" id="${groupId}-header-gain" style="display:none;">0 DT</span>`
      : '';

    const cotesToggleBtnHTML = isCotesView
      ? `<button type="button" class="btn-toggle-cotes" onclick="toggleCotesPanel(event, '${groupId}')" title="Ouvrir/Fermer le Tableau des Cotes" style="background: rgba(255,255,255,0.2); border: 1.5px solid var(--border); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-right: 8px;">📈</button>`
      : '';

card.innerHTML = `
      <div class="group-header" id="${groupId}-header" onclick="toggleGroup(event, '${groupId}')">
        <!-- COLONNE GAUCHE (2 LIGNES) -->
        <div class="group-title">
          <!-- Ligne 1 : Pays + Course + Nb Tickets -->
          <div class="cotes-line-1">
            <span class="badge-country">${group.pays}</span>
            <span class="course-title">${group.course}</span>
            <span class="tickets-count">(${group.tickets.length})</span>
          </div>

          <!-- Ligne 2 : Total / Recette + Bouton Cotes au milieu -->
          <div class="cotes-line-2">
            <span class="net-amount">${group.netRevenue.toLocaleString('fr-FR')} DT</span>
            ${isCotesView ? `
              <button type="button" class="btn-toggle-cotes" onclick="toggleCotesPanel(event, '${groupId}')" title="Ouvrir/Fermer le Tableau des Cotes">📈</button>
            ` : ''}
          </div>
        </div>

        <!-- COLONNE DROITE (Gain + Chevron) -->
        <div class="group-metrics">
          ${groupHeaderGainHTML}
          <span class="chevron-icon">▼</span>
        </div>
      </div>

      ${cotesPanelHTML}

      <div class="group-content">
        <div class="tickets-table">${ticketsHTML}</div>
      </div>
    `;

    container.appendChild(card);

    if (isCotesView) {
      const saveBtn = document.getElementById(`${groupId}-btn-save`);
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          saveCotesToSupabase(groupId, group.pays, group.course);
        });
      }
    }

    if (openGroups.has(groupId)) card.classList.add('open');
    if (openCotesPanels.has(groupId)) card.classList.add('show-cotes');

    for (let i = 1; i <= 8; i++) {
      const inputId = `${groupId}-c${i}`;
      if (inputValues[inputId] !== undefined) {
        const inp = document.getElementById(inputId);
        if (inp) inp.value = inputValues[inputId];
      }
    }

    if (isCotesView) {
      applyCotesFilterAndCalculate(groupId);
    }
  });

  if (isCotesView) {
    updateConsolidatedGainsAndProfit();
  }
}

function renderAllViews() {
  renderPoste(globalTicketsP1, 'p1');
  renderPoste(globalTicketsP2, 'p2');
  renderPoste([...globalTicketsP1, ...globalTicketsP2], 'cotes');

  const grid = document.getElementById('postes-grid');
  if (grid) grid.className = `postes-grid view-${currentTab}`;

  document.querySelectorAll('.sidebar-nav .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === currentTab);
  });
}

// Enregistrement Supabase & fermeture du tableau des cotes
async function saveCotesToSupabase(groupId, pays, course) {
  const btn = document.getElementById(`${groupId}-btn-save`);
  if (btn) btn.innerText = "⏳ Enregistrement...";

  applyCotesFilterAndCalculate(groupId);

  const gainEl = document.getElementById(`${groupId}-total-gain`);
  const totalGain = parseFloat(gainEl?.innerText.replace(' DT', '').replace(/\s/g, '')) || 0;

  const payload = {
    group_id: groupId,
    pays: pays,
    course: course,
    c1: document.getElementById(`${groupId}-c1`)?.value || '',
    c2: document.getElementById(`${groupId}-c2`)?.value || '',
    c3: document.getElementById(`${groupId}-c3`)?.value || '',
    c4: document.getElementById(`${groupId}-c4`)?.value || '',
    c5: document.getElementById(`${groupId}-c5`)?.value || '',
    c6: document.getElementById(`${groupId}-c6`)?.value || '',
    c7: document.getElementById(`${groupId}-c7`)?.value || '',
    c8: document.getElementById(`${groupId}-c8`)?.value || '',
    total_gain: totalGain,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabaseClient
      .from('cotes_gains')
      .upsert(payload, { onConflict: 'group_id' });

    if (error) {
      alert("Erreur d'enregistrement : " + error.message);
      if (btn) btn.innerText = "❌ Erreur";
    } else {
      if (btn) {
        btn.innerText = "✓ Enregistré !";
        btn.style.backgroundColor = "#15803d";
      }

      setTimeout(() => {
        const groupCard = document.getElementById(groupId);
        if (groupCard) {
          groupCard.classList.remove('show-cotes');
        }
        if (btn) {
          btn.innerText = "✅ OK / Enregistrer & Masquer";
          btn.style.backgroundColor = "#047857";
        }
      }, 300);
    }
  } catch (err) {
    console.error("Erreur Sauvegarde Supabase:", err);
  }
}

async function loadSavedCotes() {
  try {
    const { data, error } = await supabaseClient.from('cotes_gains').select('*');
    if (error) return;

    if (data && data.length > 0) {
      data.forEach(item => {
        const groupId = item.group_id;
        for (let i = 1; i <= 8; i++) {
          const fieldVal = item[`c${i}`];
          const inputEl = document.getElementById(`${groupId}-c${i}`);
          if (inputEl && fieldVal !== undefined) {
            inputEl.value = fieldVal;
          }
        }
        applyCotesFilterAndCalculate(groupId);
      });
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des cotes:", err);
  }
}

async function deleteAllTickets() {
  const confirmed = confirm("⚠️ ÊTES-VOUS SÛR DE VOULOIR TOUT SUPPRIMER ?");
  if (!confirmed) return;

  try {
    const { error: err1 } = await supabaseClient.from('tickets').delete().not('id', 'is', null);
    const { error: err2 } = await supabaseClient.from('tickets2').delete().not('id', 'is', null);
    const { error: err4 } = await supabaseClient.from('cotes_gains').delete().not('group_id', 'is', null);

    const errors = [err1, err2, err4].filter(Boolean);

    if (errors.length > 0) {
      alert("Erreur lors de la suppression : " + errors.map(e => e.message).join(' | '));
    } else {
      alert("Toutes les données ont été réinitialisées !");
      loadAllData();
    }
  } catch (err) {
    console.error("Erreur générale lors de la suppression :", err);
  }
}

async function loadAllData() {
  try {
    const resP1 = await supabaseClient.from('tickets').select('*');
    globalTicketsP1 = (resP1.data || []).map(t => ({ ...t, originPoste: 'P1' }));

    const resP2 = await supabaseClient.from('tickets2').select('*');
    globalTicketsP2 = (resP2.data || []).map(t => ({ ...t, originPoste: 'P2' }));

    renderAllViews();
    await loadSavedCotes();

  } catch (err) {
    console.error("Erreur générale de chargement :", err);
  }
}

function initRealtime() {
  supabaseClient
    .channel('realtime-pro-v15')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
      triggerPulseEffect();
      softReloadData();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets2' }, () => {
      triggerPulseEffect();
      softReloadData();
    })
    .subscribe();
}

async function softReloadData() {
  const scrollTop = window.scrollY;
  const activeInputId = document.activeElement?.id || null;

  const currentInputs = {};
  document.querySelectorAll('.cotes-input').forEach(input => {
    if (input.id && input.value) {
      currentInputs[input.id] = input.value;
    }
  });

  

  const resP1 = await supabaseClient.from('tickets').select('*');
  globalTicketsP1 = (resP1.data || []).map(t => ({ ...t, originPoste: 'P1' }));

  const resP2 = await supabaseClient.from('tickets2').select('*');
  globalTicketsP2 = (resP2.data || []).map(t => ({ ...t, originPoste: 'P2' }));

  renderAllViews();

  Object.keys(currentInputs).forEach(inputId => {
    const el = document.getElementById(inputId);
    if (el) {
      el.value = currentInputs[inputId];
      if (inputId.endsWith('-c1')) {
        const groupId = inputId.replace('-c1', '');
        syncCotesInputs(groupId);
      }
    }
  });

  window.scrollTo(0, scrollTop);
  if (activeInputId) {
    const activeEl = document.getElementById(activeInputId);
    if (activeEl) activeEl.focus();
  }
}

function triggerPulseEffect() {
  const liveDot = document.querySelector('.dot');
  if (liveDot) {
    liveDot.style.transform = 'scale(1.8)';
    setTimeout(() => { liveDot.style.transform = 'scale(1)'; }, 400);
  }
}

document.getElementById('refresh-admin-btn')?.addEventListener('click', loadAllData);
document.getElementById('search-input')?.addEventListener('input', handleSearch);

switchTab(currentTab);
loadAllData();
initRealtime();    