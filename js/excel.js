// Excel module
import { formatRupiah, formatDate, showToast, findInventoryItem } from './utils.js';
import { state, saveState } from './state.js';

export function validateExcelHeaders(headers) {
  const expected = ['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Qty'];
  return expected.every((title, index) => headers[index]?.toString().trim() === title);
}

export function handleExcelUpload(file) {
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
      
      const existing = findInventoryItem(state.inventory, name);
      if (existing) {
        existing.priceBuy = priceBuy;
        existing.qty += qty;
        existing.initialStock = Math.max(existing.initialStock, existing.qty);
      } else {
        state.inventory.unshift({
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
    showToast('Data Excel berhasil diproses dan disimpan ke inventory.');
  };
  reader.readAsArrayBuffer(file);
}

export function createWorkbook(rows, sheetName = 'Sheet1') {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  return workbook;
}

export function downloadTemplate() {
  const workbook = createWorkbook([['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Qty']]);
  XLSX.writeFile(workbook, 'template-inventory.xlsx');
  showToast('Template berhasil diunduh.');
}

export function downloadInventory() {
  const rows = [
    ['No', 'Nama Barang', 'Kategori', 'Harga Beli', 'Harga Jual', 'Qty', 'Total Nilai']
  ].concat(
    state.inventory.map((item, index) => [
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
  showToast('Inventory berhasil diunduh.');
}

export function downloadTransactions(period = 'daily') {
  const now = new Date();
  const filtered = state.transactions.filter((tx) => {
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
  showToast(`Laporan ${period === 'daily' ? 'harian' : 'mingguan'} berhasil diunduh.`);
}

export function setupExcelHandlers() {
  const uploadExcel = document.getElementById('uploadExcel');
  const btnDownloadTemplate = document.getElementById('btnDownloadTemplate');
  const btnDownloadInventory = document.getElementById('btnDownloadInventory');
  const btnDownloadToday = document.getElementById('btnDownloadToday');
  const btnDownloadWeekly = document.getElementById('btnDownloadWeekly');
  
  if (uploadExcel) {
    uploadExcel.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (file) {
        handleExcelUpload(file);
        event.target.value = '';
      }
    });
  }
  
  if (btnDownloadTemplate) btnDownloadTemplate.addEventListener('click', downloadTemplate);
  if (btnDownloadInventory) btnDownloadInventory.addEventListener('click', downloadInventory);
  if (btnDownloadToday) btnDownloadToday.addEventListener('click', () => downloadTransactions('daily'));
  if (btnDownloadWeekly) btnDownloadWeekly.addEventListener('click', () => downloadTransactions('weekly'));
}
