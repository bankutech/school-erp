import { DeltaComparison } from '../types';

/**
 * Format currency in Indian Rupees (INR)
 * Supports full standard notation or compact notation (K, L, Cr)
 */
export function formatCurrencyINR(amount: number, compact = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';

    if (abs >= 10000000) {
      // Crores
      return `${sign}₹${(abs / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (abs >= 100000) {
      // Lakhs
      return `${sign}₹${(abs / 100000).toFixed(2).replace(/\.00$/, '')} L`;
    }
    if (abs >= 1000) {
      // Thousands
      return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.0$/, '')} K`;
    }
    return `${sign}₹${abs.toLocaleString('en-IN')}`;
  }

  return `₹${Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

/**
 * Format numbers with compact standard metric suffixes (e.g. 1.2k, 4.5M)
 */
export function formatCompactNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1000000) {
    return `${sign}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }

  return `${sign}${abs.toLocaleString('en-IN')}`;
}

/**
 * Compute delta change and formatted percentage vs previous period
 */
export function calculateDelta(current: number, previous?: number): DeltaComparison {
  if (previous === undefined || previous === null || isNaN(previous) || previous === 0) {
    return {
      deltaValue: 0,
      deltaPercent: 0,
      isPositive: true,
      isZero: true,
      formattedDelta: '0.0%',
    };
  }

  const deltaValue = current - previous;
  const deltaPercent = (deltaValue / Math.abs(previous)) * 100;
  const isZero = Math.abs(deltaPercent) < 0.05;
  const isPositive = deltaPercent >= 0;

  const formattedDelta = `${isPositive && !isZero ? '+' : ''}${deltaPercent.toFixed(1)}%`;

  return {
    deltaValue,
    deltaPercent,
    isPositive,
    isZero,
    formattedDelta,
  };
}

/**
 * Download arbitrary tabular chart data as CSV
 */
export function downloadChartCsv(
  data: Array<Record<string, any>>,
  filename = 'chart-data.csv'
): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header];
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val ?? '';
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export container SVG as scalable standalone SVG file
 */
export function exportChartSvg(
  containerElement: HTMLElement | null,
  filename = 'chart.svg'
): void {
  if (!containerElement) return;

  const svg = containerElement.querySelector('svg');
  if (!svg) return;

  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);

  // Add namespaces if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!source.match(/^<svg[^>]+xmlns\:xlink="http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  const preface = '<?xml version="1.0" standalone="no"?>\r\n';
  const blob = new Blob([preface, source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
