import { CustomDateRange, Sale, TimeFilter } from '../types';

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'रु. 0';
  return 'रु. ' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateString;
  }
}

export function generateInvoiceNo(salesOrCount: Sale[] | number): string {
  if (typeof salesOrCount === 'number') {
    return `INV-${salesOrCount + 1}`;
  }

  if (!salesOrCount || salesOrCount.length === 0) {
    return 'INV-1';
  }

  let maxInvNum = 0;
  for (const s of salesOrCount) {
    if (!s || !s.invoiceNo) continue;
    // Match INV-1, INV-2, inv-3, etc.
    const invMatch = s.invoiceNo.match(/^INV-(\d+)$/i);
    if (invMatch && invMatch[1]) {
      const num = parseInt(invMatch[1], 10);
      if (!isNaN(num) && num < 1000000) {
        if (num > maxInvNum) maxInvNum = num;
      }
    } else {
      // Also match plain sequential numbers (e.g. 1, 2, 3)
      const numMatch = s.invoiceNo.match(/^(\d+)$/);
      if (numMatch && numMatch[1]) {
        const num = parseInt(numMatch[1], 10);
        if (!isNaN(num) && num < 100000) {
          if (num > maxInvNum) maxInvNum = num;
        }
      }
    }
  }

  const nextNum = Math.max(salesOrCount.length + 1, maxInvNum + 1);
  return `INV-${nextNum}`;
}

export function generatePurchaseInvoiceNo(lastCount: number): string {
  const year = new Date().getFullYear();
  const seq = String(lastCount + 1).padStart(3, '0');
  return `PUR-${year}-${seq}`;
}

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  timeFilter: TimeFilter,
  customRange?: CustomDateRange
): T[] {
  if (timeFilter === 'all') return items;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return items.filter((item) => {
    if (!item.date) return false;
    const itemDateStr = item.date.split('T')[0];
    const itemDate = new Date(itemDateStr);

    switch (timeFilter) {
      case 'today':
        return itemDateStr === todayStr;

      case 'yesterday':
        return itemDateStr === yesterdayStr;

      case 'week': {
        const startOfWeek = new Date(now);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return itemDate >= startOfWeek && itemDate <= now;
      }

      case 'month':
        return (
          itemDate.getFullYear() === now.getFullYear() &&
          itemDate.getMonth() === now.getMonth()
        );

      case 'year':
        return itemDate.getFullYear() === now.getFullYear();

      case 'custom': {
        if (!customRange || !customRange.from || !customRange.to) return true;
        const fromDate = new Date(customRange.from);
        const toDate = new Date(customRange.to);
        toDate.setHours(23, 59, 59, 999);
        return itemDate >= fromDate && itemDate <= toDate;
      }

      default:
        return true;
    }
  });
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
      '\n'
    );

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
