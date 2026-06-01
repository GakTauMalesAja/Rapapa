// Inventory module
import { formatRupiah, showToast, findInventoryItem } from './utils.js';
import { state, saveState } from './state.js';

export function renderInventoryOptions() {
  const inventoryList = document.getElementById('inventoryList');
  if (inventoryList) {
    inventoryList.innerHTML = state.inventory
      .map((item) => `<option value="${item.name}"></option>`)
      .join('');
  }
}

export function renderInventoryTable() {
  const searchInventory = document.getElementById('searchInventory');
  const inventoryTable = document.getElementById('inventoryTable');
  
  const query = searchInventory?.value.trim().toLowerCase() || '';
  const filtered = state.inventory
    .filter((item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query))
    .sort((a, b) => {
      const propA = a[state.inventorySort.prop];
      const propB = b[state.inventorySort.prop];
      if (typeof propA === 'string') {
        return state.inventorySort.dir === 'asc' ? propA.localeCompare(propB) : propB.localeCompare(propA);
      }
      return state.inventorySort.dir === 'asc' ? propA - propB : propB - propA;
    });
  
  if (inventoryTable) {
    inventoryTable.innerHTML = filtered
      .map((item, index) => {
        const flagged = item.priceSell > item.originalSell ? '<span contenteditable="false" class="ml-2 inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">↑</span>' : '';
        return `
          <tr data-id="${item.id}" class="border-t border-slate-800" data-index="${index}">
            <td class="px-4 py-4 text-slate-300">${index + 1}</td>
            <td class="px-4 py-4 text-slate-200" contenteditable="true" data-field="name">${item.name}</td>
            <td class="px-4 py-4 text-slate-200" contenteditable="true" data-field="category">${item.category}</td>
            <td class="px-4 py-4 text-slate-200" contenteditable="true" data-field="priceBuy">${item.priceBuy}</td>
            <td class="px-4 py-4 text-slate-200" contenteditable="true" data-field="priceSell">${item.priceSell}${flagged}</td>
            <td class="px-4 py-4 text-slate-200" contenteditable="true" data-field="qty">${item.qty}</td>
            <td class="px-4 py-4 text-slate-200">${formatRupiah(item.priceBuy * item.qty)}</td>
          </tr>
        `;
      })
      .join('');
  }
}

export function updateInventoryRow(target) {
  const cell = target.closest('td[data-field]');
  if (!cell) return;
  const row = cell.closest('tr');
  const id = row?.dataset.id;
  const field = cell.dataset.field;
  const value = cell.textContent.trim();
  const item = state.inventory.find((entry) => entry.id === id);
  
  if (!item || !field) return;
  
  if (field === 'priceBuy' || field === 'priceSell' || field === 'qty') {
    item[field] = Math.max(0, Number(value.replace(/[^0-9.-]/g, '')) || 0);
  } else {
    item[field] = value;
  }
  
  item.initialStock = Math.max(item.initialStock || item.qty, item.initialStock);
  saveState();
  renderInventoryTable();
  renderInventoryOptions();
}

export function sortInventory(prop) {
  if (state.inventorySort.prop === prop) {
    state.inventorySort.dir = state.inventorySort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    state.inventorySort.prop = prop;
    state.inventorySort.dir = 'asc';
  }
  renderInventoryTable();
}

export function openAddItemModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4';
  modal.innerHTML = `
    <div class="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold text-white">Tambah Barang Baru</h2>
          <p class="mt-1 text-sm text-slate-400">Isi data produk untuk menambahkan inventaris baru.</p>
        </div>
        <button id="closeAddItem" class="rounded-full border border-slate-700 p-2 text-slate-200 hover:border-rose-500">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <label class="block text-sm text-slate-300">Nama Barang<input id="newName" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none" /></label>
        <label class="block text-sm text-slate-300">Kategori<input id="newCategory" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none" /></label>
        <label class="block text-sm text-slate-300">Harga Beli<input id="newPriceBuy" type="number" min="0" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none" /></label>
        <label class="block text-sm text-slate-300">Harga Jual<input id="newPriceSell" type="number" min="0" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none" /></label>
        <label class="block text-sm text-slate-300">Qty<input id="newQty" type="number" min="0" class="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none" /></label>
      </div>
      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button id="cancelAddItem" class="rounded-2xl border border-slate-700 bg-slate-950 px-5 py-3 text-slate-200 hover:border-rose-500">Batal</button>
        <button id="saveAddItem" class="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Simpan Barang</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  if (typeof lucide !== 'undefined' && lucide?.createIcons) {
    lucide.createIcons({ parent: modal });
  }
  
  const closeBtn = modal.querySelector('#closeAddItem');
  const cancelBtn = modal.querySelector('#cancelAddItem');
  const saveBtn = modal.querySelector('#saveAddItem');
  
  if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.remove());
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name = modal.querySelector('#newName')?.value.trim();
      const category = modal.querySelector('#newCategory')?.value.trim() || 'Umum';
      const priceBuy = Number(modal.querySelector('#newPriceBuy')?.value) || 0;
      const priceSell = Number(modal.querySelector('#newPriceSell')?.value) || 0;
      const qty = Number(modal.querySelector('#newQty')?.value) || 0;
      
      if (!name || priceBuy <= 0 || priceSell <= 0 || qty < 0) {
        showToast('Isi semua field dengan benar sebelum menyimpan.', 'error');
        return;
      }
      
      state.inventory.unshift({
        id: crypto.randomUUID(),
        name,
        category,
        priceBuy,
        priceSell,
        qty,
        initialStock: qty,
        originalSell: priceSell
      });
      
      saveState();
      renderInventoryTable();
      renderInventoryOptions();
      showToast('Barang baru berhasil ditambahkan ke inventory.');
      modal.remove();
    });
  }
}

export function setupInventoryHandlers() {
  const searchInventory = document.getElementById('searchInventory');
  const btnOpenAddItem = document.getElementById('btnOpenAddItem');
  
  if (searchInventory) searchInventory.addEventListener('input', renderInventoryTable);
  if (btnOpenAddItem) btnOpenAddItem.addEventListener('click', openAddItemModal);
  
  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => sortInventory(button.dataset.sort));
  });
  
  document.addEventListener('focusout', (event) => {
    const targetCell = event.target.closest('td[contenteditable="true"]');
    if (targetCell) {
      updateInventoryRow(targetCell);
    }
  });
}
