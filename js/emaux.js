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

// Formater une date YYYY-MM-DD en DD/MM/YYYY (format français)
function formatDateFR(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

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

// Données par défaut (seront remplacées par celles de Google Sheets)
const DEFAULT_TERRES = [
  { code: 'GSA T40', name: 'GSA T40', isDefault: true },
  { code: 'GE221PY', name: 'GE221PY', isDefault: false }
];

const DEFAULT_ADDITIFS = [
  { code: 'Cu', name: 'Cuivre', description: 'verts, rouges en réduction', max: 20 },
  { code: 'Fe', name: 'Fer', description: 'bruns, rouilles, céladons', max: 20 },
  { code: 'Co', name: 'Cobalt', description: 'bleus intenses', max: 5 },
  { code: 'Ru', name: 'Rutile', description: 'effets nacrés, moirés', max: 10 },
  { code: 'Ni', name: 'Nickel', description: 'gris, bruns', max: 10 },
  { code: 'Ti', name: 'Titane', description: 'opacifiant, blancs', max: 15 },
  { code: 'Zr', name: 'Zircon', description: 'opacifiant', max: 15 },
  { code: 'Sn', name: 'Étain', description: 'opacifiant, blancs', max: 15 },
  { code: 'Cr', name: 'Chrome', description: 'verts, roses avec étain', max: 10 },
  { code: 'Li', name: 'Lithium', description: 'fondant, bleus', max: 10 },
  { code: 'Zn', name: 'Zinc', description: 'cristallisations', max: 15 }
];

// Données dynamiques (chargées depuis Google Sheets)
let terres = [];
let additifs = [];
let cuissons = [];

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

const CUISSON_TYPE_LABELS = {
  email: 'Émail',
  degourdi: 'Dégourdi'
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

// ==========================================================================
// TERRES & ADDITIFS STORAGE (Google Sheets)
// ==========================================================================

async function loadTerresFromSheets() {
  try {
    const response = await fetch(SHEETS_API_URL + '?type=terres');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    return DEFAULT_TERRES;
  } catch (e) {
    console.error('Erreur chargement terres:', e);
    return DEFAULT_TERRES;
  }
}

async function saveTerreToSheets(terre, action = 'updateTerre') {
  try {
    isSyncing = true;
    showSyncStatus('Sauvegarde terre...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, terre })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Terre sauvegardée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur sauvegarde terre');
    }
  } catch (e) {
    console.error('Erreur sauvegarde terre:', e);
    showSyncStatus('Erreur de sauvegarde', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

async function deleteTerreFromSheets(code) {
  try {
    isSyncing = true;
    showSyncStatus('Suppression terre...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteTerre', code })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Terre supprimée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur suppression terre');
    }
  } catch (e) {
    console.error('Erreur suppression terre:', e);
    showSyncStatus('Erreur de suppression', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

async function loadAdditifsFromSheets() {
  try {
    const response = await fetch(SHEETS_API_URL + '?type=additifs');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    return DEFAULT_ADDITIFS;
  } catch (e) {
    console.error('Erreur chargement additifs:', e);
    return DEFAULT_ADDITIFS;
  }
}

async function saveAdditifToSheets(additif, action = 'updateAdditif') {
  try {
    isSyncing = true;
    showSyncStatus('Sauvegarde additif...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, additif })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Additif sauvegardé ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur sauvegarde additif');
    }
  } catch (e) {
    console.error('Erreur sauvegarde additif:', e);
    showSyncStatus('Erreur de sauvegarde', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

async function deleteAdditifFromSheets(code) {
  try {
    isSyncing = true;
    showSyncStatus('Suppression additif...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteAdditif', code })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Additif supprimé ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur suppression additif');
    }
  } catch (e) {
    console.error('Erreur suppression additif:', e);
    showSyncStatus('Erreur de suppression', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

// ==========================================================================
// CUISSONS STORAGE (Google Sheets)
// ==========================================================================

async function loadCuissonsFromSheets() {
  try {
    const response = await fetch(SHEETS_API_URL + '?type=cuissons');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      return result.data;
    }
    return [];
  } catch (e) {
    console.error('Erreur chargement cuissons:', e);
    return [];
  }
}

async function saveCuissonToSheets(cuisson, action = 'updateCuisson') {
  try {
    isSyncing = true;
    showSyncStatus('Sauvegarde cuisson...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, cuisson })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Cuisson sauvegardée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur sauvegarde cuisson');
    }
  } catch (e) {
    console.error('Erreur sauvegarde cuisson:', e);
    showSyncStatus('Erreur de sauvegarde', true);
    return false;
  } finally {
    isSyncing = false;
  }
}

async function deleteCuissonFromSheets(id) {
  try {
    isSyncing = true;
    showSyncStatus('Suppression cuisson...');
    
    const response = await fetch(SHEETS_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteCuisson', id })
    });
    const result = await response.json();
    
    if (result.success) {
      showSyncStatus('Cuisson supprimée ✓');
      return true;
    } else {
      throw new Error(result.error || 'Erreur suppression cuisson');
    }
  } catch (e) {
    console.error('Erreur suppression cuisson:', e);
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

function getAdditiveCodes() {
  // Utiliser les additifs dynamiques ou les codes par défaut
  return additifs.length > 0 
    ? additifs.map(a => a.code) 
    : ADDITIVE_CODES;
}

function generateTestId(base, testAdditives, cone, tests) {
  if (!base) return '-';
  
  let parts = [base];
  
  // Ajouter les additifs dans l'ordre
  getAdditiveCodes().forEach(code => {
    const value = testAdditives[code];
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
  const result = {};
  getAdditiveCodes().forEach(code => {
    const input = document.getElementById(`add-${code.toLowerCase()}`);
    if (input && input.value) {
      const val = parseFloat(input.value);
      if (val > 0) result[code] = val;
    }
  });
  return result;
}

// ==========================================================================
// STATE
// ==========================================================================

let tests = [];
let customBases = {};  // Bases personnalisées chargées depuis Sheets
let selectedIds = new Set();
let currentEditId = null;
let currentEditBaseCode = null;
let currentEditCuissonId = null;

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
  filterTerre: $('filter-terre'),
  filterConclusion: $('filter-conclusion'),
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
            <span>${formatDateFR(test.date)}</span>
            <span class="test-badge ${badgeClass}">${badgeLabel}</span>
          </div>
          ${test.color ? `<div class="test-color">${test.color}</div>` : ''}
        </div>
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

// ==========================================================================
// TERRES & ADDITIFS MANAGEMENT
// ==========================================================================

function renderTerresList() {
  const terresList = $('terres-list');
  if (!terresList) return;
  
  if (terres.length === 0) {
    terresList.innerHTML = '<p class="empty-config">Aucune terre configurée</p>';
    return;
  }
  
  terresList.innerHTML = terres.map(terre => `
    <div class="config-item" data-code="${terre.code}">
      <div class="config-item-info">
        <span class="config-item-code">${terre.code}</span>
        ${terre.isDefault ? '<span class="config-item-default">(par défaut)</span>' : ''}
      </div>
      <div class="config-item-actions">
        ${terre.isDefault ? '<button class="btn btn-small btn-secondary" onclick="unsetDefaultTerre(\'${terre.code}\')">Retirer défaut</button>' : `<button class="btn btn-small btn-secondary" onclick="setDefaultTerre('${terre.code}')">Défaut</button>`}
        <button class="btn btn-small btn-danger" onclick="deleteTerre('${terre.code}')">Suppr.</button>
      </div>
    </div>
  `).join('');
}

function renderAdditifsList() {
  const additifsList = $('additifs-list');
  if (!additifsList) return;
  
  if (additifs.length === 0) {
    additifsList.innerHTML = '<p class="empty-config">Aucun additif configuré</p>';
    return;
  }
  
  additifsList.innerHTML = additifs.map(add => `
    <div class="config-item" data-code="${add.code}">
      <div class="config-item-info">
        <span class="config-item-code">${add.code}</span>
        <span class="config-item-name">${add.name}</span>
        <span class="config-item-desc">${add.description || ''}</span>
      </div>
      <div class="config-item-actions">
        <span class="config-item-max">max ${add.max}%</span>
        <button class="btn btn-small btn-danger" onclick="deleteAdditif('${add.code}')">Suppr.</button>
      </div>
    </div>
  `).join('');
}

function updateTerreSelect() {
  const terreSelect = $('terre');
  const filterTerre = $('filter-terre');
  
  const options = terres.map(terre => 
    `<option value="${terre.code}" ${terre.isDefault ? 'selected' : ''}>${terre.code}</option>`
  ).join('');
  
  // Select du formulaire
  if (terreSelect) {
    if (terres.length === 0) {
      terreSelect.innerHTML = '<option value="">-</option>';
    } else {
      terreSelect.innerHTML = options;
    }
  }
  
  // Filtre par terre
  if (filterTerre) {
    filterTerre.innerHTML = '<option value="">Toutes les terres</option>' + 
      terres.map(terre => `<option value="${terre.code}">${terre.code}</option>`).join('');
  }
}

function renderAdditivesGrid() {
  const grid = $('additives-grid');
  if (!grid) return;
  
  grid.innerHTML = additifs.map(add => `
    <div class="additive-input">
      <label for="add-${add.code.toLowerCase()}">${add.code}</label>
      <input type="number" id="add-${add.code.toLowerCase()}" step="0.1" min="0" max="${add.max}" placeholder="0">
    </div>
  `).join('');
  
  // Rebind event listeners pour la mise à jour de l'ID généré
  additifs.forEach(add => {
    const input = $(`add-${add.code.toLowerCase()}`);
    if (input) {
      input.addEventListener('input', updateGeneratedId);
    }
  });
}

function renderBaseAdditivesGrid() {
  const grid = $('base-additives-grid');
  if (!grid) return;
  
  grid.innerHTML = additifs.map(add => `
    <div class="additive-input">
      <label for="base-add-${add.code.toLowerCase()}">${add.code}</label>
      <input type="number" id="base-add-${add.code.toLowerCase()}" step="0.1" min="0" max="${add.max}" placeholder="0">
    </div>
  `).join('');
}

async function addTerre() {
  const code = prompt('Code de la terre (ex: GSA T40) :');
  if (!code || !code.trim()) return;
  
  const trimmedCode = code.trim();
  
  // Vérifier si existe déjà
  if (terres.find(t => t.code === trimmedCode)) {
    alert('Cette terre existe déjà');
    return;
  }
  
  const newTerre = {
    code: trimmedCode,
    name: trimmedCode,
    isDefault: terres.length === 0  // Première terre = défaut
  };
  
  const success = await saveTerreToSheets(newTerre, 'addTerre');
  
  if (success) {
    terres.push(newTerre);
    renderTerresList();
    updateTerreSelect();
  }
}

async function deleteTerre(code) {
  if (!confirm(`Supprimer la terre "${code}" ?`)) return;
  
  const success = await deleteTerreFromSheets(code);
  
  if (success) {
    terres = terres.filter(t => t.code !== code);
    
    // Si c'était la terre par défaut, mettre la première comme défaut
    if (terres.length > 0 && !terres.find(t => t.isDefault)) {
      terres[0].isDefault = true;
      await saveTerreToSheets(terres[0], 'updateTerre');
    }
    
    renderTerresList();
    updateTerreSelect();
  }
}

async function setDefaultTerre(code) {
  // Retirer le défaut de l'ancienne
  const oldDefault = terres.find(t => t.isDefault);
  if (oldDefault) {
    oldDefault.isDefault = false;
    await saveTerreToSheets(oldDefault, 'updateTerre');
  }
  
  // Mettre le défaut sur la nouvelle
  const newDefault = terres.find(t => t.code === code);
  if (newDefault) {
    newDefault.isDefault = true;
    await saveTerreToSheets(newDefault, 'updateTerre');
  }
  
  renderTerresList();
  updateTerreSelect();
}

async function addAdditif() {
  const code = prompt('Code de l\'additif (ex: Mn) :');
  if (!code || !code.trim()) return;
  
  const trimmedCode = code.trim();
  
  // Vérifier si existe déjà
  if (additifs.find(a => a.code === trimmedCode)) {
    alert('Cet additif existe déjà');
    return;
  }
  
  const name = prompt('Nom complet (ex: Manganèse) :') || trimmedCode;
  const description = prompt('Description (ex: violets, bruns) :') || '';
  const maxStr = prompt('Pourcentage maximum (ex: 10) :') || '10';
  const max = parseFloat(maxStr) || 10;
  
  const newAdditif = { code: trimmedCode, name, description, max };
  
  const success = await saveAdditifToSheets(newAdditif, 'addAdditif');
  
  if (success) {
    additifs.push(newAdditif);
    renderAdditifsList();
    renderAdditivesGrid();
    renderBaseAdditivesGrid();
    renderFilterAdditifs();
  }
}

async function deleteAdditif(code) {
  if (!confirm(`Supprimer l'additif "${code}" ?`)) return;
  
  const success = await deleteAdditifFromSheets(code);
  
  if (success) {
    additifs = additifs.filter(a => a.code !== code);
    renderAdditifsList();
    renderAdditivesGrid();
    renderBaseAdditivesGrid();
    renderFilterAdditifs();
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
  
  // Réinitialiser les additifs par défaut (grille dynamique)
  renderBaseAdditivesGrid();
  
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
  
  // Régénérer la grille des additifs et remplir les valeurs
  renderBaseAdditivesGrid();
  getAdditiveCodes().forEach(addCode => {
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
  getAdditiveCodes().forEach(addCode => {
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
    
    <div class="detail-section">
      <h3>Identification</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Base</div>
          <div class="detail-item-value">${test.base} - ${allBases[test.base]?.name || ''}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Terre</div>
          <div class="detail-item-value">${test.terre || '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Date</div>
          <div class="detail-item-value">${formatDateFR(test.date)}</div>
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
  
  $('btn-duplicate-from-detail').onclick = () => {
    elements.modalDetail.classList.add('hidden');
    duplicateTest(test);
  };
  
  $('btn-export-test-pdf').onclick = () => {
    exportTestPDF(test.id);
  };
}

// ==========================================================================
// ACTIONS
// ==========================================================================

function openNewTest() {
  currentEditId = null;
  elements.modalTitle.textContent = 'Nouveau test';
  elements.testForm.reset();
  elements.btnDelete.classList.add('hidden');
  
  // Date par défaut: aujourd'hui
  $('date').value = new Date().toISOString().split('T')[0];
  
  updateGeneratedId();
  elements.modal.classList.remove('hidden');
}

function duplicateTest(sourceTest) {
  // Ouvrir le formulaire en mode création avec les données pré-remplies
  currentEditId = null;
  elements.modalTitle.textContent = 'Dupliquer le test';
  elements.btnDelete.classList.add('hidden');
  
  // Remplir le formulaire avec les données du test source
  $('base').value = sourceTest.base || '';
  $('terre').value = sourceTest.terre || '';
  $('date').value = new Date().toISOString().split('T')[0]; // Date du jour
  $('target-cone').value = sourceTest.targetCone || '8';
  $('actual-cone').value = ''; // Réinitialiser le cône réel
  $('cuisson-link').value = ''; // Réinitialiser la cuisson (nouvelle cuisson probable)
  $('kiln-position').value = sourceTest.kilnPosition || '';
  $('thickness').value = sourceTest.thickness || '';
  $('application').value = sourceTest.application || '';
  $('color').value = ''; // Réinitialiser la couleur
  $('texture').value = '';
  $('edge-effect').value = '';
  $('conclusion').value = 'pending'; // Remettre en attente
  $('next-action').value = '';
  $('notes').value = `Dupliqué depuis ${sourceTest.generatedId}`;
  
  // Additifs
  getAdditiveCodes().forEach(code => {
    const input = $(`add-${code.toLowerCase()}`);
    if (input) input.value = sourceTest.additives?.[code] || '';
  });
  
  // Réinitialiser radio buttons
  document.querySelectorAll('input[name="intensity"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="gloss"]').forEach(r => r.checked = false);
  
  // Réinitialiser checkboxes défauts
  document.querySelectorAll('input[name="defects"]').forEach(cb => cb.checked = false);
  
  updateGeneratedId();
  elements.modal.classList.remove('hidden');
}

function openEdit(id) {
  const test = tests.find(t => t.id === id);
  if (!test) return;
  
  currentEditId = id;
  elements.modalTitle.textContent = 'Modifier le test';
  elements.btnDelete.classList.remove('hidden');
  
  // Remplir le formulaire
  $('base').value = test.base || '';
  $('terre').value = test.terre || '';
  $('date').value = test.date || new Date().toISOString().split('T')[0];
  $('target-cone').value = test.targetCone || '8';
  $('actual-cone').value = test.actualCone || '';
  $('cuisson-link').value = test.cuissonId || '';
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
  getAdditiveCodes().forEach(code => {
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
    terre: $('terre').value,
    additives,
    date: $('date').value || new Date().toISOString().split('T')[0],
    targetCone: cone,
    actualCone: $('actual-cone').value,
    cuissonId: $('cuisson-link').value || null,
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
  const terreFilter = elements.filterTerre.value;
  const conclusionFilter = elements.filterConclusion.value;
  
  // Filtres avancés - Additifs
  const selectedAdditifs = Array.from(document.querySelectorAll('input[name="filter-additif"]:checked'))
    .map(cb => cb.value);
  
  // Filtres avancés - Défauts
  const selectedDefects = Array.from(document.querySelectorAll('input[name="filter-defect"]:checked'))
    .map(cb => cb.value);
  
  return tests.filter(test => {
    if (baseFilter && test.base !== baseFilter) return false;
    if (terreFilter && test.terre !== terreFilter) return false;
    if (conclusionFilter && test.conclusion !== conclusionFilter) return false;
    
    // Filtre recherche texte (élargi)
    if (search) {
      const searchStr = `${test.generatedId} ${test.color} ${test.notes} ${test.texture} ${test.edgeEffect}`.toLowerCase();
      if (!searchStr.includes(search)) return false;
    }
    
    // Filtre additifs (doit contenir TOUS les additifs sélectionnés)
    if (selectedAdditifs.length > 0) {
      const testAdditifs = Object.keys(test.additives || {});
      const hasAllAdditifs = selectedAdditifs.every(add => testAdditifs.includes(add));
      if (!hasAllAdditifs) return false;
    }
    
    // Filtre défauts (doit contenir AU MOINS UN des défauts sélectionnés)
    if (selectedDefects.length > 0) {
      const testDefects = test.defects || [];
      const hasAnyDefect = selectedDefects.some(def => testDefects.includes(def));
      if (!hasAnyDefect) return false;
    }
    
    return true;
  });
}

function applyFilters() {
  renderTestsList(getFilteredTests());
}

function toggleAdvancedFilters() {
  const panel = $('advanced-filters');
  const btn = $('btn-toggle-advanced');
  
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    btn.textContent = '- Filtres';
  } else {
    panel.classList.add('hidden');
    btn.textContent = '+ Filtres';
  }
}

function renderFilterAdditifs() {
  const container = $('filter-additifs');
  if (!container) return;
  
  container.innerHTML = additifs.map(add => `
    <label class="filter-cb">
      <input type="checkbox" name="filter-additif" value="${add.code}"> ${add.code}
    </label>
  `).join('');
  
  // Ajouter les event listeners
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
}

function clearAdvancedFilters() {
  // Décocher tous les checkboxes
  document.querySelectorAll('input[name="filter-additif"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="filter-defect"]').forEach(cb => cb.checked = false);
  
  // Réinitialiser les selects
  elements.filterBase.value = '';
  elements.filterTerre.value = '';
  elements.filterConclusion.value = '';
  elements.searchInput.value = '';
  
  applyFilters();
}

// ==========================================================================
// PHOTO
// ==========================================================================

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
  const tabNames = Array.from(tabs).map(t => t.dataset.tab);
  
  function switchToTab(tabName) {
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    if (!tab) return;
    
    const targetId = `tab-${tabName}`;
    
    // Désactiver tous les onglets
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Activer l'onglet
    tab.classList.add('active');
    document.getElementById(targetId).classList.add('active');
    
    // Scroll l'onglet actif dans la barre de navigation
    tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    
    // Render stats quand on ouvre l'onglet stats
    if (tabName === 'stats') {
      renderStats();
    }
  }
  
  function getCurrentTabIndex() {
    const activeTab = document.querySelector('.tab.active');
    return tabNames.indexOf(activeTab?.dataset.tab || 'tests');
  }
  
  // Click sur onglets
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchToTab(tab.dataset.tab));
  });
  
  // Swipe pour naviguer entre onglets (mobile)
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 50;
  
  document.addEventListener('touchstart', e => {
    // Ignorer si on est dans un modal
    if (e.target.closest('.modal:not(.hidden)')) return;
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  document.addEventListener('touchend', e => {
    // Ignorer si on est dans un modal
    if (e.target.closest('.modal:not(.hidden)')) return;
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) < minSwipeDistance) return;
    
    const currentIndex = getCurrentTabIndex();
    
    if (swipeDistance > 0 && currentIndex > 0) {
      // Swipe droite -> onglet précédent
      switchToTab(tabNames[currentIndex - 1]);
    } else if (swipeDistance < 0 && currentIndex < tabNames.length - 1) {
      // Swipe gauche -> onglet suivant
      switchToTab(tabNames[currentIndex + 1]);
    }
  }
}

// ==========================================================================
// RECETTES À PRÉPARER
// ==========================================================================

function generateRecipes() {
  // Récupérer les tests "En attente"
  const pendingTests = tests.filter(t => t.conclusion === 'pending' || !t.conclusion);
  
  if (pendingTests.length === 0) {
    alert('Aucun test en attente à préparer.');
    return;
  }
  
  const allBases = getAllBases();
  const baseQuantity = 100; // grammes
  
  let html = `<p class="recipes-intro">Tests en attente : <strong>${pendingTests.length}</strong> — Base : <strong>${baseQuantity}g</strong></p>`;
  
  pendingTests.forEach(test => {
    const base = allBases[test.base];
    if (!base) return;
    
    const baseName = base.name || test.base;
    const recipe = base.recipe || {};
    
    // Calculer les quantités pour la base
    let recipeRows = '';
    Object.entries(recipe).forEach(([ingredient, percent]) => {
      const quantity = (percent * baseQuantity / 100).toFixed(1);
      recipeRows += `<tr><td>${ingredient}</td><td class="recipe-percent">${percent}%</td><td class="recipe-qty">${quantity}g</td></tr>`;
    });
    
    // Additifs
    let additivesRows = '';
    const additives = test.additives || {};
    Object.entries(additives).forEach(([code, percent]) => {
      if (percent > 0) {
        const quantity = (percent * baseQuantity / 100).toFixed(1);
        const additifInfo = additifs.find(a => a.code === code);
        const name = additifInfo ? additifInfo.name : code;
        additivesRows += `<tr class="additif-row"><td>${name} (${code})</td><td class="recipe-percent">${percent}%</td><td class="recipe-qty">${quantity}g</td></tr>`;
      }
    });
    
    html += `
      <div class="recipe-card">
        <div class="recipe-header">
          <h3>${test.generatedId || test.id}</h3>
          <span class="recipe-base">${test.base} - ${baseName}</span>
        </div>
        <table class="recipe-table">
          <thead>
            <tr><th>Ingrédient</th><th>%</th><th>Quantité</th></tr>
          </thead>
          <tbody>
            ${recipeRows}
            ${additivesRows ? '<tr class="separator"><td colspan="3">Additifs</td></tr>' + additivesRows : ''}
          </tbody>
        </table>
        ${test.terre ? `<p class="recipe-terre">Terre : ${test.terre}</p>` : ''}
        ${test.notes ? `<p class="recipe-notes">Notes : ${test.notes}</p>` : ''}
      </div>
    `;
  });
  
  $('recipes-content').innerHTML = html;
  $('modal-recipes').classList.remove('hidden');
}

function printRecipes() {
  const content = $('recipes-content').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Recettes à préparer</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        .recipes-intro { text-align: center; margin-bottom: 20px; color: #666; }
        .recipe-card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
        .recipe-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
        .recipe-header h3 { margin: 0; font-size: 1.2rem; }
        .recipe-base { color: #666; font-size: 0.9rem; }
        .recipe-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .recipe-table th, .recipe-table td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #eee; }
        .recipe-table th { background: #f5f5f5; font-size: 0.85rem; }
        .recipe-percent, .recipe-qty { text-align: right; }
        .recipe-qty { font-weight: 600; }
        .additif-row { background: #f9f9f9; }
        .separator td { font-weight: 600; font-size: 0.85rem; color: #666; padding-top: 12px; }
        .recipe-terre, .recipe-notes { font-size: 0.85rem; color: #666; margin: 4px 0; }
        @media print { .recipe-card { break-inside: avoid; } }
      </style>
    </head>
    <body>
      <h1>Recettes à préparer</h1>
      ${content}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function closeRecipes() {
  $('modal-recipes').classList.add('hidden');
}

// ==========================================================================
// EXPORT PDF
// ==========================================================================

function exportTestPDF(testId) {
  const test = tests.find(t => t.id === testId);
  if (!test) return;
  
  const allBases = getAllBases();
  const additivesStr = Object.entries(test.additives || {})
    .map(([k, v]) => `${k}: ${v}%`)
    .join(', ') || 'Aucun';
  const defectsStr = (test.defects || [])
    .map(d => DEFECT_LABELS[d])
    .join(', ') || 'Aucun';
  
  const printContent = `
    <div class="print-container">
      <div class="print-header">
        <h1>${test.generatedId || test.id}</h1>
        <div class="print-date">Test du ${formatDateFR(test.date)}</div>
        <span class="print-badge">${CONCLUSION_LABELS[test.conclusion] || 'En attente'}</span>
      </div>
      

      
      <div class="print-section">
        <h2>Identification</h2>
        <div class="print-grid">
          <div class="print-item">
            <div class="print-item-label">Base</div>
            <div class="print-item-value">${test.base} - ${allBases[test.base]?.name || ''}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Terre</div>
            <div class="print-item-value">${test.terre || '-'}</div>
          </div>
        </div>
        <div class="print-item">
          <div class="print-item-label">Additifs</div>
          <div class="print-item-value">${additivesStr}</div>
        </div>
      </div>
      
      <div class="print-section">
        <h2>Cuisson</h2>
        <div class="print-grid">
          <div class="print-item">
            <div class="print-item-label">Cône visé</div>
            <div class="print-item-value">C${test.targetCone || '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Cône réel</div>
            <div class="print-item-value">${test.actualCone ? 'C' + test.actualCone : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Position</div>
            <div class="print-item-value">${test.kilnPosition || '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Épaisseur</div>
            <div class="print-item-value">${test.thickness || '-'}</div>
          </div>
        </div>
      </div>
      
      <div class="print-section">
        <h2>Résultat</h2>
        <div class="print-grid">
          <div class="print-item">
            <div class="print-item-label">Couleur</div>
            <div class="print-item-value">${test.color || '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Intensité</div>
            <div class="print-item-value">${test.intensity || '-'}/3</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Brillance</div>
            <div class="print-item-value">${test.gloss || '-'}/3</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Texture</div>
            <div class="print-item-value">${test.texture || '-'}</div>
          </div>
        </div>
        <div class="print-item">
          <div class="print-item-label">Défauts</div>
          <div class="print-item-value">${defectsStr}</div>
        </div>
      </div>
      
      ${test.notes ? `
      <div class="print-section">
        <h2>Notes</h2>
        <p>${test.notes}</p>
      </div>
      ` : ''}
      
      ${test.nextAction ? `
      <div class="print-section">
        <h2>Prochaine action</h2>
        <p>${test.nextAction}</p>
      </div>
      ` : ''}
    </div>
  `;
  
  openPrintWindow(printContent);
}

function exportCuissonPDF(cuissonId) {
  const cuisson = cuissons.find(c => c.id === cuissonId);
  if (!cuisson) return;
  
  const typeLabel = CUISSON_TYPE_LABELS[cuisson.type] || cuisson.type;
  const associatedTests = getTestsForCuisson(cuissonId);
  
  const testsListHtml = associatedTests.length > 0
    ? associatedTests.map(t => `<li>${t.generatedId} - ${CONCLUSION_LABELS[t.conclusion] || 'En attente'}</li>`).join('')
    : '<li>Aucun test associé</li>';
  
  const printContent = `
    <div class="print-container">
      <div class="print-header">
        <h1>Cuisson du ${formatDateFR(cuisson.date)}</h1>
        <span class="print-badge">${typeLabel}</span>
      </div>
      

      
      <div class="print-section">
        <h2>Paramètres</h2>
        <div class="print-grid">
          <div class="print-item">
            <div class="print-item-label">Cône visé</div>
            <div class="print-item-value">${cuisson.coneVise ? 'C' + cuisson.coneVise : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Cône réel</div>
            <div class="print-item-value">${cuisson.coneReel ? 'C' + cuisson.coneReel : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Temp. max</div>
            <div class="print-item-value">${cuisson.tempMax ? cuisson.tempMax + '°C' : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Durée</div>
            <div class="print-item-value">${cuisson.duree ? cuisson.duree + 'h' : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Vitesse montée</div>
            <div class="print-item-value">${cuisson.vitesse ? cuisson.vitesse + '°C/h' : '-'}</div>
          </div>
          <div class="print-item">
            <div class="print-item-label">Palier</div>
            <div class="print-item-value">${cuisson.palier ? cuisson.palier + ' min' : '-'}</div>
          </div>
        </div>
      </div>
      
      ${cuisson.notes ? `
      <div class="print-section">
        <h2>Notes</h2>
        <p>${cuisson.notes}</p>
      </div>
      ` : ''}
      
      <div class="print-section">
        <h2>Tests associés (${associatedTests.length})</h2>
        <ul>${testsListHtml}</ul>
      </div>
    </div>
  `;
  
  openPrintWindow(printContent);
}

function openPrintWindow(content) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Export - Alex le Potier</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1a1a1a; line-height: 1.5; }
        .print-container { max-width: 600px; margin: 0 auto; }
        .print-header { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
        .print-header h1 { font-size: 1.5rem; margin-bottom: 4px; }
        .print-date { font-size: 0.85rem; color: #666; margin-bottom: 8px; }
        .print-badge { display: inline-block; padding: 4px 12px; border: 1px solid #1a1a1a; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }

        .print-section { margin-bottom: 20px; }
        .print-section h2 { font-size: 0.85rem; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 12px; letter-spacing: 1px; }
        .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .print-item { padding: 4px 0; }
        .print-item-label { font-size: 0.75rem; color: #666; }
        .print-item-value { font-size: 0.95rem; }
        ul { padding-left: 20px; }
        li { padding: 4px 0; }
        p { color: #333; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      ${content}
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ==========================================================================
// STATISTICS & CHARTS
// ==========================================================================

let chartInstances = {};

function renderStats() {
  // KPIs
  const totalTests = tests.length;
  const totalCuissons = cuissons.length;
  const keepers = tests.filter(t => t.conclusion === 'keeper').length;
  const retry = tests.filter(t => t.conclusion === 'retry').length;
  const abandon = tests.filter(t => t.conclusion === 'abandon').length;
  const pending = tests.filter(t => !t.conclusion || t.conclusion === 'pending').length;
  
  $('kpi-total-tests').textContent = totalTests;
  $('kpi-total-cuissons').textContent = totalCuissons;
  $('kpi-keepers').textContent = keepers;
  $('kpi-retry').textContent = retry;
  $('kpi-abandon').textContent = abandon;
  $('kpi-pending').textContent = pending;
  
  // Charts
  renderChartByBase();
  renderChartConclusions();
  renderChartByMonth();
  renderChartDefects();
  renderTopAdditifs();
}

function renderChartByBase() {
  const ctx = $('chart-by-base');
  if (!ctx) return;
  
  // Compter les tests par base
  const baseCounts = {};
  tests.forEach(t => {
    if (t.base) {
      baseCounts[t.base] = (baseCounts[t.base] || 0) + 1;
    }
  });
  
  const labels = Object.keys(baseCounts).sort();
  const data = labels.map(b => baseCounts[b]);
  
  if (chartInstances['byBase']) {
    chartInstances['byBase'].destroy();
  }
  
  chartInstances['byBase'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tests',
        data: data,
        backgroundColor: 'rgba(139, 115, 85, 0.7)',
        borderColor: 'rgba(139, 115, 85, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#888' },
          grid: { color: '#3a3a3a' }
        },
        x: {
          ticks: { color: '#888' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderChartConclusions() {
  const ctx = $('chart-conclusions');
  if (!ctx) return;
  
  const counts = {
    keeper: tests.filter(t => t.conclusion === 'keeper').length,
    retry: tests.filter(t => t.conclusion === 'retry').length,
    abandon: tests.filter(t => t.conclusion === 'abandon').length,
    pending: tests.filter(t => !t.conclusion || t.conclusion === 'pending').length
  };
  
  if (chartInstances['conclusions']) {
    chartInstances['conclusions'].destroy();
  }
  
  chartInstances['conclusions'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['À garder', 'À refaire', 'Abandonnés', 'En attente'],
      datasets: [{
        data: [counts.keeper, counts.retry, counts.abandon, counts.pending],
        backgroundColor: [
          'rgba(74, 124, 89, 0.8)',
          'rgba(201, 162, 39, 0.8)',
          'rgba(166, 61, 64, 0.8)',
          'rgba(58, 58, 58, 0.8)'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#888', padding: 12 }
        }
      }
    }
  });
}

function renderChartByMonth() {
  const ctx = $('chart-by-month');
  if (!ctx) return;
  
  // Grouper par mois
  const monthCounts = {};
  tests.forEach(t => {
    if (t.date) {
      const month = t.date.substring(0, 7); // YYYY-MM
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });
  
  const labels = Object.keys(monthCounts).sort();
  const data = labels.map(m => monthCounts[m]);
  
  // Formater les labels (YYYY-MM -> MMM YY)
  const formattedLabels = labels.map(m => {
    const [year, month] = m.split('-');
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
  });
  
  if (chartInstances['byMonth']) {
    chartInstances['byMonth'].destroy();
  }
  
  chartInstances['byMonth'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedLabels,
      datasets: [{
        label: 'Tests',
        data: data,
        borderColor: 'rgba(139, 115, 85, 1)',
        backgroundColor: 'rgba(139, 115, 85, 0.2)',
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#888' },
          grid: { color: '#3a3a3a' }
        },
        x: {
          ticks: { color: '#888' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderChartDefects() {
  const ctx = $('chart-defects');
  if (!ctx) return;
  
  // Compter les défauts
  const defectCounts = {};
  tests.forEach(t => {
    (t.defects || []).forEach(d => {
      defectCounts[d] = (defectCounts[d] || 0) + 1;
    });
  });
  
  // Trier par fréquence
  const sorted = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([code]) => DEFECT_LABELS[code] || code);
  const data = sorted.map(([, count]) => count);
  
  if (chartInstances['defects']) {
    chartInstances['defects'].destroy();
  }
  
  chartInstances['defects'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Occurrences',
        data: data,
        backgroundColor: 'rgba(166, 61, 64, 0.7)',
        borderColor: 'rgba(166, 61, 64, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#888' },
          grid: { color: '#3a3a3a' }
        },
        y: {
          ticks: { color: '#888' },
          grid: { display: false }
        }
      }
    }
  });
}

function renderTopAdditifs() {
  const container = $('top-additifs');
  if (!container) return;
  
  // Compter les utilisations d'additifs
  const additifCounts = {};
  tests.forEach(t => {
    Object.keys(t.additives || {}).forEach(code => {
      if (t.additives[code] > 0) {
        additifCounts[code] = (additifCounts[code] || 0) + 1;
      }
    });
  });
  
  // Trier par fréquence
  const sorted = Object.entries(additifCounts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] || 1;
  
  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-config">Aucun additif utilisé</p>';
    return;
  }
  
  container.innerHTML = sorted.map(([code, count]) => {
    const barWidth = Math.round((count / maxCount) * 100);
    return `
      <div class="top-item">
        <span class="top-item-code">${code}</span>
        <span class="top-item-count">${count} test${count > 1 ? 's' : ''}</span>
        <div class="top-item-bar" style="width: ${barWidth}px"></div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// CUISSONS MANAGEMENT
// ==========================================================================

function getFilteredCuissons() {
  const typeFilter = $('filter-cuisson-type')?.value || '';
  const coneFilter = $('filter-cuisson-cone')?.value || '';
  const monthFilter = $('filter-cuisson-month')?.value || '';
  
  return cuissons.filter(cuisson => {
    if (typeFilter && cuisson.type !== typeFilter) return false;
    if (coneFilter && cuisson.coneVise !== coneFilter) return false;
    if (monthFilter && cuisson.date) {
      const cuissonMonth = cuisson.date.substring(0, 7); // YYYY-MM
      if (cuissonMonth !== monthFilter) return false;
    }
    return true;
  });
}

function renderCuissonsList() {
  const cuissonsList = $('cuissons-list');
  if (!cuissonsList) return;
  
  const filteredCuissons = getFilteredCuissons();
  
  if (filteredCuissons.length === 0) {
    const hasFilters = $('filter-cuisson-type')?.value || $('filter-cuisson-cone')?.value || $('filter-cuisson-month')?.value;
    cuissonsList.innerHTML = `
      <div class="empty-state">
        <p>${hasFilters ? 'Aucune cuisson ne correspond aux filtres' : 'Aucune cuisson enregistrée'}</p>
        ${!hasFilters ? '<button class="btn btn-primary" onclick="openNewCuisson()">Créer la première cuisson</button>' : ''}
      </div>
    `;
    return;
  }
  
  // Trier par date décroissante
  const sortedCuissons = [...filteredCuissons].sort((a, b) => 
    new Date(b.date || 0) - new Date(a.date || 0)
  );
  
  cuissonsList.innerHTML = sortedCuissons.map(cuisson => {
    const typeLabel = CUISSON_TYPE_LABELS[cuisson.type] || cuisson.type;
    const testsCount = getTestsForCuisson(cuisson.id).length;
    
    return `
      <div class="cuisson-card" data-id="${cuisson.id}" onclick="openCuissonDetail('${cuisson.id}')">
        <div class="cuisson-card-header">
          <div class="cuisson-card-date">${formatDateFR(cuisson.date)}</div>
          <span class="cuisson-type-badge cuisson-type-${cuisson.type}">${typeLabel}</span>
        </div>
        <div class="cuisson-card-info">
          <span class="cuisson-card-cone">
            Cône ${cuisson.coneVise || '-'}${cuisson.coneReel ? ` → ${cuisson.coneReel}` : ''}
          </span>
          ${cuisson.tempMax ? `<span class="cuisson-card-temp">${cuisson.tempMax}°C</span>` : ''}
        </div>
        ${testsCount > 0 ? `<div class="cuisson-card-tests">${testsCount} test${testsCount > 1 ? 's' : ''} associé${testsCount > 1 ? 's' : ''}</div>` : ''}

      </div>
    `;
  }).join('');
}

function getTestsForCuisson(cuissonId) {
  return tests.filter(t => t.cuissonId === cuissonId);
}

function renderCuissonDetail(cuisson) {
  const detailContent = $('cuisson-detail-content');
  if (!detailContent) return;
  
  const typeLabel = CUISSON_TYPE_LABELS[cuisson.type] || cuisson.type;
  const associatedTests = getTestsForCuisson(cuisson.id);
  
  detailContent.innerHTML = `
    <div class="detail-header">
      <div class="detail-id">Cuisson du ${formatDateFR(cuisson.date)}</div>
      <span class="cuisson-type-badge cuisson-type-${cuisson.type}">${typeLabel}</span>
    </div>
    

    
    <div class="detail-section">
      <h3>Paramètres</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-item-label">Cône visé</div>
          <div class="detail-item-value">${cuisson.coneVise ? 'C' + cuisson.coneVise : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Cône réel</div>
          <div class="detail-item-value">${cuisson.coneReel ? 'C' + cuisson.coneReel : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Temp. max</div>
          <div class="detail-item-value">${cuisson.tempMax ? cuisson.tempMax + '°C' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Durée</div>
          <div class="detail-item-value">${cuisson.duree ? cuisson.duree + 'h' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Vitesse montée</div>
          <div class="detail-item-value">${cuisson.vitesse ? cuisson.vitesse + '°C/h' : '-'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-item-label">Palier</div>
          <div class="detail-item-value">${cuisson.palier ? cuisson.palier + ' min' : '-'}</div>
        </div>
      </div>
    </div>
    
    ${cuisson.notes ? `
    <div class="detail-section">
      <h3>Notes</h3>
      <p style="color: var(--text-muted)">${cuisson.notes}</p>
    </div>
    ` : ''}
    
    ${associatedTests.length > 0 ? `
    <div class="detail-section">
      <h3>Tests associés (${associatedTests.length})</h3>
      <div class="associated-tests-list">
        ${associatedTests.map(test => `
          <div class="associated-test-item" onclick="event.stopPropagation(); closeCuissonDetail(); openDetail('${test.id}');">
            <span class="associated-test-id">${test.generatedId || test.id}</span>
            <span class="test-badge badge-${test.conclusion || 'pending'}">${CONCLUSION_LABELS[test.conclusion] || 'En attente'}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  `;
}

function openCuissonDetail(id) {
  const cuisson = cuissons.find(c => c.id === id);
  if (!cuisson) return;
  
  renderCuissonDetail(cuisson);
  
  $('btn-edit-cuisson-from-detail').onclick = () => {
    $('modal-cuisson-detail').classList.add('hidden');
    openEditCuisson(id);
  };
  
  $('btn-export-cuisson-pdf').onclick = () => {
    exportCuissonPDF(id);
  };
  
  $('modal-cuisson-detail').classList.remove('hidden');
}

function closeCuissonDetail() {
  $('modal-cuisson-detail').classList.add('hidden');
}

function openNewCuisson() {
  currentEditCuissonId = null;
  $('modal-cuisson-title').textContent = 'Nouvelle cuisson';
  $('cuisson-form').reset();
  $('btn-delete-cuisson').classList.add('hidden');
  
  // Date par défaut: aujourd'hui
  $('cuisson-date').value = new Date().toISOString().split('T')[0];
  
  $('modal-cuisson').classList.remove('hidden');
}

function openEditCuisson(id) {
  const cuisson = cuissons.find(c => c.id === id);
  if (!cuisson) return;
  
  currentEditCuissonId = id;
  $('modal-cuisson-title').textContent = 'Modifier la cuisson';
  $('btn-delete-cuisson').classList.remove('hidden');
  
  // Remplir le formulaire
  $('cuisson-date').value = cuisson.date || new Date().toISOString().split('T')[0];
  $('cuisson-type').value = cuisson.type || 'email';
  $('cuisson-cone-vise').value = cuisson.coneVise || '';
  $('cuisson-cone-reel').value = cuisson.coneReel || '';
  $('cuisson-temp-max').value = cuisson.tempMax || '';
  $('cuisson-duree').value = cuisson.duree || '';
  $('cuisson-vitesse').value = cuisson.vitesse || '';
  $('cuisson-palier').value = cuisson.palier || '';
  $('cuisson-notes').value = cuisson.notes || '';
  
  $('modal-cuisson').classList.remove('hidden');
}

function closeModalCuisson() {
  $('modal-cuisson').classList.add('hidden');
  currentEditCuissonId = null;
}

async function saveCuisson(e) {
  e.preventDefault();
  
  const cuissonData = {
    id: currentEditCuissonId || crypto.randomUUID(),
    date: $('cuisson-date').value,
    type: $('cuisson-type').value,
    coneVise: $('cuisson-cone-vise').value,
    coneReel: $('cuisson-cone-reel').value,
    tempMax: $('cuisson-temp-max').value ? parseInt($('cuisson-temp-max').value) : null,
    duree: $('cuisson-duree').value ? parseFloat($('cuisson-duree').value) : null,
    vitesse: $('cuisson-vitesse').value ? parseInt($('cuisson-vitesse').value) : null,
    palier: $('cuisson-palier').value ? parseInt($('cuisson-palier').value) : null,
    notes: $('cuisson-notes').value,
    updatedAt: new Date().toISOString()
  };
  
  const action = currentEditCuissonId ? 'updateCuisson' : 'addCuisson';
  const success = await saveCuissonToSheets(cuissonData, action);
  
  if (success) {
    if (currentEditCuissonId) {
      const index = cuissons.findIndex(c => c.id === currentEditCuissonId);
      if (index !== -1) {
        cuissons[index] = { ...cuissons[index], ...cuissonData };
      }
    } else {
      cuissonData.createdAt = new Date().toISOString();
      cuissons.unshift(cuissonData);
    }
    
    closeModalCuisson();
    renderCuissonsList();
    updateCuissonSelect();
  }
}

async function deleteCuisson() {
  if (!currentEditCuissonId) return;
  
  // Vérifier s'il y a des tests associés
  const associatedTests = getTestsForCuisson(currentEditCuissonId);
  if (associatedTests.length > 0) {
    if (!confirm(`Cette cuisson a ${associatedTests.length} test(s) associé(s). Supprimer quand même ?`)) {
      return;
    }
  } else {
    if (!confirm('Supprimer cette cuisson ?')) return;
  }
  
  const success = await deleteCuissonFromSheets(currentEditCuissonId);
  
  if (success) {
    cuissons = cuissons.filter(c => c.id !== currentEditCuissonId);
    closeModalCuisson();
    renderCuissonsList();
    updateCuissonSelect();
  }
}

function updateCuissonSelect() {
  const select = $('cuisson-link');
  if (!select) return;
  
  // Trier par date décroissante
  const sortedCuissons = [...cuissons].sort((a, b) => 
    new Date(b.date || 0) - new Date(a.date || 0)
  );
  
  const options = sortedCuissons.map(cuisson => {
    const typeLabel = CUISSON_TYPE_LABELS[cuisson.type] || cuisson.type;
    const label = `${formatDateFR(cuisson.date) || 'Sans date'} - ${typeLabel} (C${cuisson.coneVise || '?'})`;
    return `<option value="${cuisson.id}">${label}</option>`;
  }).join('');
  
  select.innerHTML = '<option value="">Aucune</option>' + options;
}

// ==========================================================================
// INIT
// ==========================================================================

async function init() {
  // Initialiser la navigation par onglets
  initTabs();
  
  // Charger les terres et additifs depuis Google Sheets
  terres = await loadTerresFromSheets();
  additifs = await loadAdditifsFromSheets();
  
  // Initialiser les grilles et selects dynamiques
  renderAdditivesGrid();
  renderBaseAdditivesGrid();
  updateTerreSelect();
  renderTerresList();
  renderAdditifsList();
  renderFilterAdditifs();
  
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
  
  // Charger les cuissons depuis Google Sheets
  cuissons = await loadCuissonsFromSheets();
  
  // Charger les tests depuis Google Sheets
  tests = await loadTestsFromSheets();
  
  // Si aucun test, charger les données initiales
  await loadInitialData();
  
  renderTestsList();
  renderBasesList();
  renderRecettesList();
  renderCuissonsList();
  updateCuissonSelect();
  
  // Event listeners - Tests
  $('btn-new').addEventListener('click', openNewTest);
  $('btn-close-modal').addEventListener('click', closeModal);
  $('btn-close-detail').addEventListener('click', closeDetail);
  $('btn-delete').addEventListener('click', deleteTest);
  $('btn-compare').addEventListener('click', renderCompareTable);
  $('btn-close-compare').addEventListener('click', closeCompare);
  $('btn-recipes').addEventListener('click', generateRecipes);
  $('btn-close-recipes').addEventListener('click', closeRecipes);
  $('btn-close-recipes-footer').addEventListener('click', closeRecipes);
  $('btn-print-recipes').addEventListener('click', printRecipes);
  
  elements.testForm.addEventListener('submit', saveTest);
  
  // Event listeners - Bases
  $('btn-new-base').addEventListener('click', openNewBase);
  $('btn-sync-bases').addEventListener('click', syncDefaultBases);
  $('btn-close-modal-base').addEventListener('click', closeModalBase);
  $('btn-delete-base').addEventListener('click', deleteBase);
  $('btn-add-ingredient').addEventListener('click', addRecipeRow);
  $('base-form').addEventListener('submit', saveBase);
  
  // Event listeners - Config (Terres & Additifs)
  $('btn-new-terre').addEventListener('click', addTerre);
  $('btn-new-additif').addEventListener('click', addAdditif);
  
  // Event listeners - Cuissons
  $('btn-new-cuisson').addEventListener('click', openNewCuisson);
  $('btn-close-modal-cuisson').addEventListener('click', closeModalCuisson);
  $('btn-delete-cuisson').addEventListener('click', deleteCuisson);
  $('cuisson-form').addEventListener('submit', saveCuisson);
  $('btn-close-cuisson-detail').addEventListener('click', closeCuissonDetail);
  
  // Filtres cuissons
  $('filter-cuisson-type').addEventListener('change', renderCuissonsList);
  $('filter-cuisson-cone').addEventListener('change', renderCuissonsList);
  $('filter-cuisson-month').addEventListener('change', renderCuissonsList);
  
  // Fermer modals cuisson en cliquant à l'extérieur
  $('modal-cuisson').addEventListener('click', e => {
    if (e.target === $('modal-cuisson')) closeModalCuisson();
  });
  $('modal-cuisson-detail').addEventListener('click', e => {
    if (e.target === $('modal-cuisson-detail')) closeCuissonDetail();
  });
  
  // Fermer modal base en cliquant à l'extérieur
  $('modal-base').addEventListener('click', e => {
    if (e.target === $('modal-base')) closeModalBase();
  });
  
  // Filtres
  elements.searchInput.addEventListener('input', applyFilters);
  elements.filterBase.addEventListener('change', applyFilters);
  elements.filterTerre.addEventListener('change', applyFilters);
  elements.filterConclusion.addEventListener('change', applyFilters);
  
  // Filtres avancés
  $('btn-toggle-advanced').addEventListener('click', toggleAdvancedFilters);
  $('btn-clear-filters').addEventListener('click', clearAdvancedFilters);
  document.querySelectorAll('input[name="filter-defect"]').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });
  
  // Update ID en temps réel
  $('base').addEventListener('change', updateGeneratedId);
  $('target-cone').addEventListener('change', updateGeneratedId);
  // Note: les event listeners pour les additifs sont ajoutés dans renderAdditivesGrid()
  
  // Fermer modals en cliquant à l'extérieur
  elements.modal.addEventListener('click', e => {
    if (e.target === elements.modal) closeModal();
  });
  elements.modalDetail.addEventListener('click', e => {
    if (e.target === elements.modalDetail) closeDetail();
  });
  $('modal-recipes').addEventListener('click', e => {
    if (e.target === $('modal-recipes')) closeRecipes();
  });
  
  // Raccourcis clavier
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeDetail();
      closeCompare();
      closeModalBase();
      closeModalCuisson();
      closeCuissonDetail();
      closeRecipes();
    }
  });
}

document.addEventListener('DOMContentLoaded', checkAuth);
