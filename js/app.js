// Main app initialization
import { generateTransactionId, showToast, updateTime } from './utils.js';
import { state, loadState, saveState } from './state.js';
import { renderDashboard, renderSyncStatus } from './dashboard.js';
import { renderCustomerList, renderCart, setupTransactionHandlers } from './transaksi.js';
import { renderInventoryOptions, renderInventoryTable, setupInventoryHandlers } from './inventory.js';
import { setupOcrHandlers } from './ocr.js';
import { setupExcelHandlers } from './excel.js';

function setupSectionNavigation() {
  document.querySelectorAll('.section-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('main section.space-y-6 > div').forEach((section) => {
        section.classList.add('hidden');
      });
      const sectionId = button.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) section.classList.remove('hidden');
    });
  });
}

function setupSettingsModal() {
  const btnSettings = document.getElementById('btnSettings');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnCancelSettings = document.getElementById('btnCancelSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const gsheetUrl = document.getElementById('gsheetUrl');
  const modalSettings = document.getElementById('modalSettings');
  
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      if (modalSettings) modalSettings.classList.remove('hidden');
    });
  }
  
  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', () => {
      if (modalSettings) modalSettings.classList.add('hidden');
    });
  }
  
  if (btnCancelSettings) {
    btnCancelSettings.addEventListener('click', () => {
      if (modalSettings) modalSettings.classList.add('hidden');
    });
  }
  
  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
      if (gsheetUrl) {
        state.settings.googleSheetURL = gsheetUrl.value.trim();
        saveState();
        renderSyncStatus();
        if (modalSettings) modalSettings.classList.add('hidden');
        showToast('Pengaturan tersimpan.');
      }
    });
  }
}

function renderAll() {
  renderCustomerList();
  renderInventoryOptions();
  renderCart();
  renderInventoryTable();
  renderDashboard();
  renderSyncStatus();
  
  const gsheetUrl = document.getElementById('gsheetUrl');
  if (gsheetUrl) gsheetUrl.value = state.settings.googleSheetURL || '';
  
  const transactionId = document.getElementById('transactionId');
  if (transactionId) transactionId.value = generateTransactionId();
  
  updateTime();
}

export function initializeApp() {
  // Initialize lucide icons
  lucide.createIcons();
  
  // Load state from storage
  loadState();
  
  // Render all views
  renderAll();
  
  // Setup time update interval
  setInterval(updateTime, 1000);
  
  // Setup event handlers for each module
  setupTransactionHandlers();
  setupInventoryHandlers();
  setupOcrHandlers();
  setupExcelHandlers();
  
  // Setup navigation and settings
  setupSectionNavigation();
  setupSettingsModal();
  
  console.log('Rapapa POS & Inventory app initialized successfully!');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initializeApp);
