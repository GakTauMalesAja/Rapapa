// Transaction module
import { formatRupiah, generateTransactionId, showToast, findInventoryItem, updateTime } from './utils.js';
import { state, saveState, syncWithGoogleSheets } from './state.js';

export function renderCustomerList() {
  const known = [...new Set(state.transactions.map((tx) => tx.customer).filter(Boolean))];
  const customerList = document.getElementById('customerList');
  if (customerList) {
    customerList.innerHTML = known.map((name) => `<option value="${name}"></option>`).join('');
  }
}

export function calculateItemTotal() {
  const itemPrice = document.getElementById('itemPrice');
  const itemQty = document.getElementById('itemQty');
  const itemTotal = document.getElementById('itemTotal');
  
  const price = Number(itemPrice?.value.replace(/[^0-9]/g, '')) || 0;
  const qty = Number(itemQty?.value) || 0;
  if (itemTotal) itemTotal.value = formatRupiah(price * qty);
}

export function handleItemNameChange() {
  const itemName = document.getElementById('itemName');
  const itemPrice = document.getElementById('itemPrice');
  const itemQty = document.getElementById('itemQty');
  
  const item = findInventoryItem(state.inventory, itemName?.value);
  if (item) {
    if (itemPrice) itemPrice.value = formatRupiah(item.priceSell);
    if (itemQty) itemQty.value = 1;
    calculateItemTotal();
  }
}

export function handleQtyFocus() {
  const itemQty = document.getElementById('itemQty');
  if (itemQty?.value === '1') {
    itemQty.value = '';
  }
}

export function handleQtyChange() {
  calculateItemTotal();
}

export function renderCart() {
  const cartTable = document.getElementById('cartTable');
  const rows = state.cart.map((item, index) => `
    <tr class="border-t border-slate-800">
      <td class="px-4 py-4 text-slate-300">${index + 1}</td>
      <td class="px-4 py-4 text-slate-200">${item.name}</td>
      <td class="px-4 py-4 text-slate-200">${item.qty}</td>
      <td class="px-4 py-4 text-slate-200">${formatRupiah(item.price)}</td>
      <td class="px-4 py-4 text-slate-200">${formatRupiah(item.total)}</td>
    </tr>
  `).join('');
  
  if (cartTable) {
    cartTable.innerHTML = rows || '<tr><td class="px-4 py-6 text-slate-400" colspan="5">Keranjang kosong. Tambahkan item terlebih dahulu.</td></tr>';
  }
  updateGrandTotal();
}

export function updateGrandTotal() {
  const grandTotal = document.getElementById('grandTotal');
  const total = state.cart.reduce((sum, item) => sum + item.total, 0);
  if (grandTotal) grandTotal.value = formatRupiah(total);
}

export function addItemToCart() {
  const itemName = document.getElementById('itemName');
  const itemQty = document.getElementById('itemQty');
  
  const name = itemName?.value.trim();
  const item = findInventoryItem(state.inventory, name);
  const qty = Number(itemQty?.value) || 0;
  
  if (!item) {
    showToast('Pilih barang yang valid dari daftar inventory.', 'error');
    return;
  }
  if (qty <= 0) {
    showToast('Qty harus lebih besar dari nol.', 'error');
    return;
  }
  
  state.cart.push({ name: item.name, qty, price: item.priceSell, total: item.priceSell * qty });
  renderCart();
  
  if (itemName) itemName.value = '';
  const itemPrice = document.getElementById('itemPrice');
  if (itemPrice) itemPrice.value = '';
  if (itemQty) itemQty.value = 1;
  const itemTotal = document.getElementById('itemTotal');
  if (itemTotal) itemTotal.value = '';
  
  showToast('Item berhasil ditambahkan ke daftar belanja.');
}

export function saveTransaction() {
  if (!state.cart.length) {
    showToast('Tidak ada item di keranjang.', 'error');
    return;
  }
  
  const customerName = document.getElementById('customerName');
  const customer = customerName?.value.trim() || 'Umum';
  const id = generateTransactionId();
  const date = new Date().toISOString();
  const total = state.cart.reduce((sum, item) => sum + item.total, 0);
  
  const transaction = {
    id,
    customer,
    date,
    items: state.cart.map((item) => ({ ...item })),
    total
  };
  
  state.cart.forEach((cartItem) => {
    const stock = findInventoryItem(state.inventory, cartItem.name);
    if (stock) {
      stock.qty = Math.max(0, stock.qty - cartItem.qty);
    }
  });
  
  state.transactions.push(transaction);
  saveState();
  
  renderCart();
  if (customerName) customerName.value = '';
  const itemName = document.getElementById('itemName');
  if (itemName) itemName.value = '';
  const itemPrice = document.getElementById('itemPrice');
  if (itemPrice) itemPrice.value = '';
  const itemQty = document.getElementById('itemQty');
  if (itemQty) itemQty.value = 1;
  const itemTotal = document.getElementById('itemTotal');
  if (itemTotal) itemTotal.value = '';
  
  showToast('Transaksi berhasil disimpan. Stok inventory diperbarui.');
  
  syncWithGoogleSheets('saveTransaction', transaction).then((result) => {
    if (result.status === 'ok') {
      showToast('Sinkronisasi transaksi berhasil.');
    }
  });
  
  state.cart = [];
  renderCart();
}

export function setupTransactionHandlers() {
  const btnAddItem = document.getElementById('btnAddItem');
  const btnSaveTransaction = document.getElementById('btnSaveTransaction');
  const itemName = document.getElementById('itemName');
  const itemQty = document.getElementById('itemQty');
  
  if (btnAddItem) btnAddItem.addEventListener('click', addItemToCart);
  if (btnSaveTransaction) btnSaveTransaction.addEventListener('click', saveTransaction);
  if (itemName) itemName.addEventListener('input', handleItemNameChange);
  if (itemQty) {
    itemQty.addEventListener('focus', handleQtyFocus);
    itemQty.addEventListener('input', handleQtyChange);
  }
}
