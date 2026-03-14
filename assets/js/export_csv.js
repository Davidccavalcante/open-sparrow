import { getState } from './grid.js';
import { debugLog } from './debug.js';

export function exportCSV() {
  const { displayedColumns, filteredData } = getState();
  debugLog("Exporting CSV", { rows: filteredData.length });

  // Build CSV string
  const header = displayedColumns.join(',');
  const rows = filteredData.map(r =>
    displayedColumns.map(c => JSON.stringify(r[c] ?? '')).join(',')
  );
  const csv = [header, ...rows].join('\n');

  // Trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'export.csv';
  a.click();
  URL.revokeObjectURL(url);
}