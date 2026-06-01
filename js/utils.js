// Utility functions
export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value || 0);
}

export function formatDate(date, format = '') {
  const d = new Date(date);
  if (format === 'yyyy-MM-dd') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (format === 'dd MMM yyyy') {
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (format === 'dd MMM yyyy, HH:mm') {
    const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const waktu = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${tanggal}, ${waktu}`;
  }
  const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggal = d.toLocaleDateString('id-ID');
  const waktu = d.toLocaleTimeString('id-ID');
  return `${hari}, ${tanggal}, ${waktu}`;
}

export function pad(num) {
  return String(num).padStart(2, '0');
}

export function generateTransactionId() {
  const now = new Date();
  return `TX-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast rounded-3xl px-4 py-3 text-sm font-medium shadow-2xl shadow-slate-950/40 ${type === 'error' ? 'toast-error' : 'toast-success'}`;
  toast.textContent = message;
  document.getElementById('toastContainer').appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

export function findInventoryItem(inventory, name) {
  return inventory.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
}

export function updateTime() {
  const elem = document.getElementById('transactionTime');
  if (elem) elem.value = formatDate(new Date());
}
