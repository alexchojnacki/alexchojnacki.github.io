/**
 * Tests d'émaux - Application Atelier
 * Gestion des tests via Google Sheets
 */

// ==========================================================================
// AUTHENTIFICATION
// ==========================================================================

const SESSION_KEY = 'emaux_auth';

function getTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('key');
}

async function verifyToken(token) {
  try {
    const response = await fetch(SHEETS_API_URL + '?type=auth&key=' + encodeURIComponent(token));
    const result = await response.json();
    return result.success && result.authorized;
  } catch (e) {
    console.error('Erreur vérification token:', e);
    return false;
  }
}

function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function setAuthenticated() {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

async function checkAuth() {
  const loginScreen = document.getElementById('login-screen');
  const appContent = document.getElementById('app-content');
  const loginError = document.getElementById('login-error');
  
  // Déjà authentifié dans cette session
  if (isAuthenticated()) {
    loginScreen.classList.add('hidden');
    appContent.classList.remove('hidden');
    init();
    return;
  }
  
  // Vérifier le token dans l'URL
  const token = getTokenFromURL();
  
  if (token) {
    loginError.textContent = 'Vérification...';
    loginError.classList.remove('hidden');
    
    const isValid = await verifyToken(token);
    
    if (isValid) {
      setAuthenticated();
      loginScreen.classList.add('hidden');
      appContent.classList.remove('hidden');
      init();
      return;
    } else {
      loginError.textContent = 'Accès refusé';
    }
  } else {
    loginError.textContent = 'Accès réservé';
  }
}

// ==========================================================================
// CONFIGURATION API GOOGLE SHEETS
// ==========================================================================

const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbyeam2b2k1TYPYJ42MkZCnrHvUpNbwFGfx7_lxH_oGRAfhugrk0ichWGZBS5FqirK3gsA/exec';

// État de synchronisation
let isSyncing = false;
let syncError = null;

// ==========================================================================
// DONNÉES DE BASE
// ==========================================================================

const BASES = {
  B1: {
    name: 'Soft Green',
    recipe: {
      'Silice': 32,
      'Feldspath sodique': 22.5,
      'Kaolin': 15,
      'Dolomie': 13.5,
      'Colémanite': 4.5,
      'CaCO3': 3
    },
    defaultAdditives: { Cu: 3, Ru: 3, Fe: 1.5, Co: 0.5 }
  },
  B2: {
    name: 'Blue Stone',
    recipe: {
      'Silice': 20.6,
      'Ball Clay': 19.6,
      'CaCO3': 18.8,
      'Feldspath K': 36.9,
      'Talc': 10.1
    },
    defaultAdditives: { Ru: 5, Ni: 2, Co: 0.5 },
    warning: 'Potentiellement incohérent'
  },
  B3: {
    name: 'Beurre',
    recipe: {
      'Feldspath K': 24,
      'Silice': 24,
      'Craie': 19,
      'Talc': 19,
      'Kaolin': 14
    },
    defaultAdditives: {},
    note: 'Base de référence'
  },
  B4: {
    name: 'Noir Mat',
    recipe: {
      'Feldspath sodique': 40,
      'Silice': 30,
      'Craie': 20,
      'Kaolin': 10,
      'Molochite': 8
    },
    defaultAdditives: { Fe: 6, Cu: 3 },
    note: 'Expérimental'
  },
  B5: {
    name: 'Blanc',
    recipe: {
      'Feldspath sodique': 40,
      'Silice': 30,
      'Craie': 20,
      'Kaolin': 10
    },
    defaultAdditives: { Ti: 5, Zr: 5 },
    note: 'Opacifié'
  },
  B6: {
    name: 'Vert',
    recipe: {
      'Feldspath sodique': 40,
      'Silice': 30,
      'Craie': 20,
      'Kaolin': 10
    },
    defaultAdditives: { Cu: 3 },
    note: 'Oxydation'
  }
};

const ADDITIVE_CODES = ['Cu', 'Fe', 'Co', 'Ru', 'Ni', 'Ti', 'Zr', 'Sn', 'Cr', 'Li', 'Zn'];

const DEFECT_LABELS = {
  crawling: 'Retrait',
  pinholing: 'Piqûres',
  crazing: 'Tressaillage',
  blistering: 'Cloques',
  running: 'Coulures',
  underfired: 'Sous-cuit',
  overfired: 'Sur-cuit'
};

const CONCLUSION_LABELS = {
  keeper: 'À garder',
  retry: 'À refaire',
  abandon: 'Abandonné',
  pending: 'En attente'
};

// ==========================================================================
// STORAGE (Google Sheets API)
// ==========================================================================

function showSyncStatus(message, isError = false) {
  let statusEl = document.getElementById('sync-status');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'sync-status';
    document.body.appendChild(statusEl);
  }
  statusEl.textContent = message;
  statusEl.className = isError ? 'sync-error' : 'sync-loading';
  statusEl.style.display = 'block';
  
  if (!isError) {
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
  }
}

