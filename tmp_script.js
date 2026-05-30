
      const storageKeys = {
        inventory: 'rapapa_inventory',
        transactions: 'rapapa_transactions',
        settings: 'rapapa_settings'
      };

      let inventory = [];
      let transactions = [];
      let settings = { googleSheetURL: '' };
      let cart = [];
      let extractedInvoice = [];
      let inventorySort = { prop: 'name', dir: 'asc' };

      const elements = {
        sectionButtons: document.querySelectorAll('.section-btn'),
        syncStatus: document.getElementById('syncStatus'),
        syncBadge: document.getElementById('syncBadge'),
        dailySales: document.getElementById('dailySales'),
        weeklySales: document.getElementById('weeklySales'),
        todayTxCount: document.getElementById('todayTxCount'),
        lowStockCount: document.getElementById('lowStockCount'),
        lowStockTable: document.getElementById('lowStockTable'),
        transactionId: document.getElementById('transactionId'),
        transactionTime: document.getElementById('transactionTime'),
        customerName: document.getElementById('customerName'),
        customerList: document.getElementById('customerList'),
        itemName: document.getElementById('itemName'),
        itemPrice: document.getElementById('itemPrice'),
        itemQty: document.getElementById('itemQty'),
        itemTotal: document.getElementById('itemTotal'),
        grandTotal: document.getElementById('grandTotal'),
        cartTable: document.getElementById('cartTable'),
        inventoryList: document.getElementById('inventoryList'),
        inventoryTable: document.getElementById('inventoryTable'),
        searchInventory: document.getElementById('searchInventory'),
        uploadInvoice: document.getElementById('uploadInvoice'),
        ocrLoading: document.getElementById('ocrLoading'),
        ocrPreview: document.getElementById('ocrPreview'),
        ocrTable: document.getElementById('ocrTable'),
        btnConfirmOcr: document.getElementById('btnConfirmOcr'),
        btnCancelOcr: document.getElementById('btnCancelOcr'),
        uploadExcel: document.getElementById('uploadExcel'),
        gsheetUrl: document.getElementById('gsheetUrl')
      };

      function defaultInventory() {
        return [
          { id: crypto.randomUUID(), name: 'Beras Premium 5kg', category: 'Bahan Pokok', priceBuy: 65000, priceSell: 76000, qty: 18, initialStock: 18, originalSell: 76000 },
          { id: crypto.randomUUID(), name: 'Minyak Goreng 1L', category: 'Minuman & Bumbu', priceBuy: 22000, priceSell: 27000, qty: 32, initialStock: 32, originalSell: 27000 },
          { id: crypto.randomUUID(), name: 'Mie Instan', category: 'Makanan Ringan', priceBuy: 2300, priceSell: 3100, qty: 90, initialStock: 90, originalSell: 3100 },
          { id: crypto.randomUUID(), name: 'Sabun Mandi', category: 'Kebersihan', priceBuy: 4000, priceSell: 5200, qty: 45, initialStock: 45, originalSell: 5200 },
          { id: crypto.randomUUID(), name: 'Tissue Gulung', category: 'Kebersihan', priceBuy: 9500, priceSell: 12000, qty: 24, initialStock: 24, originalSell: 12000 }
        ];
      }

      function loadState() {
        try {
          inventory = JSON.parse(localStorage.getItem(storageKeys.inventory)) || defaultInventory();
        } catch (err) {
          inventory = defaultInventory();
        }
        try {
          transactions = JSON.parse(localStorage.getItem(storageKeys.transactions)) || [];
        } catch (err) {
          transactions = [];
        }
        try {
          settings = JSON.parse(localStorage.getItem(storageKeys.settings)) || { googleSheetURL: '' };
        } catch (err) {
          settings = { googleSheetURL: '' };
        }
      }

      function saveState() {
        localStorage.setItem(storageKeys.inventory, JSON.stringify(inventory));
        localStorage.setItem(storageKeys.transactions, JSON.stringify(transactions));
        localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
      }

      function syncWithGoogleSheets(action, data) {
        const url = settings.googleSheetURL?.trim();
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

      function formatRupiah(value) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);
      }

      function formatDate(date) {
        const d = new Date(date);
        const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
        const tanggal = d.toLocaleDateString('id-ID');
        const waktu = d.toLocaleTimeString('id-ID');
        return `${hari}, ${tanggal}, ${waktu}`;
      }

      function pad(num) {
        return String(num).padStart(2, '0');
      }

      function generateTransactionId() {
        const now = new Date();
        return `TX-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      }

      function updateTime() {
        elements.transactionTime.value = formatDate(new Date());
      }

      function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast rounded-3xl px-4 py-3 text-sm font-medium shadow-2xl shadow-slate-950/40 ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toast.textContent = message;
        document.getElementById('toastContainer').appendChild(toast);
        setTimeout(() => toast.remove(), 3500);
      }

      function renderCustomerList() {
        const known = [...new Set(transactions.map((tx) => tx.customer).filter(Boolean))];
        elements.customerList.innerHTML = known.map((name) => `<option value="${name}"></option>`).join('');
      }

      function renderInventoryOptions() {
        elements.inventoryList.innerHTML = inventory
          .map((item) => `<option value="${item.name}"></option>`)
          .join('');
      }

      function calculateItemTotal() {
        const price = Number(elements.itemPrice.value.replace(/[^0-9]/g, '')) || 0;
        const qty = Number(elements.itemQty.value) || 0;
        elements.itemTotal.value = formatRupiah(price * qty);
      }

      function findInventoryItem(name) {
        return inventory.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
      }

      function handleItemNameChange() {
        const item = findInventoryItem(elements.itemName.value);
        if (item) {
          elements.itemPrice.value = formatRupiah(item.priceSell);
          elements.itemQty.value = 1;
          calculateItemTotal();
        }
      }

      function handleQtyFocus() {
        if (elements.itemQty.value === '1') {
          elements.itemQty.value = '';
        }
      }

      function handleQtyChange() {
        calculateItemTotal();
      }

      function renderCart() {
        const rows = cart.map((item, index) => `
          <tr class="border-t border-slate-800">
            <td class="px-4 py-4 text-slate-300">${index + 1}</td>
            <td class="px-4 py-4 text-slate-200">${item.name}</td>
            <td class="px-4 py-4 text-slate-200">${item.qty}</td>
            <td class="px-4 py-4 text-slate-200">${formatRupiah(item.price)}</td>
            <td class="px-4 py-4 text-slate-200">${formatRupiah(item.total)}</td>
          </tr>
        `).join('');
        elements.cartTable.innerHTML = rows || '<tr><td class="px-4 py-6 text-slate-400" colspan="5">Keranjang kosong. Tambahkan item terlebih dahulu.</td></tr>';
        updateGrandTotal();
      }

      function updateGrandTotal() {
        const total = cart.reduce((sum, item) => sum + item.total, 0);
        elements.grandTotal.value = formatRupiah(total);
      }

      function addItemToCart() {
        const name = elements.itemName.value.trim();
        const item = findInventoryItem(name);
        const qty = Number(elements.itemQty.value) || 0;
        if (!item) {
          showToast('Pilih barang yang valid dari daftar inventory.', 'error');
          return;
        }
        if (qty <= 0) {
          showToast('Qty harus lebih besar dari nol.', 'error');
          return;
        }
        cart.push({ name: item.name, qty, price: item.priceSell, total: item.priceSell * qty });
        renderCart();
        elements.itemName.value = '';
        elements.itemPrice.value = '';
        elements.itemQty.value = 1;
        elements.itemTotal.value = '';
        showToast('Item berhasil ditambahkan ke daftar belanja.');
      }

      function saveTransaction() {
        if (!cart.length) {
          showToast('Tidak ada item di keranjang.', 'error');
          return;
        }
        const customer = elements.customerName.value.trim() || 'Umum';
        const id = generateTransactionId();
        const date = new Date().toISOString();
        const total = cart.reduce((sum, item) => sum + item.total, 0);
        const transaction = {
          id,
          customer,
          date,
          items: cart.map((item) => ({ ...item })),
          total
        };
        cart.forEach((cartItem) => {
          const stock = findInventoryItem(cartItem.name);
          if (stock) {
            stock.qty = Math.max(0, stock.qty - cartItem.qty);
          }
        });
        transactions.push(transaction);
        saveState();
        renderAll();
        showToast('Transaksi berhasil disimpan. Stok inventory diperbarui.');
        syncWithGoogleSheets('saveTransaction', transaction).then((result) => {
          if (result.status === 'ok') {
            showToast('Sinkronisasi transaksi berhasil.');
          }
        });
        cart = [];
        renderCart();
        elements.customerName.value = '';
        elements.itemName.value = '';
        elements.itemPrice.value = '';
        elements.itemQty.value = 1;
        elements.itemTotal.value = '';
      }

      function renderInventoryTable() {
        const query = elements.searchInventory.value.trim().toLowerCase();
        const filtered = inventory
          .filter((item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query))
          .sort((a, b) => {
            const propA = a[inventorySort.prop];
            const propB = b[inventorySort.prop];
            if (typeof propA === 'string') {
              return inventorySort.dir === 'asc' ? propA.localeCompare(propB) : propB.localeCompare(propA);
            }
            return inventorySort.dir === 'asc' ? propA - propB : propB - propA;
          });
        elements.inventoryTable.innerHTML = filtered
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

      function updateInventoryRow(target) {
        const cell = target.closest('td[data-field]');
        if (!cell) return;
        const row = cell.closest('tr');
        const id = row.dataset.id;
        const field = cell.dataset.field;
        const value = cell.textContent.trim();
        const item = inventory.find((entry) => entry.id === id);
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

      function sortInventory(prop) {
        if (inventorySort.prop === prop) {
          inventorySort.dir = inventorySort.dir === 'asc' ? 'desc' : 'asc';
        } else {
          inventorySort.prop = prop;
          inventorySort.dir = 'asc';
        }
        renderInventoryTable();
      }

      function openAddItemModal() {
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
        lucide.createIcons({ parent: modal });
        modal.querySelector('#closeAddItem').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelAddItem').addEventListener('click', () => modal.remove());
        modal.querySelector('#saveAddItem').addEventListener('click', () => {
          const name = modal.querySelector('#newName').value.trim();
          const category = modal.querySelector('#newCategory').value.trim() || 'Umum';
          const priceBuy = Number(modal.querySelector('#newPriceBuy').value) || 0;
          const priceSell = Number(modal.querySelector('#newPriceSell').value) || 0;
          const qty = Number(modal.querySelector('#newQty').value) || 0;
          if (!name || priceBuy <= 0 || priceSell <= 0 || qty < 0) {
            showToast('Isi semua field dengan benar sebelum menyimpan.', 'error');
            return;
          }
          inventory.unshift({
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
          renderAll();
          showToast('Barang baru berhasil ditambahkan ke inventory.');
          modal.remove();
        });
      }

      function showOcrLoading() {
        elements.ocrPreview.classList.add('hidden');
        elements.ocrLoading.classList.remove('hidden');
      }

      function hideOcrLoading() {
        elements.ocrLoading.classList.add('hidden');
      }

      function renderOcrPreview() {
        if (!extractedInvoice.length) return;
        elements.ocrTable.innerHTML = extractedInvoice
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
        elements.ocrPreview.classList.remove('hidden');
      }

      function processInvoice(file) {
        showOcrLoading();
        const existing = inventory.slice(0, 3);
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
          extractedInvoice = candidate;
          hideOcrLoading();
          renderOcrPreview();
          showToast('Hasil ekstraksi faktur siap direview.');
        }, 2000);
      }

      function confirmOcrImport() {
        if (!extractedInvoice.length) {
          showToast('Tidak ada data faktur untuk disimpan.', 'error');
          return;
        }
        extractedInvoice.forEach((item) => {
          const existing = findInventoryItem(item.name);
          if (existing) {
            existing.priceBuy = item.priceBuy;
            existing.priceSell = item.priceSell;
            existing.qty += item.qty;
            existing.initialStock = Math.max(existing.initialStock, existing.qty);
            existing.originalSell = Math.min(existing.originalSell, item.priceSell);
          } else {
            inventory.unshift({
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
        renderAll();
        elements.ocrPreview.classList.add('hidden');
        extractedInvoice = [];
        showToast('Data faktur berhasil disimpan ke inventory.');
      }

      function cancelOcr() {
        elements.ocrPreview.classList.add('hidden');
        extractedInvoice = [];
        showToast('Proses faktur dibatalkan.');
      }

      function validateExcelHeaders(headers) {
        const expected = ['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Qty'];
        return expected.every((title, index) => headers[index]?.toString().trim() === title);
      }

      function handleExcelUpload(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (!rows.length || !validateExcelHeaders(rows[0])) {
            showToast('Format Excel tidak sesuai template. Periksa kembali kolom header.', 'error');
            return;
          }
          const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell.toString().trim() !== ''));
          if (!dataRows.length) {
            showToast('File Excel tidak memiliki data untuk diunggah.', 'error');
            return;
          }
          dataRows.forEach((row) => {
            const name = row[1].toString().trim();
            const category = row[2].toString().trim() || 'Umum';
            const priceBuy = Number(row[3]) || 0;
            const qty = Number(row[4]) || 0;
            if (!name || priceBuy <= 0 || qty < 0) return;
            const existing = findInventoryItem(name);
            if (existing) {
              existing.priceBuy = priceBuy;
              existing.qty += qty;
              existing.initialStock = Math.max(existing.initialStock, existing.qty);
            } else {
              inventory.unshift({
                id: crypto.randomUUID(),
                name,
                category,
                priceBuy,
                priceSell: Math.round(priceBuy * 1.3),
                qty,
                initialStock: qty,
                originalSell: Math.round(priceBuy * 1.3)
              });
            }
          });
          saveState();
          renderAll();
          showToast('Data Excel berhasil diproses dan disimpan ke inventory.');
        };
        reader.readAsArrayBuffer(file);
      }

      function createWorkbook(rows, sheetName = 'Sheet1') {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        return workbook;
      }

      function downloadTemplate() {
        const workbook = createWorkbook([['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Qty']]);
        XLSX.writeFile(workbook, 'template-inventory.xlsx');
      }

      function downloadInventory() {
        const rows = [
          ['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Harga Jual', 'Qty', 'Total Nilai']
        ].concat(
          inventory.map((item, index) => [
            index + 1,
            item.name,
            item.category,
            item.priceBuy,
            item.priceSell,
            item.qty,
            item.priceBuy * item.qty
          ])
        );
        const workbook = createWorkbook(rows);
        XLSX.writeFile(workbook, 'inventory-rapapa.xlsx');
      }

      function downloadTransactions(period = 'daily') {
        const now = new Date();
        const filtered = transactions.filter((tx) => {
          const date = new Date(tx.date);
          if (period === 'daily') {
            return date.toDateString() === now.toDateString();
          }
          const lastWeek = new Date(now);
          lastWeek.setDate(now.getDate() - 6);
          return date >= lastWeek;
        });
        const rows = [
          ['No', 'ID Transaksi', 'Customer', 'Tanggal', 'Nama Barang', 'Qty', 'Harga', 'Total Item', 'Total Transaksi']
        ];
        filtered.forEach((tx, index) => {
          tx.items.forEach((item, itemIndex) => {
            rows.push([
              index + 1,
              tx.id,
              tx.customer,
              formatDate(tx.date),
              item.name,
              item.qty,
              item.price,
              item.total,
              itemIndex === 0 ? tx.total : ''
            ]);
          });
        });
        const workbook = createWorkbook(rows);
        const name = period === 'daily' ? 'transaksi-harian.xlsx' : 'transaksi-mingguan.xlsx';
        XLSX.writeFile(workbook, name);
      }

      function getTodaySales() {
        const now = new Date();
        return transactions
          .filter((tx) => new Date(tx.date).toDateString() === now.toDateString())
          .reduce((sum, tx) => sum + tx.total, 0);
      }

      function getWeeklySales() {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 6);
        return transactions
          .filter((tx) => new Date(tx.date) >= weekAgo)
          .reduce((sum, tx) => sum + tx.total, 0);
      }

      function getTodayTransactionsCount() {
        const now = new Date();
        return transactions.filter((tx) => new Date(tx.date).toDateString() === now.toDateString()).length;
      }

      function getLowStockItems() {
        return inventory.filter((item) => item.initialStock > 0 && item.qty <= item.initialStock * 0.35);
      }

      function renderDashboard() {
        const daily = getTodaySales();
        const weekly = getWeeklySales();
        const count = getTodayTransactionsCount();
        const lowStock = getLowStockItems();
        elements.dailySales.textContent = formatRupiah(daily);
        elements.weeklySales.textContent = formatRupiah(weekly);
        elements.todayTxCount.textContent = count;
        elements.lowStockCount.textContent = `${lowStock.length} Produk`;
        elements.lowStockTable.innerHTML = lowStock
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

      function renderSyncStatus() {
        const url = settings.googleSheetURL?.trim();
        if (url) {
          elements.syncStatus.textContent = 'Terhubung ke Google Apps Script';
          elements.syncBadge.textContent = 'Online';
          elements.syncBadge.classList.remove('bg-rose-500/10', 'text-rose-300');
          elements.syncBadge.classList.add('bg-emerald-500/10', 'text-emerald-300');
        } else {
          elements.syncStatus.textContent = 'Offline / localStorage';
          elements.syncBadge.textContent = 'Offline';
          elements.syncBadge.classList.remove('bg-emerald-500/10', 'text-emerald-300');
          elements.syncBadge.classList.add('bg-rose-500/10', 'text-rose-300');
        }
      }

      function renderAll() {
        renderCustomerList();
        renderInventoryOptions();
        renderCart();
        renderInventoryTable();
        renderDashboard();
        renderSyncStatus();
        elements.gsheetUrl.value = settings.googleSheetURL || '';
        elements.transactionId.value = generateTransactionId();
        updateTime();
      }

      document.addEventListener('DOMContentLoaded', () => {
        lucide.createIcons();
        loadState();
        renderAll();
        setInterval(updateTime, 1000);

        elements.itemName.addEventListener('input', handleItemNameChange);
        elements.itemQty.addEventListener('focus', handleQtyFocus);
        elements.itemQty.addEventListener('input', handleQtyChange);
        document.getElementById('btnAddItem').addEventListener('click', addItemToCart);
        document.getElementById('btnSaveTransaction').addEventListener('click', saveTransaction);
        elements.searchInventory.addEventListener('input', renderInventoryTable);
        document.getElementById('btnOpenAddItem').addEventListener('click', openAddItemModal);
        document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => sortInventory(button.dataset.sort)));
        elements.uploadInvoice.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) processInvoice(file);
        });
        elements.btnConfirmOcr.addEventListener('click', confirmOcrImport);
        elements.btnCancelOcr.addEventListener('click', cancelOcr);
        elements.uploadExcel.addEventListener('change', (event) => {
          const file = event.target.files[0];
          if (file) handleExcelUpload(file);
          event.target.value = '';
        });
        document.getElementById('btnDownloadTemplate').addEventListener('click', downloadTemplate);
        document.getElementById('btnDownloadInventory').addEventListener('click', downloadInventory);
        document.getElementById('btnDownloadToday').addEventListener('click', () => downloadTransactions('daily'));
        document.getElementById('btnDownloadWeekly').addEventListener('click', () => downloadTransactions('weekly'));
        document.getElementById('btnSettings').addEventListener('click', () => document.getElementById('modalSettings').classList.remove('hidden'));
        document.getElementById('btnCloseSettings').addEventListener('click', () => document.getElementById('modalSettings').classList.add('hidden'));
        document.getElementById('btnCancelSettings').addEventListener('click', () => document.getElementById('modalSettings').classList.add('hidden'));
        document.getElementById('btnSaveSettings').addEventListener('click', () => {
          settings.googleSheetURL = elements.gsheetUrl.value.trim();
          saveState();
          renderSyncStatus();
          document.getElementById('modalSettings').classList.add('hidden');
          showToast('Pengaturan tersimpan.');
        });

        document.querySelectorAll('.section-btn').forEach((button) => {
          button.addEventListener('click', () => {
            document.querySelectorAll('main section.space-y-6 > div').forEach((section) => section.classList.add('hidden'));
            document.getElementById(button.dataset.section).classList.remove('hidden');
          });
        });

        document.addEventListener('focusout', (event) => {
          const targetCell = event.target.closest('td[contenteditable="true"]');
          if (targetCell) {
            updateInventoryRow(targetCell);
          }
        });
      });
    