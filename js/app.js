// Main app initialization
import { generateTransactionId, showToast, updateTime } from './utils.js';
import { state, loadState, saveState } from './state.js';
import { renderDashboard, renderSyncStatus, renderDashboardTransactions, renderTransactionDetail, renderCustomerSummary } from './dashboard.js';
import { renderCustomerList, renderCart, setupTransactionHandlers, handleItemNameChange, handleQtyFocus, handleQtyChange, addItemToCart, saveTransaction } from './transaksi.js';
import { renderInventoryOptions, renderInventoryTable, setupInventoryHandlers, openAddItemModal, sortInventory } from './inventory.js';
import { setupOcrHandlers, processInvoice, confirmOcrImport, cancelOcr } from './ocr.js';
import { setupExcelHandlers, handleExcelUpload, downloadTemplate, downloadInventory, downloadTransactions } from './excel.js';

function setupSectionNavigation() {
  const sectionButtons = document.querySelectorAll('.section-btn');
  console.log(`Found ${sectionButtons.length} section buttons`);
  
  sectionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const sectionId = button.dataset.section;
      console.log(`Navigation: switching to section ${sectionId}`);
      
      // Hide all sections
      ['dashboard', 'transaksi', 'inventaris', 'ocr', 'excel'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      
      // Show selected section
      const selectedSection = document.getElementById(sectionId);
      if (selectedSection) {
        selectedSection.classList.remove('hidden');
      } else {
        console.warn(`Section ${sectionId} not found`);
      }
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
    
    // Handle section buttons
    if (sectionButton) {
      const sectionId = sectionButton.dataset.section;
      if (!sectionId) return;
      
      // Hide all sections
      ['dashboard', 'transaksi', 'inventaris', 'ocr', 'excel'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
      
      // Show selected section
      const selectedSection = document.getElementById(sectionId);
      if (selectedSection) {
        selectedSection.classList.remove('hidden');
      }
      return;
    }
    
    if (sortButton) {
      const prop = sortButton.dataset.sort;
      if (prop) sortInventory(prop);
      return;
    }
    
    if (!button) return;

    switch (button.id) {
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
  console.log('Rendering all views...');
  
  try {
    renderCustomerList();
    renderInventoryOptions();
    renderCart();
    renderInventoryTable();
    renderDashboard();
    renderDashboardTransactions();
    renderCustomerSummary();
    renderSyncStatus();
  } catch (error) {
    console.warn('Error during renderAll:', error);
  }
  
  const gsheetUrl = document.getElementById('gsheetUrl');
  if (gsheetUrl) gsheetUrl.value = state.settings.googleSheetURL || '';
  
  const transactionId = document.getElementById('transactionId');
  if (transactionId) transactionId.value = generateTransactionId();
  
  updateTime();
  
  // Refresh Lucide icons after render
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    try {
      lucide.createIcons();
    } catch (error) {
      console.warn('Error recreating Lucide icons:', error);
    }
  }
}

export async function initializeApp() {
  try {
    console.log('Initializing Rapapa app...');
    
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
      console.log('Lucide icons initialized');
    } else {
      console.warn('Lucide icons not available; continuing without icon initialization.');
    }

    // Load state from storage
    loadState();
    console.log('State loaded');

    // Render all views
    renderAll();
    console.log('All views rendered');

    // Setup time update interval
    setInterval(updateTime, 1000);

    // Setup event handlers for each module
    setupTransactionHandlers();
    setupInventoryHandlers();
    setupOcrHandlers();
    setupExcelHandlers();
    attachEventDelegation();
    console.log('Event handlers setup complete');

    // Setup navigation and settings
    setupSectionNavigation();
    setupSettingsModal();
    console.log('Navigation and settings setup complete');

    console.log('✓ Rapapa POS & Inventory app initialized successfully!');
  } catch (error) {
    console.error('✗ Rapapa initialization failed:', error);
  }
}}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp().catch((error) => console.error('Initialization failed:', error));
  });
} else {
  initializeApp().catch((error) => console.error('Initialization failed:', error));
}
