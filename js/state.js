// State management
export const storageKeys = {
  inventory: 'rapapa_inventory',
  transactions: 'rapapa_transactions',
  settings: 'rapapa_settings'
};

export const defaultInventory = () => [
  { id: crypto.randomUUID(), name: 'Beras Premium 5kg', category: 'Bahan Pokok', priceBuy: 65000, priceSell: 76000, qty: 18, initialStock: 18, originalSell: 76000 },
  { id: crypto.randomUUID(), name: 'Minyak Goreng 1L', category: 'Minuman & Bumbu', priceBuy: 22000, priceSell: 27000, qty: 32, initialStock: 32, originalSell: 27000 },
  { id: crypto.randomUUID(), name: 'Mie Instan', category: 'Makanan Ringan', priceBuy: 2300, priceSell: 3100, qty: 90, initialStock: 90, originalSell: 3100 },
  { id: crypto.randomUUID(), name: 'Sabun Mandi', category: 'Kebersihan', priceBuy: 4000, priceSell: 5200, qty: 45, initialStock: 45, originalSell: 5200 },
  { id: crypto.randomUUID(), name: 'Tissue Gulung', category: 'Kebersihan', priceBuy: 9500, priceSell: 12000, qty: 24, initialStock: 24, originalSell: 12000 }
];

export let state = {
  inventory: [],
  transactions: [],
  settings: { googleSheetURL: '' },
  cart: [],
  extractedInvoice: [],
  inventorySort: { prop: 'name', dir: 'asc' }
};

export function loadState() {
  try {
    state.inventory = JSON.parse(localStorage.getItem(storageKeys.inventory)) || defaultInventory();
  } catch (err) {
    state.inventory = defaultInventory();
  }
  try {
    state.transactions = JSON.parse(localStorage.getItem(storageKeys.transactions)) || [];
  } catch (err) {
    state.transactions = [];
  }
  try {
    state.settings = JSON.parse(localStorage.getItem(storageKeys.settings)) || { googleSheetURL: '' };
  } catch (err) {
    state.settings = { googleSheetURL: '' };
  }
}

export function saveState() {
  localStorage.setItem(storageKeys.inventory, JSON.stringify(state.inventory));
  localStorage.setItem(storageKeys.transactions, JSON.stringify(state.transactions));
  localStorage.setItem(storageKeys.settings, JSON.stringify(state.settings));
}

export function syncWithGoogleSheets(action, data) {
  const url = state.settings.googleSheetURL?.trim();
  if (!url) {
    return Promise.resolve({ status: 'offline', message: 'Google Apps Script belum dikonfigurasi' });
  }
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data })
  })
    .then((resp) => resp.json())
    .then((payload) => ({ status: 'ok', data: payload }))
    .catch((err) => ({ status: 'error', message: err.message }));
}
