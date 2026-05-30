// Dashboard module
import { formatRupiah, formatDate } from './utils.js';
import { state } from './state.js';

export function getTodaySales() {
  const now = new Date();
  return state.transactions
    .filter((tx) => new Date(tx.date).toDateString() === now.toDateString())
    .reduce((sum, tx) => sum + tx.total, 0);
}

export function getWeeklySales() {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  return state.transactions
    .filter((tx) => new Date(tx.date) >= weekAgo)
    .reduce((sum, tx) => sum + tx.total, 0);
}

export function getTodayTransactionsCount() {
  const now = new Date();
  return state.transactions.filter((tx) => new Date(tx.date).toDateString() === now.toDateString()).length;
}

export function getLowStockItems() {
  return state.inventory.filter((item) => item.initialStock > 0 && item.qty <= item.initialStock * 0.35);
}

export function renderDashboard() {
  const daily = getTodaySales();
  const weekly = getWeeklySales();
  const count = getTodayTransactionsCount();
  const lowStock = getLowStockItems();
  
  const dailySales = document.getElementById('dailySales');
  const weeklySales = document.getElementById('weeklySales');
  const todayTxCount = document.getElementById('todayTxCount');
  const lowStockCount = document.getElementById('lowStockCount');
  const lowStockTable = document.getElementById('lowStockTable');
  
  if (dailySales) dailySales.textContent = formatRupiah(daily);
  if (weeklySales) weeklySales.textContent = formatRupiah(weekly);
  if (todayTxCount) todayTxCount.textContent = count;
  if (lowStockCount) lowStockCount.textContent = `${lowStock.length} Produk`;
  
  if (lowStockTable) {
    lowStockTable.innerHTML = lowStock
      .map((item, index) => `
        <tr class="border-t border-slate-800">
          <td class="px-4 py-4 text-slate-300">${index + 1}</td>
          <td class="px-4 py-4 text-slate-200">${item.name}</td>
          <td class="px-4 py-4 text-rose-300">${item.qty}</td>
          <td class="px-4 py-4 text-slate-200">${Math.round((item.qty / item.initialStock) * 100)}%</td>
        </tr>
      `)
      .join('') || '<tr><td class="px-4 py-6 text-slate-400" colspan="4">Semua stok dalam kondisi aman.</td></tr>';
  }
}

export function renderSyncStatus() {
  const syncStatus = document.getElementById('syncStatus');
  const syncBadge = document.getElementById('syncBadge');
  const url = state.settings.googleSheetURL?.trim();
  
  if (url) {
    if (syncStatus) syncStatus.textContent = 'Terhubung ke Google Apps Script';
    if (syncBadge) {
      syncBadge.textContent = 'Online';
      syncBadge.classList.remove('bg-rose-500/10', 'text-rose-300');
      syncBadge.classList.add('bg-emerald-500/10', 'text-emerald-300');
    }
  } else {
    if (syncStatus) syncStatus.textContent = 'Offline / localStorage';
    if (syncBadge) {
      syncBadge.textContent = 'Offline';
      syncBadge.classList.remove('bg-emerald-500/10', 'text-emerald-300');
      syncBadge.classList.add('bg-rose-500/10', 'text-rose-300');
    }
  }
}
