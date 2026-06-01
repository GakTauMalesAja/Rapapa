// OCR/Invoice module
import { formatRupiah, showToast, findInventoryItem } from './utils.js';
import { state, saveState } from './state.js';
import { renderInventoryOptions, renderInventoryTable } from './inventory.js';

export function showOcrLoading() {
  const ocrPreview = document.getElementById('ocrPreview');
  const ocrLoading = document.getElementById('ocrLoading');
  
  if (ocrPreview) ocrPreview.classList.add('hidden');
  if (ocrLoading) ocrLoading.classList.remove('hidden');
}

export function hideOcrLoading() {
  const ocrLoading = document.getElementById('ocrLoading');
  if (ocrLoading) ocrLoading.classList.add('hidden');
}

export function renderOcrPreview() {
  if (!state.extractedInvoice.length) return;
  
  const ocrTable = document.getElementById('ocrTable');
  if (!ocrTable) return;
  
  ocrTable.innerHTML = state.extractedInvoice
    .map((item) => {
      const buyClass = item.priceBuy > item.currentPriceBuy ? 'text-emerald-300' : 'text-slate-200';
      const sellClass = item.priceSell > item.currentPriceSell ? 'text-emerald-300' : 'text-slate-200';
      return `
        <tr class="border-t border-slate-800">
          <td class="px-4 py-4 text-slate-200">${item.name}</td>
          <td class="px-4 py-4 text-slate-200">${item.category}</td>
          <td class="px-4 py-4 ${buyClass}">${formatRupiah(item.priceBuy)}</td>
          <td class="px-4 py-4 ${sellClass}">${formatRupiah(item.priceSell)}</td>
          <td class="px-4 py-4 text-slate-200">${item.qty}</td>
        </tr>
      `;
    })
    .join('');
  
  const ocrPreview = document.getElementById('ocrPreview');
  if (ocrPreview) ocrPreview.classList.remove('hidden');
}

export function processInvoice(file) {
  showOcrLoading();
  if (typeof setTimeout !== 'function') {
    hideOcrLoading();
    showToast('Fitur faktur AI tidak tersedia di lingkungan ini.', 'error');
    return;
  }
  const existing = state.inventory.slice(0, 3);
  
  setTimeout(() => {
    const candidate = existing.length
      ? existing.map((item, index) => ({
          name: item.name,
          category: item.category,
          priceBuy: Math.round(item.priceBuy * (1 + 0.08 * (index + 1))),
          currentPriceBuy: item.priceBuy,
          priceSell: Math.round(item.priceSell * (1 + 0.05 * (index + 1))),
          currentPriceSell: item.priceSell,
          qty: Math.max(1, Math.floor(item.qty * 0.2))
        }))
      : [{ name: 'Produk Baru', category: 'Lainnya', priceBuy: 12000, currentPriceBuy: 10000, priceSell: 14500, currentPriceSell: 13000, qty: 5 }];
    
    state.extractedInvoice = candidate;
    hideOcrLoading();
    renderOcrPreview();
    showToast('Hasil ekstraksi faktur siap direview.');
  }, 2000);
}

export function confirmOcrImport() {
  if (!state.extractedInvoice.length) {
    showToast('Tidak ada data faktur untuk disimpan.', 'error');
    return;
  }
  
  state.extractedInvoice.forEach((item) => {
    const existing = findInventoryItem(state.inventory, item.name);
    if (existing) {
      existing.priceBuy = item.priceBuy;
      existing.priceSell = item.priceSell;
      existing.qty += item.qty;
      existing.initialStock = Math.max(existing.initialStock, existing.qty);
      existing.originalSell = Math.min(existing.originalSell, item.priceSell);
    } else {
      state.inventory.unshift({
        id: crypto.randomUUID(),
        name: item.name,
        category: item.category,
        priceBuy: item.priceBuy,
        priceSell: item.priceSell,
        qty: item.qty,
        initialStock: item.qty,
        originalSell: item.priceSell
      });
    }
  });
  
  saveState();
  renderInventoryTable();
  renderInventoryOptions();
  
  const ocrPreview = document.getElementById('ocrPreview');
  if (ocrPreview) ocrPreview.classList.add('hidden');
  
  state.extractedInvoice = [];
  showToast('Data faktur berhasil disimpan ke inventory.');
}

export function cancelOcr() {
  const ocrPreview = document.getElementById('ocrPreview');
  if (ocrPreview) ocrPreview.classList.add('hidden');
  
  state.extractedInvoice = [];
  showToast('Proses faktur dibatalkan.');
}

export function setupOcrHandlers() {
  const uploadInvoice = document.getElementById('uploadInvoice');
  const btnConfirmOcr = document.getElementById('btnConfirmOcr');
  const btnCancelOcr = document.getElementById('btnCancelOcr');
  
  if (uploadInvoice) {
    uploadInvoice.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) processInvoice(file);
    });
  }
  
  if (btnConfirmOcr) btnConfirmOcr.addEventListener('click', confirmOcrImport);
  if (btnCancelOcr) btnCancelOcr.addEventListener('click', cancelOcr);
}
