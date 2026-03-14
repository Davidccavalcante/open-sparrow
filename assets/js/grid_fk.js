// grid_fk.js
import { attachCellEvents } from './grid_actions.js';
import { debugLog } from './debug.js';

// Cache to store fetched foreign key data and prevent duplicate API calls
const fkCache = {};

export async function renderForeignKeyCell(schema, row, col, currentTable) {
  const td = document.createElement('td');
  const fkCfg = schema.tables[currentTable].foreign_keys?.[col];
  
  if (!fkCfg) return td;

  const refTable = fkCfg.reference_table;
  const refCol   = fkCfg.reference_column || 'id';
  const dispCol  = fkCfg.display_column || refCol;

  // Fetch dictionary data 
  // Storing the Promise itself in the cache protects against race conditions
  // Multiple cells requesting the same table concurrently will await the same Promise
  if (!fkCache[refTable]) {
    fkCache[refTable] = fetch(`index.php?api=list&table=${encodeURIComponent(refTable)}`)
      .then(res => res.json())
      .then(refData => {
        debugLog("FK cache populated", { table: refTable, rows: refData.rows?.length || 0 });
        return refData.rows || [];
      })
      .catch(err => {
        console.error(`Failed to fetch FK for ${refTable}`, err);
        return [];
      });
  }

  const refRows = await fkCache[refTable];

  // Generate a unique ID for the Datalist to avoid cross-cell conflicts
  const dlId = `dl_${currentTable}_${col}_${row['id']}`;

  // Build a modern Input with search/autocomplete functionality
  const input = document.createElement('input');
  input.setAttribute('list', dlId);
  input.dataset.column = col;
  input.dataset.id = row['id'];
  input.placeholder = "— Search —";
  
  // Disable annoying browser history autocomplete suggestions
  input.setAttribute('autocomplete', 'off'); 

  const datalist = document.createElement('datalist');
  datalist.id = dlId;

  let currentDisplay = "";

  refRows.forEach(r => {
    const option = document.createElement('option');
    const displayValue = r[dispCol] ?? r[refCol];
    
    option.value = displayValue;
    
    // Important: Hide the real database ID in a hidden data attribute!
    // This allows the user to search by name, but saves the ID to the DB.
    option.dataset.realId = r[refCol]; 

    // Safe type comparison (String vs Number) to set the initial visual value
    if (String(r[refCol]) === String(row[col])) {
      currentDisplay = displayValue;
    }

    datalist.appendChild(option);
  });

  input.value = currentDisplay;

  // Visual UX safeguard: If the user types something that isn't on the list, 
  // restore the last valid name upon leaving the cell to prevent confusion.
  // The actual database protection is handled in normalizeValue() in grid_actions.js.
  input.addEventListener('blur', () => {
    const isValid = Array.from(datalist.options).some(o => o.value === input.value);
    
    if (!isValid && input.value !== "") {
      // Revert to the last known good value if the typed value doesn't exist
      input.value = currentDisplay; 
    } else if (isValid) {
      // Update the known good value
      currentDisplay = input.value; 
    }
  });

  // Attach universal save listeners from grid_actions.js
  attachCellEvents(input);
  
  td.appendChild(input);
  td.appendChild(datalist);
  return td;
}