function hideSyncStatus() {
  const statusEl = document.getElementById('sync-status');
  if (statusEl) statusEl.style.display = 'none';
}

async function loadTestsFromSheets() {
  try {
    isSyncing = true;
    showSyncStatus('Chargement...');
    
    const response = await fetch(SHEETS_API_URL);
    const result = await response.json();
    
    if (result.success) {
      hideSyncStatus();
      return result.data || [];
    } else {
      throw new Error(result.error || 'Erreur inconnue');
    }
  } catch (e) {
    console.error('Erreur chargement Google Sheets:', e);
    showSyncStatus('Erreur de connexion', true);
    syncError = e;
    return [];
  } finally {
    isSyncing = false;
  }
}

async function saveTestToSheets(test, action = 'update') {
  try {
    isSyncing = true;
    showSyncStatus('Sauvegarde...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, test })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Sauvegardé ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur sauvegarde');
    }
  } catch (e) {
    console.error('Erreur sauvegarde Google Sheets:', e);
    showSyncStatus('Erreur de sauvegarde', true);
    syncError = e;
    return false;
  } finally {
    isSyncing = false;
  }
}

async function deleteTestFromSheets(id) {
  try {
    isSyncing = true;
    showSyncStatus('Suppression...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Supprimé ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur suppression');
    }
  } catch (e) {
    console.error('Erreur suppression Google Sheets:', e);
    showSyncStatus('Erreur de suppression', true);
    syncError = e;
    return false;
  } finally {
    isSyncing = false;
  }
}

async function syncAllToSheets(tests) {
  try {
    isSyncing = true;
    showSyncStatus('Synchronisation...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'sync', tests })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus(`${result.count} tests synchronisés ✓`);
      return true;
    } else {
      throw new Error(result.error || 'Erreur sync');
    }
  } catch (e) {
    console.error('Erreur synchronisation Google Sheets:', e);
    showSyncStatus('Erreur de synchronisation', true);
    syncError = e;
    return false;
  } finally {
    isSyncing = false;
  }
}

// ==========================================================================
// BASES STORAGE (Google Sheets)
// ==========================================================================

