// Main app initialization
import { generateTransactionId, showToast, updateTime } from './utils.js';
import { state, loadState, saveState } from './state.js';
import { renderDashboard, renderSyncStatus, renderDashboardTransactions, renderTransactionDetail, renderCustomerSummary } from './dashboard.js';
import { renderCustomerList, renderCart, setupTransactionHandlers, handleItemNameChange, handleQtyFocus, handleQtyChange, addItemToCart, saveTransaction } from './transaksi.js';
import { renderInventoryOptions, renderInventoryTable, setupInventoryHandlers, openAddItemModal, sortInventory } from './inventory.js';
import { setupOcrHandlers, processInvoice, confirmOcrImport, cancelOcr } from './ocr.js';
import { setupExcelHandlers, handleExcelUpload, downloadTemplate, downloadInventory, downloadTransactions } from './excel.js';

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

function attachEventDelegation() {
  document.body.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    const sectionButton = event.target.closest('.section-btn');
    const sortButton = event.target.closest('[data-sort]');
    if (sectionButton) {
      const sectionId = sectionButton.dataset.section;
      document.querySelectorAll('main section.space-y-6 > div').forEach((section) => section.classList.add('hidden'));
      document.getElementById(sectionId)?.classList.remove('hidden');
      return;
    }
    if (sortButton) {
      const prop = sortButton.dataset.sort;
      if (prop) sortInventory(prop);
      return;
    }
    if (!button) return;

    switch (button.id) {
      case 'btnSettings':
        document.getElementById('modalSettings')?.classList.remove('hidden');
        break;
      case 'btnCloseSettings':
      case 'btnCancelSettings':
        document.getElementById('modalSettings')?.classList.add('hidden');
        break;
      case 'btnSaveSettings':
        {
          const gsheetUrl = document.getElementById('gsheetUrl');
          if (gsheetUrl) {
            state.settings.googleSheetURL = gsheetUrl.value.trim();
            saveState();
            renderSyncStatus();
            document.getElementById('modalSettings')?.classList.add('hidden');
            showToast('Pengaturan tersimpan.');
          }
        }
        break;
      case 'btnAddItem':
        addItemToCart();
        break;
      case 'btnSaveTransaction':
        saveTransaction();
        break;
      case 'btnOpenAddItem':
        openAddItemModal();
        break;
      case 'btnConfirmOcr':
        confirmOcrImport();
        break;
      case 'btnCancelOcr':
        cancelOcr();
        break;
      case 'btnDownloadTemplate':
        downloadTemplate();
        break;
      case 'btnDownloadInventory':
        downloadInventory();
        break;
      case 'btnDownloadToday':
        downloadTransactions('daily');
        break;
      case 'btnDownloadWeekly':
        downloadTransactions('weekly');
        break;
      case 'btnResetTransactionDate':
        {
          const filterInput = document.getElementById('transactionDateFilter');
          if (filterInput) {
            filterInput.value = '';
            renderDashboardTransactions();
          }
        }
        break;
      case 'btnCloseTransactionDetail':
      case 'btnCloseTransactionDetailFooter':
        document.getElementById('modalTransactionDetail')?.classList.add('hidden');
        break;
      default:
        break;
    }

    const transactionId = button.dataset.transactionId;
    if (transactionId) {
      renderTransactionDetail(transactionId);
      return;
    }
  });

  document.body.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    if (target.id === 'itemName') {
      handleItemNameChange();
    }
    if (target.id === 'itemQty') {
      handleQtyChange();
    }
  });

  document.body.addEventListener('focusin', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'itemQty') {
      handleQtyFocus();
    }
  });

  document.body.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.id === 'uploadInvoice' && target.files?.[0]) {
      processInvoice(target.files[0]);
    }
    if (target.id === 'uploadExcel' && target.files?.[0]) {
      handleExcelUpload(target.files[0]);
      target.value = '';
    }
    if (target.id === 'transactionDateFilter') {
      renderDashboardTransactions(target.value);
    }
  });
}

function renderAll() {
  renderCustomerList();
  renderInventoryOptions();
  renderCart();
  renderInventoryTable();
  renderDashboard();
  renderDashboardTransactions();
  renderCustomerSummary();
  renderSyncStatus();
  
  const gsheetUrl = document.getElementById('gsheetUrl');
  if (gsheetUrl) gsheetUrl.value = state.settings.googleSheetURL || '';
  
  const transactionId = document.getElementById('transactionId');
  if (transactionId) transactionId.value = generateTransactionId();
  
  updateTime();
}

export async function initializeApp() {
  try {
    let lucideLib = typeof lucide !== 'undefined' ? lucide : null;
    if (!lucideLib) {
      try {
        lucideLib = await import('https://cdn.jsdelivr.net/npm/lucide@0.394.0/dist/lucide.esm.js');
      } catch (loadError) {
        console.warn('Lucide module import failed:', loadError);
      }
    }

    if (lucideLib?.createIcons) {
      lucideLib.createIcons();
    } else {
      console.warn('Lucide icons not available; continuing without icon initialization.');
    }

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
    attachEventDelegation();

    // Setup navigation and settings
    setupSectionNavigation();
    setupSettingsModal();

    console.log('Rapapa POS & Inventory app initialized successfully!');
  } catch (error) {
    console.error('Rapapa initialization failed:', error);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch((error) => console.error('Initialization failed:', error));
  });
} else {
  initializeApp().catch((error) => console.error('Initialization failed:', error));
}
