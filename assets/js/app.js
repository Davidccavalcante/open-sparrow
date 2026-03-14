import { buildMenu, loadTable, renderGrid, getState, setFilteredData } from './grid.js';
import { debugLog } from './debug.js';
import { setupPagination } from './pagination.js';

const menuEl = document.getElementById('menu');
const gridTitleEl = document.getElementById('gridTitle');
const addRowBtn = document.getElementById('addRow');
const searchEl = document.getElementById('globalSearch');
const columnFilterEl = document.getElementById('columnFilter');

function renderIconHtml(iconVal, fallbackPath) {
    const icon = iconVal || fallbackPath;
    if (icon.includes('/') || icon.includes('.')) {
        return `<img src="${icon}" alt="" style="width:20px; height:20px; vertical-align:middle; margin-right:8px;">`;
    }
    return `<span style="font-size:1.2em; margin-right:8px; vertical-align:middle;">${icon}</span>`;
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof schema !== 'undefined' && Object.keys(schema.tables).length > 0) {
        const firstTableName = Object.keys(schema.tables)[0];
        
        // Build system menu
        buildMenu(schema, menuEl, gridTitleEl, addRowBtn);

        const navList = menuEl.querySelector('ul') || menuEl;
        
        let dashName = 'Dashboard';
        let dashIconHtml = renderIconHtml('', 'assets/icons/dashboard.png');
        let calName = 'Calendar';
        let calIconHtml = renderIconHtml('', 'assets/icons/calendar.png');

        try {
            const dashRes = await fetch('includes/dashboard.json');
            if (dashRes.ok) {
                const dashCfg = await dashRes.json();
                if (dashCfg.menu_name) dashName = dashCfg.menu_name;
                dashIconHtml = renderIconHtml(dashCfg.menu_icon, 'assets/icons/dashboard.png');
            }
        } catch(e) { console.warn('Could not load dashboard.json for menu'); }

        try {
            const calRes = await fetch('includes/calendar.json');
            if (calRes.ok) {
                const calCfg = await calRes.json();
                if (calCfg.menu_name) calName = calCfg.menu_name;
                calIconHtml = renderIconHtml(calCfg.menu_icon, 'assets/icons/calendar.png');
            }
        } catch(e) { console.warn('Could not load calendar.json for menu'); }

        // Setup Dashboard link
        const dashItem = document.createElement('li');
        const dashLink = document.createElement('a');
        dashLink.href = 'dashboard.php';
        dashLink.className = 'custom-nav-link';
        dashLink.innerHTML = `${dashIconHtml} <span style="vertical-align:middle;">${dashName}</span>`;

        // Setup Calendar link
        const calItem = document.createElement('li');
        const calLink = document.createElement('a');
        calLink.href = 'calendar.php';
        calLink.className = 'custom-nav-link';
        calLink.innerHTML = `${calIconHtml} <span style="vertical-align:middle;">${calName}</span>`;

        // Inject links
        if (navList.tagName === 'UL') {
            dashItem.appendChild(dashLink);
            calItem.appendChild(calLink);
            navList.prepend(calItem);
            navList.prepend(dashItem);
        } else {
            menuEl.prepend(calLink);
            menuEl.prepend(dashLink);
        }
        
        loadTable(schema, firstTableName, gridTitleEl, addRowBtn);
        setupPagination(schema);
    }
});

// Populate column filter dropdown
function populateColumnFilter() {
    const { displayedColumns, currentTable } = getState();
    columnFilterEl.innerHTML = `<option value="">All columns</option>`;
    
    displayedColumns.forEach(col => {
        const opt = document.createElement("option");
        opt.value = col; 
        
        let displayName = col; 
        if (currentTable && schema.tables[currentTable]?.columns[col]?.display_name) {
            displayName = schema.tables[currentTable].columns[col].display_name;
        } else {
            for (const tKey in schema.tables) {
                if (schema.tables[tKey].columns[col]?.display_name) {
                    displayName = schema.tables[tKey].columns[col].display_name;
                    break;
                }
            }
        }
        opt.textContent = displayName; 
        columnFilterEl.appendChild(opt);
    });
}

// Generate dropdown filters for boolean columns
function renderBooleanFilters() {
    const filterBar = document.getElementById('filterBar');
    if (!filterBar) return;
    filterBar.innerHTML = ''; 

    const { currentTable } = getState();
    if (!currentTable || !schema.tables[currentTable]) return;

    const columns = schema.tables[currentTable].columns;
    
    for (const [colName, colCfg] of Object.entries(columns)) {
        if ((colCfg.type || '').toLowerCase().includes('bool')) {
            const select = document.createElement('select');
            
            const displayName = colCfg.display_name || colName;
            select.innerHTML = `
                <option value="">${displayName}: All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
            `;
            
            select.className = 'boolean-filter';
            select.dataset.column = colName;
            
            // Link directly to unified applySearch function
            select.addEventListener('change', applySearch);
            
            filterBar.appendChild(select);
        }
    }
}

// Event triggered when a new table is fully loaded
document.addEventListener("tableLoaded", () => {
    populateColumnFilter();
    renderBooleanFilters();
});

// Global text search and boolean filtering combined
async function applySearch() {
    const { fullData, displayedColumns } = getState();
    const q = searchEl.value.toLowerCase();
    const selectedColumn = columnFilterEl.value; 

    // Find all active boolean filters
    const boolSelects = document.querySelectorAll('.boolean-filter');
    const activeBoolFilters = [];
    boolSelects.forEach(sel => {
        if (sel.value !== '') {
            activeBoolFilters.push({ col: sel.dataset.column, val: sel.value === 'true' });
        }
    });

    let rows = fullData.filter(row => {
        // 1. Validate Boolean Filters First
        for (const filter of activeBoolFilters) {
            const rowVal = row[filter.col];
            const rowBool = (rowVal === true || rowVal === 't' || rowVal === 'true' || rowVal === 1);
            if (rowBool !== filter.val) return false; // Exclude row if boolean doesn't match
        }

        // 2. Validate Text Search Second
        if (q) {
            if (selectedColumn) {
                const raw = (row[selectedColumn] ?? '').toString().toLowerCase();
                const display = (row[selectedColumn + '__display'] ?? '').toString().toLowerCase();
                if (!raw.includes(q) && !display.includes(q)) return false;
            } else {
                const matchesText = displayedColumns.some(col => {
                    const raw = (row[col] ?? '').toString().toLowerCase();
                    const display = (row[col + '__display'] ?? '').toString().toLowerCase();
                    return raw.includes(q) || display.includes(q);
                });
                if (!matchesText) return false; // Exclude if text not found
            }
        }

        return true; // Keep row if it passed all active filters
    });

    setFilteredData(rows);
    await renderGrid(schema);

    debugLog("Search Applied", { query: q, results: rows.length });
}

let searchTimeout;
searchEl.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applySearch, 300);
});

columnFilterEl.addEventListener('change', applySearch);