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

export function getTransactionsByDate(date) {
  if (!date) return [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  return state.transactions
    .filter((tx) => formatDate(new Date(tx.date), 'yyyy-MM-dd') === date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getTransactionById(id) {
  return state.transactions.find((tx) => tx.id === id);
}

export function getCustomerSummary() {
  const summary = {};
  state.transactions.forEach((tx) => {
    const customer = tx.customer || 'Umum';
    if (!summary[customer]) {
      summary[customer] = { count: 0, total: 0 };
    }
    summary[customer].count += 1;
    summary[customer].total += tx.total;
  });
  return Object.entries(summary)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
}

export function renderCustomerSummary() {
  const customerSummaryTable = document.getElementById('customerSummaryTable');
  const summary = getCustomerSummary();

  if (!customerSummaryTable) return;

  customerSummaryTable.innerHTML = summary
    .map((customer, index) => `
      <tr class="border-t border-slate-800">
        <td class="px-4 py-4 text-slate-300">${index + 1}</td>
        <td class="px-4 py-4 text-slate-200">${customer.name}</td>
        <td class="px-4 py-4 text-slate-200">${customer.count} Transaksi</td>
        <td class="px-4 py-4 text-emerald-300">${formatRupiah(customer.total)}</td>
      </tr>
    `)
    .join('') || '<tr><td class="px-4 py-6 text-slate-400" colspan="4">Tidak ada data customer.</td></tr>';
}

export function renderDashboardTransactions(filterDate = '') {
  const dashboardTransactionsTable = document.getElementById('dashboardTransactionsTable');
  const transactions = getTransactionsByDate(filterDate);

  if (!dashboardTransactionsTable) return;

  dashboardTransactionsTable.innerHTML = transactions
    .map((tx, index) => `
      <tr class="border-t border-slate-800">
        <td class="px-4 py-4 text-slate-300">${index + 1}</td>
        <td class="px-4 py-4 text-slate-200">${formatDate(new Date(tx.date), 'dd MMM yyyy')}</td>
        <td class="px-4 py-4 text-slate-200">${tx.customer || 'Umum'}</td>
        <td class="px-4 py-4 text-emerald-300">${formatRupiah(tx.total)}</td>
        <td class="px-4 py-4">
          <button type="button" data-transaction-id="${tx.id}" class="rounded-2xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 transition hover:border-emerald-400 hover:text-emerald-300">Lihat</button>
        </td>
      </tr>
    `)
    .join('') || '<tr><td class="px-4 py-6 text-slate-400" colspan="5">Tidak ada transaksi untuk tanggal ini.</td></tr>';
}


export function renderTransactionDetail(transactionId) {
  const detailModal = document.getElementById('modalTransactionDetail');
  const detailTransactionDate = document.getElementById('detailTransactionDate');
  const detailCustomerName = document.getElementById('detailCustomerName');
  const detailTransactionTotal = document.getElementById('detailTransactionTotal');
  const detailTransactionItems = document.getElementById('detailTransactionItems');
  const transaction = getTransactionById(transactionId);

  if (!transaction || !detailModal || !detailTransactionItems) return;

  if (detailTransactionDate) detailTransactionDate.textContent = `Tanggal: ${formatDate(new Date(transaction.date), 'dd MMM yyyy, HH:mm')}`;
  if (detailCustomerName) detailCustomerName.textContent = transaction.customer || 'Umum';
  if (detailTransactionTotal) detailTransactionTotal.textContent = formatRupiah(transaction.total);

  detailTransactionItems.innerHTML = transaction.items
    .map((item) => `
      <tr class="border-t border-slate-800">
        <td class="px-4 py-4 text-slate-200">${item.name}</td>
        <td class="px-4 py-4 text-slate-200">${item.qty}</td>
        <td class="px-4 py-4 text-emerald-300">${formatRupiah(item.price * item.qty)}</td>
      </tr>
    `)
    .join('') || '<tr><td class="px-4 py-6 text-slate-400" colspan="3">Tidak ada item transaksi.</td></tr>';

  detailModal.classList.remove('hidden');
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
  renderDashboardTransactions();
  renderCustomerSummary();
}

export function renderSyncStatus() {
  const syncStatusBadge = document.getElementById('syncStatusBadge');
  const syncIcon = document.getElementById('syncIcon');
  const url = state.settings.googleSheetURL?.trim();
  
  if (url) {
    if (syncStatusBadge) {
      syncStatusBadge.textContent = 'Online';
      syncStatusBadge.classList.remove('text-rose-300');
      syncStatusBadge.classList.add('text-emerald-300');
    }
    if (syncIcon) {
      syncIcon.setAttribute('data-lucide', 'wifi');
      syncIcon.classList.remove('text-rose-300');
      syncIcon.classList.add('text-emerald-300');
    }
  } else {
    if (syncStatusBadge) {
      syncStatusBadge.textContent = 'Offline';
      syncStatusBadge.classList.remove('text-emerald-300');
      syncStatusBadge.classList.add('text-rose-300');
    }
    if (syncIcon) {
      syncIcon.setAttribute('data-lucide', 'wifi-off');
      syncIcon.classList.remove('text-emerald-300');
      syncIcon.classList.add('text-rose-300');
    }
  }
}