async function loadBasesFromSheets() {
  try {
    const response = await fetch(SHEETS_API_URL + '?type=bases');
    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (e) {
    console.error('Erreur chargement bases:', e);
    return [];
  }
}

async function saveBaseToSheets(base, action = 'updateBase') {
  try {
    isSyncing = true;
    showSyncStatus('Sauvegarde base...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, base })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Base sauvegardée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur sauvegarde base');
    }
  } catch (e) {
    console.error('Erreur sauvegarde base:', e);
    showSyncStatus('Erreur de sauvegarde', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

async function deleteBaseFromSheets(code) {
  try {
    isSyncing = true;
    showSyncStatus('Suppression base...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteBase', code })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Base supprimée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur suppression base');
    }
  } catch (e) {
    console.error('Erreur suppression base:', e);
    showSyncStatus('Erreur de suppression', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

function getNextNumber(base, cone, tests) {
  const prefix = `${base}-`;
  const suffix = `-C${cone}-`;
  let maxNum = 0;
  
  tests.forEach(t => {
    if (t.generatedId && t.generatedId.startsWith(prefix) && t.generatedId.includes(suffix)) {
      const match = t.generatedId.match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  
  return String(maxNum + 1).padStart(2, '0');
}

// ==========================================================================
// ID GENERATION
// ==========================================================================

function generateTestId(base, additives, cone, tests) {
  if (!base) return '-';
  
  let parts = [base];
  
  // Ajouter les additifs dans l'ordre
  ADDITIVE_CODES.forEach(code => {
    const value = additives[code];
    if (value && value > 0) {
      parts.push(`${code}${value}`);
    }
  });
  
  parts.push(`C${cone}`);
  
  // Numéro séquentiel
  const num = getNextNumber(base, cone, tests);
  parts.push(num);
  
  return parts.join('-');
}

function getAdditivesFromForm() {
  const additives = {};
  ADDITIVE_CODES.forEach(code => {
    const input = document.getElementById(`add-${code.toLowerCase()}`);
    if (input && input.value) {
      const val = parseFloat(input.value);
      if (val > 0) additives[code] = val;
    }
  });
  return additives;
}

// ==========================================================================
// STATE
// ==========================================================================

let tests = [];
let customBases = {};  // Bases personnalisées chargées depuis Sheets
let selectedIds = new Set();
let currentEditId = null;
let currentPhoto = null;
let currentEditBaseCode = null;

// ==========================================================================
// DOM ELEMENTS
// ==========================================================================

const $ = id => document.getElementById(id);

const elements = {
  testsList: $('tests-list'),
  modal: $('modal'),
  modalTitle: $('modal-title'),
  modalDetail: $('modal-detail'),
  detailContent: $('detail-content'),
  testForm: $('test-form'),
  testId: $('test-id'),
  generatedId: $('generated-id'),
  compareView: $('compare-view'),
  compareTable: $('compare-table'),
  searchInput: $('search'),
  filterBase: $('filter-base'),
  filterConclusion: $('filter-conclusion'),
  photoInput: $('photo-input'),
  photoPreview: $('photo-preview'),
  btnRemovePhoto: $('btn-remove-photo'),
  btnDelete: $('btn-delete')
};

// ==========================================================================
// RENDER
// ==========================================================================

function renderTestsList(filteredTests = null) {
  const toRender = filteredTests || tests;
  
  if (toRender.length === 0) {
    elements.testsList.innerHTML = `
      <div class="empty-state">
        <p>Aucun test enregistré</p>
        <button class="btn btn-primary" onclick="openNewTest()">Créer le premier test</button>
      </div>
    `;
    return;
  }
  
  elements.testsList.innerHTML = toRender.map(test => {
    const isSelected = selectedIds.has(test.id);
    const badgeClass = `badge-${test.conclusion || 'pending'}`;
    const badgeLabel = CONCLUSION_LABELS[test.conclusion] || 'En attente';
    
    return `
      <div class="test-card ${isSelected ? 'selected' : ''}" data-id="${test.id}">
        <div class="test-card-main" onclick="openDetail('${test.id}')">
          <div class="test-id">${test.generatedId || test.id}</div>
          <div class="test-meta">
            <span>${test.date || '-'}</span>
            <span class="test-badge ${badgeClass}">${badgeLabel}</span>
          </div>
          ${test.color ? `<div class="test-color">${test.color}</div>` : ''}
        </div>
        ${test.photo ? `<img src="${test.photo}" alt="" class="test-thumb">` : ''}
        <input type="checkbox" class="test-checkbox" 
               ${isSelected ? 'checked' : ''} 
               onclick="event.stopPropagation(); toggleSelect('${test.id}')">
      </div>
    `;
  }).join('');
}

function renderCompareTable() {
  if (selectedIds.size < 2) {
    alert('Sélectionnez au moins 2 tests à comparer');
    return;
  }
  
  const selected = tests.filter(t => selectedIds.has(t.id));
  
  const rows = [
    { label: 'ID', key: 'generatedId' },
    { label: 'Date', key: 'date' },
    { label: 'Couleur', key: 'color' },
    { label: 'Intensité', key: 'intensity' },
    { label: 'Brillance', key: 'gloss' },
    { label: 'Texture', key: 'texture' },
    { label: 'Cône réel', key: 'actualCone' },
    { label: 'Position', key: 'kilnPosition' },
    { label: 'Défauts', key: 'defects', format: v => v?.map(d => DEFECT_LABELS[d]).join(', ') || '-' },
    { label: 'Décision', key: 'conclusion', format: v => CONCLUSION_LABELS[v] || '-' }
  ];
  
  let html = '<table><tbody>';
  
  rows.forEach(row => {
    html += `<tr><th>${row.label}</th>`;
    selected.forEach(test => {
      let value = test[row.key];
      if (row.format) value = row.format(value);
      html += `<td>${value || '-'}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  
  elements.compareTable.innerHTML = html;
  elements.compareView.classList.remove('hidden');
  elements.testsList.classList.add('hidden');
}

// ==========================================================================
// BASES MANAGEMENT
// ==========================================================================

function getAllBases() {
  // Fusionner les bases par défaut avec les bases personnalisées
  return { ...BASES, ...customBases };
}

function renderBasesList() {
  const allBases = getAllBases();
  const basesList = $('bases-list');
  
  if (!basesList) return;
  
  const baseCodes = Object.keys(allBases).sort();
  
  basesList.innerHTML = baseCodes.map(code => {
    const base = allBases[code];
    const isCustom = customBases[code] !== undefined;
    const recipePreview = Object.entries(base.recipe || {})
      .slice(0, 3)
      .map(([k, v]) => `${k} ${v}%`)
      .join(', ');
    
    return `
      <div class="base-card" onclick="openEditBase('${code}')">
        <div class="base-card-header">
          <div>
            <span class="base-card-code">${code}</span>
            <span class="base-card-name"> - ${base.name}</span>
            ${isCustom ? '<span class="base-card-custom">(personnalisée)</span>' : ''}
          </div>
        </div>
        ${base.note ? `<div class="base-card-note">${base.note}</div>` : ''}
        ${base.warning ? `<div class="base-card-warning">⚠️ ${base.warning}</div>` : ''}
        <div class="base-card-recipe">${recipePreview}${Object.keys(base.recipe || {}).length > 3 ? '...' : ''}</div>
      </div>
    `;
  }).join('');
}

function renderRecettesList() {
  const allBases = getAllBases();
  const recettesList = $('recettes-list');
  
  if (!recettesList) return;
  
  const baseCodes = Object.keys(allBases).sort();
  
  recettesList.innerHTML = baseCodes.map(code => {
    const base = allBases[code];
    const defaultAdditivesStr = Object.entries(base.defaultAdditives || {})
      .map(([k, v]) => `${k} ${v}%`)
      .join(', ') || 'Aucun';
    
    const recipeRows = Object.entries(base.recipe || {})
      .map(([ingredient, percent]) => `<tr><td>${ingredient}</td><td>${percent}%</td></tr>`)
      .join('');
    
    return `
      <div class="recipe-card">
        <div class="recipe-header">
          <h3>${code} - ${base.name}</h3>
          <span class="recipe-note">${base.note || ''} ${base.note && defaultAdditivesStr !== 'Aucun' ? '- ' : ''}${defaultAdditivesStr !== 'Aucun' ? 'Additifs par défaut : ' + defaultAdditivesStr : ''}</span>
          ${base.warning ? `<span class="recipe-warning">⚠️ ${base.warning}</span>` : ''}
        </div>
        <table class="recipe-table">
          ${recipeRows}
        </table>
      </div>
    `;
  }).join('');
}

function updateBaseSelects() {
  const allBases = getAllBases();
  const baseCodes = Object.keys(allBases).sort();
  
  const options = baseCodes.map(code => 
    `<option value="${code}">${code} - ${allBases[code].name}</option>`
  ).join('');
  
  // Mettre à jour tous les selects de base
  const filterBase = $('filter-base');
  const formBase = $('base');
  
  if (filterBase) {
    filterBase.innerHTML = '<option value="">Toutes les bases</option>' + options;
  }
  
  if (formBase) {
    formBase.innerHTML = '<option value="">Choisir...</option>' + options;
  }
}

function openNewBase() {
  currentEditBaseCode = null;
  $('modal-base-title').textContent = 'Nouvelle base';
  $('base-form').reset();
  $('btn-delete-base').classList.add('hidden');
  $('base-code').removeAttribute('readonly');
  
  // Réinitialiser les ingrédients
  $('recipe-inputs').innerHTML = `
    <div class="recipe-row">
      <input type="text" class="recipe-ingredient" placeholder="Ingrédient">
      <input type="number" class="recipe-percent" step="0.1" min="0" max="100" placeholder="%">
      <button type="button" class="btn-remove-row" onclick="removeRecipeRow(this)">&times;</button>
    </div>
  `;
  
  $('modal-base').classList.remove('hidden');
}

function openEditBase(code) {
  const allBases = getAllBases();
  const base = allBases[code];
  if (!base) return;
  
  currentEditBaseCode = code;
  $('modal-base-title').textContent = `Modifier ${code}`;
  $('btn-delete-base').classList.remove('hidden');
  
  // Remplir le formulaire
  $('base-code').value = code;
  $('base-code').setAttribute('readonly', 'readonly');
  $('base-name').value = base.name || '';
  $('base-note').value = base.note || '';
  $('base-warning').value = base.warning || '';
  
  // Remplir les ingrédients
  const recipeInputs = $('recipe-inputs');
  const recipeEntries = Object.entries(base.recipe || {});
  
  if (recipeEntries.length === 0) {
    recipeInputs.innerHTML = `
      <div class="recipe-row">
        <input type="text" class="recipe-ingredient" placeholder="Ingrédient">
        <input type="number" class="recipe-percent" step="0.1" min="0" max="100" placeholder="%">
        <button type="button" class="btn-remove-row" onclick="removeRecipeRow(this)">&times;</button>
      </div>
    `;
  } else {
    recipeInputs.innerHTML = recipeEntries.map(([ingredient, percent]) => `
      <div class="recipe-row">
        <input type="text" class="recipe-ingredient" value="${ingredient}" placeholder="Ingrédient">
        <input type="number" class="recipe-percent" value="${percent}" step="0.1" min="0" max="100" placeholder="%">
        <button type="button" class="btn-remove-row" onclick="removeRecipeRow(this)">&times;</button>
      </div>
    `).join('');
  }
  
  // Remplir les additifs par défaut
  ADDITIVE_CODES.forEach(addCode => {
    const input = $(`base-add-${addCode.toLowerCase()}`);
    if (input) {
      input.value = base.defaultAdditives?.[addCode] || '';
    }
  });
  
  $('modal-base').classList.remove('hidden');
}

function closeModalBase() {
  $('modal-base').classList.add('hidden');
  currentEditBaseCode = null;
}

function addRecipeRow() {
  const recipeInputs = $('recipe-inputs');
  const newRow = document.createElement('div');
  newRow.className = 'recipe-row';
  newRow.innerHTML = `
    <input type="text" class="recipe-ingredient" placeholder="Ingrédient">
    <input type="number" class="recipe-percent" step="0.1" min="0" max="100" placeholder="%">
    <button type="button" class="btn-remove-row" onclick="removeRecipeRow(this)">&times;</button>
  `;
  recipeInputs.appendChild(newRow);
}

function removeRecipeRow(btn) {
  const row = btn.parentElement;
  const recipeInputs = $('recipe-inputs');
  
  // Garder au moins une ligne
  if (recipeInputs.children.length > 1) {
    row.remove();
  }
}

async function saveBase(e) {
  e.preventDefault();
  
  const code = $('base-code').value.toUpperCase();
  const name = $('base-name').value;
  
  // Récupérer la recette
  const recipe = {};
  const rows = $('recipe-inputs').querySelectorAll('.recipe-row');
  rows.forEach(row => {
    const ingredient = row.querySelector('.recipe-ingredient').value.trim();
    const percent = parseFloat(row.querySelector('.recipe-percent').value);
    if (ingredient && percent > 0) {
      recipe[ingredient] = percent;
    }
  });
  
  // Récupérer les additifs par défaut
  const defaultAdditives = {};
  ADDITIVE_CODES.forEach(addCode => {
    const input = $(`base-add-${addCode.toLowerCase()}`);
    if (input && input.value) {
      const val = parseFloat(input.value);
      if (val > 0) defaultAdditives[addCode] = val;
    }
  });
  
  const baseData = {
    code,
    name,
    recipe,
    defaultAdditives,
    note: $('base-note').value || '',
    warning: $('base-warning').value || ''
  };
  
  const action = currentEditBaseCode ? 'updateBase' : 'addBase';
  const success = await saveBaseToSheets(baseData, action);
  
  if (success) {
    // Mettre à jour les bases locales
    customBases[code] = {
      name,
      recipe,
      defaultAdditives,
      note: baseData.note,
      warning: baseData.warning
    };
    
    closeModalBase();
    renderBasesList();
    renderRecettesList();
    updateBaseSelects();
  }
}

async function deleteBase() {
  if (!currentEditBaseCode) return;
  
  // Empêcher la suppression des bases par défaut
  if (BASES[currentEditBaseCode]) {
    alert('Impossible de supprimer une base par défaut. Vous pouvez la modifier.');
    return;
  }
  
  if (!confirm(`Supprimer la base ${currentEditBaseCode} ?`)) return;
  
  const success = await deleteBaseFromSheets(currentEditBaseCode);
  
  if (success) {
    delete customBases[currentEditBaseCode];
    closeModalBase();
    renderBasesList();
    renderRecettesList();
    updateBaseSelects();
  }
}

async function syncDefaultBases() {
  if (!confirm('Copier les 6 bases par défaut (B1-B6) vers Google Sheets ?\n\nCela permettra de les modifier depuis l\'interface.')) {
    return;
  }
  
  showSyncStatus('Synchronisation des bases...');
  
  let successCount = 0;
  const baseCodes = Object.keys(BASES);
  
  for (const code of baseCodes) {
    const base = BASES[code];
    const baseData = {
      code,
      name: base.name,
      recipe: base.recipe,
      defaultAdditives: base.defaultAdditives || {},
      note: base.note || '',
      warning: base.warning || ''
    };
    
    const success = await saveBaseToSheets(baseData, 'addBase');
    if (success) {
      successCount++;
      // Ajouter aux bases personnalisées locales
      customBases[code] = {
        name: base.name,
        recipe: base.recipe,
        defaultAdditives: base.defaultAdditives || {},
        note: base.note || '',
        warning: base.warning || ''
      };
    }
  }
  
  showSyncStatus(`${successCount}/${baseCodes.length} bases synchronisées ✓`);
  renderBasesList();
  renderRecettesList();
  updateBaseSelects();
}

function renderDetail(test) {
  const allBases = getAllBases();
  const additivesStr = Object.entries(test.additives || {})
    .map(([k, v]) => `${k}: ${v}%`)
    .join(', ') || 'Aucun';
  
  const defectsStr = (test.defects || [])
    .map(d => DEFECT_LABELS[d])
    .join(', ') || 'Aucun';
  
  elements.detailContent.innerHTML = `
    <div class="detail-header">
      <div class="detail-id">${test.generatedId || test.id}</div>
      <span class="test-badge badge-${test.conclusion || 'pending'}">${CONCLUSION_LABELS[test.conclusion] || 'En attente'}</span>
    </div>
    
    ${test.photo ? `<img src="${test.photo}" alt="" class="detail-photo">` : ''}
    
    <div class="detail-section">
      <h3>Identification</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Base</div>
          <div class="detail-item-value">${test.base} - ${allBases[test.base]?.name || ''}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Date</div>
          <div class="detail-item-value">${test.date || '-'}</div>
        </div>
      </div>
      <div class="detail-item" style="margin-top: 8px">
        <div class="detail-item-label">Additifs</div>
        <div class="detail-item-value">${additivesStr}</div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3>Cuisson</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Cône visé</div>
          <div class="detail-item-value">C${test.targetCone || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Cône réel</div>
          <div class="detail-item-value">${test.actualCone ? 'C' + test.actualCone : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Position</div>
          <div class="detail-item-value">${test.kilnPosition || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Épaisseur</div>
          <div class="detail-item-value">${test.thickness || '-'}</div>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3>Résultat</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Couleur</div>
          <div class="detail-item-value">${test.color || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Intensité</div>
          <div class="detail-item-value">${test.intensity || '-'}/3</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Brillance</div>
          <div class="detail-item-value">${test.gloss || '-'}/3</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Texture</div>
          <div class="detail-item-value">${test.texture || '-'}</div>
        </div>
      </div>
      <div class="detail-item" style="margin-top: 8px">
        <div class="detail-item-label">Défauts</div>
        <div class="detail-item-value">${defectsStr}</div>
      </div>
    </div>
    
    ${test.nextAction ? `
    <div class="detail-section">
      <h3>Prochaine action</h3>
      <p style="color: var(--text)">${test.nextAction}</p>
    </div>
    ` : ''}
    
    ${test.notes ? `
    <div class="detail-section">
      <h3>Notes</h3>
      <p style="color: var(--text-muted)">${test.notes}</p>
    </div>
    ` : ''}
  `;
  
  $('btn-edit-from-detail').onclick = () => {
    elements.modalDetail.classList.add('hidden');
    openEdit(test.id);
  };
}

// ==========================================================================
// ACTIONS
// ==========================================================================

function openNewTest() {
  currentEditId = null;
  currentPhoto = null;
  elements.modalTitle.textContent = 'Nouveau test';
  elements.testForm.reset();
  elements.btnDelete.classList.add('hidden');
  elements.photoPreview.innerHTML = '';
  elements.btnRemovePhoto.classList.add('hidden');
  
  // Date par défaut: aujourd'hui
  $('date').value = new Date().toISOString().split('T')[0];
  
  updateGeneratedId();
  elements.modal.classList.remove('hidden');
}

function openEdit(id) {
  const test = tests.find(t => t.id === id);
  if (!test) return;
  
  currentEditId = id;
  currentPhoto = test.photo || null;
  elements.modalTitle.textContent = 'Modifier le test';
  elements.btnDelete.classList.remove('hidden');
  
  // Remplir le formulaire
  $('base').value = test.base || '';
  $('date').value = test.date || '';
  $('target-cone').value = test.targetCone || '8';
  $('actual-cone').value = test.actualCone || '';
  $('kiln-position').value = test.kilnPosition || '';
  $('thickness').value = test.thickness || '';
  $('application').value = test.application || '';
  $('color').value = test.color || '';
  $('texture').value = test.texture || '';
  $('edge-effect').value = test.edgeEffect || '';
  $('conclusion').value = test.conclusion || 'pending';
  $('next-action').value = test.nextAction || '';
  $('notes').value = test.notes || '';
  
  // Additifs
  ADDITIVE_CODES.forEach(code => {
    const input = $(`add-${code.toLowerCase()}`);
    if (input) input.value = test.additives?.[code] || '';
  });
  
  // Radio buttons
  if (test.intensity) {
    const radio = document.querySelector(`input[name="intensity"][value="${test.intensity}"]`);
    if (radio) radio.checked = true;
  }
  if (test.gloss) {
    const radio = document.querySelector(`input[name="gloss"][value="${test.gloss}"]`);
    if (radio) radio.checked = true;
  }
  
  // Checkboxes défauts
  document.querySelectorAll('input[name="defects"]').forEach(cb => {
    cb.checked = test.defects?.includes(cb.value) || false;
  });
  
  // Photo
  if (test.photo) {
    elements.photoPreview.innerHTML = `<img src="${test.photo}" alt="">`;
    elements.btnRemovePhoto.classList.remove('hidden');
  } else {
    elements.photoPreview.innerHTML = '';
    elements.btnRemovePhoto.classList.add('hidden');
  }
  
  updateGeneratedId();
  elements.modal.classList.remove('hidden');
}

function openDetail(id) {
  const test = tests.find(t => t.id === id);
  if (!test) return;
  
  renderDetail(test);
  elements.modalDetail.classList.remove('hidden');
}

function closeModal() {
  elements.modal.classList.add('hidden');
  currentEditId = null;
  currentPhoto = null;
}

function closeDetail() {
  elements.modalDetail.classList.add('hidden');
}

function toggleSelect(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  renderTestsList(getFilteredTests());
}

function closeCompare() {
  elements.compareView.classList.add('hidden');
  elements.testsList.classList.remove('hidden');
}

function updateGeneratedId() {
  const base = $('base').value;
  const cone = $('target-cone').value;
  const additives = getAdditivesFromForm();
  
  // Pour l'édition, ne pas recalculer le numéro
  if (currentEditId) {
    const test = tests.find(t => t.id === currentEditId);
    if (test) {
      elements.generatedId.textContent = test.generatedId;
      return;
    }
  }
  
  const id = generateTestId(base, additives, cone, tests);
  elements.generatedId.textContent = id;
}

async function saveTest(e) {
  e.preventDefault();
  
  const base = $('base').value;
  const cone = $('target-cone').value;
  const additives = getAdditivesFromForm();
  
  const intensityRadio = document.querySelector('input[name="intensity"]:checked');
  const glossRadio = document.querySelector('input[name="gloss"]:checked');
  const defectsChecked = Array.from(document.querySelectorAll('input[name="defects"]:checked'))
    .map(cb => cb.value);
  
  const testData = {
    id: currentEditId || crypto.randomUUID(),
    generatedId: currentEditId 
      ? tests.find(t => t.id === currentEditId)?.generatedId 
      : generateTestId(base, additives, cone, tests),
    base,
    additives,
    date: $('date').value,
    targetCone: cone,
    actualCone: $('actual-cone').value,
    kilnPosition: $('kiln-position').value,
    thickness: $('thickness').value,
    application: $('application').value,
    color: $('color').value,
    intensity: intensityRadio?.value || null,
    gloss: glossRadio?.value || null,
    texture: $('texture').value,
    edgeEffect: $('edge-effect').value,
    defects: defectsChecked,
    conclusion: $('conclusion').value,
    nextAction: $('next-action').value,
    notes: $('notes').value,
    photo: currentPhoto,
    updatedAt: new Date().toISOString()
  };
  
  // Sauvegarder vers Google Sheets
  const action = currentEditId ? 'update' : 'add';
  const success = await saveTestToSheets(testData, action);
  
  if (success) {
    if (currentEditId) {
      const index = tests.findIndex(t => t.id === currentEditId);
      if (index !== -1) {
        tests[index] = { ...tests[index], ...testData };
      }
    } else {
      testData.createdAt = new Date().toISOString();
      tests.unshift(testData);
    }
    
    closeModal();
    renderTestsList(getFilteredTests());
  }
}

async function deleteTest() {
  if (!currentEditId) return;
  if (!confirm('Supprimer ce test ?')) return;
  
  const success = await deleteTestFromSheets(currentEditId);
  
  if (success) {
    tests = tests.filter(t => t.id !== currentEditId);
    closeModal();
    renderTestsList(getFilteredTests());
  }
}

// ==========================================================================
// FILTERS
// ==========================================================================

function getFilteredTests() {
  const search = elements.searchInput.value.toLowerCase();
  const baseFilter = elements.filterBase.value;
  const conclusionFilter = elements.filterConclusion.value;
  
  return tests.filter(test => {
    if (baseFilter && test.base !== baseFilter) return false;
    if (conclusionFilter && test.conclusion !== conclusionFilter) return false;
    if (search) {
      const searchStr = `${test.generatedId} ${test.color} ${test.notes}`.toLowerCase();
      if (!searchStr.includes(search)) return false;
    }
    return true;
  });
}

function applyFilters() {
  renderTestsList(getFilteredTests());
}

// ==========================================================================
// PHOTO
// ==========================================================================

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Redimensionner et compresser
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const maxSize = 800;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      currentPhoto = canvas.toDataURL('image/jpeg', 0.7);
      elements.photoPreview.innerHTML = `<img src="${currentPhoto}" alt="">`;
      elements.btnRemovePhoto.classList.remove('hidden');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  currentPhoto = null;
  elements.photoPreview.innerHTML = '';
  elements.btnRemovePhoto.classList.add('hidden');
  elements.photoInput.value = '';
}

// ==========================================================================
// IMPORT / EXPORT
// ==========================================================================

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tests: tests
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `emaux-tests-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  $('import-file').click();
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(event) {
    try {
      const data = JSON.parse(event.target.result);
      
      if (!data.tests || !Array.isArray(data.tests)) {
        alert('Format de fichier invalide');
        return;
      }
      
      const action = confirm(
        `Importer ${data.tests.length} tests ?\n\n` +
        'OK = Fusionner avec les tests existants\n' +
        'Annuler = Abandonner'
      );
      
      if (!action) return;
      
      // Fusionner en évitant les doublons (par ID)
      const existingIds = new Set(tests.map(t => t.id));
      const newTests = data.tests.filter(t => !existingIds.has(t.id));
      
      tests = [...newTests, ...tests];
      
      // Synchroniser vers Google Sheets
      const success = await syncAllToSheets(tests);
      
      if (success) {
        renderTestsList(getFilteredTests());
        alert(`${newTests.length} nouveaux tests importés et synchronisés`);
      } else {
        alert('Tests importés localement mais erreur de synchronisation');
        renderTestsList(getFilteredTests());
      }
    } catch (err) {
      alert('Erreur de lecture du fichier: ' + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ==========================================================================
// INITIAL DATA
// ==========================================================================

async function loadInitialData() {
  if (tests.length > 0) return;
  
  // Plan de tests initial (vides, à remplir)
  const initialTests = [
    // Bloc A - Base Beurre
    { base: 'B3', additives: {}, targetCone: '8' },
    { base: 'B3', additives: { Cu: 1 }, targetCone: '8' },
    { base: 'B3', additives: { Cu: 2 }, targetCone: '8' },
    { base: 'B3', additives: { Fe: 1 }, targetCone: '8' },
    { base: 'B3', additives: { Fe: 2 }, targetCone: '8' },
    { base: 'B3', additives: { Co: 0.2 }, targetCone: '8' },
    { base: 'B3', additives: { Co: 0.5 }, targetCone: '8' },
    { base: 'B3', additives: { Ru: 3 }, targetCone: '8' },
    
    // Bloc B - Base Blanc
    { base: 'B5', additives: {}, targetCone: '8' },
    { base: 'B5', additives: { Cu: 2 }, targetCone: '8' },
    { base: 'B5', additives: { Fe: 2 }, targetCone: '8' },
    { base: 'B5', additives: { Co: 0.5 }, targetCone: '8' },
    
    // Bloc C - Soft Green progression
    { base: 'B1', additives: { Cu: 3 }, targetCone: '8' },
    { base: 'B1', additives: { Cu: 3, Ru: 3 }, targetCone: '8' },
    { base: 'B1', additives: { Cu: 3, Ru: 3, Fe: 1.5 }, targetCone: '8' },
    { base: 'B1', additives: { Cu: 3, Ru: 3, Fe: 1.5, Co: 0.5 }, targetCone: '8' },
    
    // Bloc D - Divers
    { base: 'B4', additives: { Fe: 6, Cu: 3 }, targetCone: '8' },
    { base: 'B6', additives: { Cu: 3 }, targetCone: '8' },
    { base: 'B2', additives: { Ni: 2, Co: 0.5 }, targetCone: '9' },
    { base: 'B3', additives: { Cu: 2, Fe: 2 }, targetCone: '8' }
  ];
  
  tests = initialTests.map((t, i) => ({
    id: crypto.randomUUID(),
    generatedId: generateTestId(t.base, t.additives, t.targetCone, tests.slice(0, i)),
    ...t,
    date: '',
    conclusion: 'pending',
    createdAt: new Date().toISOString()
  }));
  
  // Synchroniser les données initiales vers Google Sheets
  await syncAllToSheets(tests);
}

// ==========================================================================
// TABS NAVIGATION
// ==========================================================================

function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = `tab-${tab.dataset.tab}`;
      
      // Désactiver tous les onglets
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Activer l'onglet cliqué
      tab.classList.add('active');
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// ==========================================================================
// INIT
// ==========================================================================

async function init() {
  // Initialiser la navigation par onglets
  initTabs();
  
  // Charger les bases personnalisées depuis Google Sheets
  const customBasesArray = await loadBasesFromSheets();
  customBasesArray.forEach(base => {
    customBases[base.code] = {
      name: base.name,
      recipe: base.recipe || {},
      defaultAdditives: base.defaultAdditives || {},
      note: base.note || '',
      warning: base.warning || ''
    };
  });
  
  // Mettre à jour les selects avec toutes les bases
  updateBaseSelects();
  
  // Charger les tests depuis Google Sheets
  tests = await loadTestsFromSheets();
  
  // Si aucun test, charger les données initiales
  await loadInitialData();
  
  renderTestsList();
  renderBasesList();
  renderRecettesList();
  
  // Event listeners - Tests
  $('btn-new').addEventListener('click', openNewTest);
  $('btn-close-modal').addEventListener('click', closeModal);
  $('btn-close-detail').addEventListener('click', closeDetail);
  $('btn-delete').addEventListener('click', deleteTest);
  $('btn-compare').addEventListener('click', renderCompareTable);
  $('btn-close-compare').addEventListener('click', closeCompare);
  $('btn-export').addEventListener('click', exportData);
  $('btn-import').addEventListener('click', importData);
  $('import-file').addEventListener('change', handleImport);
  $('btn-remove-photo').addEventListener('click', removePhoto);
  
  elements.testForm.addEventListener('submit', saveTest);
  elements.photoInput.addEventListener('change', handlePhotoUpload);
  
  // Event listeners - Bases
  $('btn-new-base').addEventListener('click', openNewBase);
  $('btn-sync-bases').addEventListener('click', syncDefaultBases);
  $('btn-close-modal-base').addEventListener('click', closeModalBase);
  $('btn-delete-base').addEventListener('click', deleteBase);
  $('btn-add-ingredient').addEventListener('click', addRecipeRow);
  $('base-form').addEventListener('submit', saveBase);
  
  // Fermer modal base en cliquant à l'extérieur
  $('modal-base').addEventListener('click', e => {
    if (e.target === $('modal-base')) closeModalBase();
  });
  
  // Filtres
  elements.searchInput.addEventListener('input', applyFilters);
  elements.filterBase.addEventListener('change', applyFilters);
  elements.filterConclusion.addEventListener('change', applyFilters);
  
  // Update ID en temps réel
  $('base').addEventListener('change', updateGeneratedId);
  $('target-cone').addEventListener('change', updateGeneratedId);
  ADDITIVE_CODES.forEach(code => {
    const input = $(`add-${code.toLowerCase()}`);
    if (input) input.addEventListener('input', updateGeneratedId);
  });
  
  // Fermer modals en cliquant à l'extérieur
  elements.modal.addEventListener('click', e => {
    if (e.target === elements.modal) closeModal();
  });
  elements.modalDetail.addEventListener('click', e => {
    if (e.target === elements.modalDetail) closeDetail();
  });
  
  // Raccourcis clavier
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeDetail();
      closeCompare();
      closeModalBase();
    }
  });
}

document.addEventListener('DOMContentLoaded', checkAuth);
