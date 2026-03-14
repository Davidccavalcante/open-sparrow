// admin/schema.js
import { createTextInput, createSelectInput, createCheckbox, createColorInput, createIconPicker, moveObjectKey } from './ui.js';

export async function syncSchemaTables(currentConfig, schemaName, onSuccess, onError) {
    try {
        const res = await fetch(`api.php?action=get_db_tables&schema_name=${encodeURIComponent(schemaName)}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            let addedCount = 0;
            if (!currentConfig.tables || Array.isArray(currentConfig.tables)) currentConfig.tables = {};
            
            data.tables.forEach(tbl => {
                if (!currentConfig.tables[tbl]) {
                    currentConfig.tables[tbl] = { display_name: tbl.replace(/_/g, ' ').toUpperCase(), schema: schemaName, columns: {} };
                    addedCount++;
                }
            });
            onSuccess(addedCount);
        } else {
            onError(data.error || 'Failed to sync tables.');
        }
    } catch (e) {
        console.error(e);
        onError('Error communicating with database.');
    }
}

export function renderSchemaEditor(tableName, tableData, ctx) {
    const { workspaceEl, getTableOptions, renderEditor } = ctx;
    workspaceEl.innerHTML = `<h3>Table Properties: ${tableName}</h3>`;

    if (!tableData.columns || Array.isArray(tableData.columns)) tableData.columns = {};
    if (!tableData.foreign_keys || Array.isArray(tableData.foreign_keys)) tableData.foreign_keys = {};
    if (!tableData.subtables || !Array.isArray(tableData.subtables)) tableData.subtables = [];

    const btnSyncCols = document.createElement('button');
    btnSyncCols.className = 'btn-add';
    btnSyncCols.style.background = '#007ACC';
    btnSyncCols.innerHTML = '🔍 Sync Columns from DB';
    btnSyncCols.onclick = async () => {
        const schemaName = tableData.schema || 'app'; 
        const res = await fetch(`api.php?action=get_db_columns&schema_name=${encodeURIComponent(schemaName)}&table=${tableName}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            let added = 0;
            data.columns.forEach(col => {
                if (!tableData.columns[col.column_name]) {
                    const isEnum = col.enum_values !== null;
                    const isNotNull = col.is_nullable === 'NO'; 
                    
                    let typeName = col.data_type;
                    if (isEnum || String(typeName).toUpperCase() === 'USER-DEFINED') {
                        typeName = 'enum';
                    }

                    tableData.columns[col.column_name] = {
                        display_name: col.column_name.replace(/_/g, ' ').toUpperCase(),
                        type: typeName,
                        show_in_grid: true, show_in_edit: true, not_null: isNotNull
                    };
                    if (isEnum) tableData.columns[col.column_name].options = col.enum_values;
                    added++;
                }
            });
            alert(`Added ${added} new columns.`);
            renderEditor(tableName, tableData, false);
        } else {
            alert(data.error || 'Failed to sync columns.');
        }
    };
    workspaceEl.appendChild(btnSyncCols);

    workspaceEl.appendChild(createTextInput('display_name', 'Display Name', tableData.display_name, (val) => tableData.display_name = val));
    workspaceEl.appendChild(createTextInput('schema', 'Database Schema', tableData.schema || 'app', (val) => tableData.schema = val));
    
    workspaceEl.appendChild(createIconPicker('icon', 'Icon Path', tableData.icon, (val) => { if(val) tableData.icon = val; else delete tableData.icon; }));
    
    workspaceEl.appendChild(createCheckbox('hidden', 'Hide from Sidebar Menu', tableData.hidden, (val) => tableData.hidden = val, false));

    const colsTitle = document.createElement('h3');
    colsTitle.textContent = 'Columns Configuration';
    colsTitle.style.marginTop = '30px';
    workspaceEl.appendChild(colsTitle);

    const colKeys = Object.keys(tableData.columns);
    colKeys.forEach((colName, index) => {
        const colCfg = tableData.columns[colName];
        const block = document.createElement('div');
        block.className = 'column-block';
        
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.borderBottom = '1px solid #eee';
        headerDiv.style.paddingBottom = '5px';
        headerDiv.style.marginBottom = '15px';

        const h4 = document.createElement('h4');
        h4.textContent = `Column: ${colName}`;
        h4.style.margin = '0';
        h4.style.borderBottom = 'none';

        const moveControls = document.createElement('div');
        
        const btnUp = document.createElement('button');
        btnUp.innerHTML = '⬆️'; btnUp.title = 'Move Up';
        btnUp.style.cssText = 'background:none; border:none; cursor:pointer; font-size:16px; margin-right:5px;';
        if (index === 0) { btnUp.disabled = true; btnUp.style.opacity = '0.3'; btnUp.style.cursor = 'default'; }
        btnUp.onclick = () => {
            tableData.columns = moveObjectKey(tableData.columns, colName, -1);
            renderEditor(tableName, tableData, false);
        };

        const btnDown = document.createElement('button');
        btnDown.innerHTML = '⬇️'; btnDown.title = 'Move Down';
        btnDown.style.cssText = 'background:none; border:none; cursor:pointer; font-size:16px;';
        if (index === colKeys.length - 1) { btnDown.disabled = true; btnDown.style.opacity = '0.3'; btnDown.style.cursor = 'default'; }
        btnDown.onclick = () => {
            tableData.columns = moveObjectKey(tableData.columns, colName, 1);
            renderEditor(tableName, tableData, false);
        };

        moveControls.appendChild(btnUp);
        moveControls.appendChild(btnDown);
        headerDiv.appendChild(h4);
        headerDiv.appendChild(moveControls);
        block.appendChild(headerDiv);

        block.appendChild(createTextInput('display_name', 'Display Name', colCfg.display_name, (val) => colCfg.display_name = val));
        block.appendChild(createTextInput('type', 'Data Type', colCfg.type, (val) => colCfg.type = val));
        
        const optsStr = colCfg.options ? colCfg.options.join(', ') : '';
        block.appendChild(createTextInput('options', 'Enum Options (Comma separated)', optsStr, (val) => {
            if(val) {
                colCfg.options = val.split(',').map(s => s.trim());
            } else {
                delete colCfg.options;
                delete colCfg.enum_colors;
            }
            renderEditor(tableName, tableData, false);
        }));

        const isTypeEnum = String(colCfg.type || '').toLowerCase() === 'enum';

        if (isTypeEnum && colCfg.options && colCfg.options.length > 0) {
            const colorsContainer = document.createElement('div');
            colorsContainer.style.marginLeft = '20px';
            colorsContainer.style.paddingLeft = '10px';
            colorsContainer.style.borderLeft = '2px solid #007ACC';
            colorsContainer.style.marginBottom = '15px';
            
            const colorsTitle = document.createElement('h5');
            colorsTitle.textContent = '🎨 Enum Colors (Opcjonalnie)';
            colorsTitle.style.marginTop = '0';
            colorsTitle.style.marginBottom = '10px';
            colorsContainer.appendChild(colorsTitle);

            if (!colCfg.enum_colors) colCfg.enum_colors = {};

            colCfg.options.forEach(optVal => {
                colorsContainer.appendChild(createColorInput(
                    `enum_color`,
                    `Color: ${optVal}`,
                    colCfg.enum_colors[optVal] || '#ffffff',
                    (val) => { colCfg.enum_colors[optVal] = val; }
                ));
            });
            block.appendChild(colorsContainer);
        }

        const fkData = tableData.foreign_keys[colName] || {};
        block.appendChild(createSelectInput('fk_ref', 'Foreign Key Reference Table', getTableOptions(), fkData.reference_table || '', (val) => {
            if (val) tableData.foreign_keys[colName] = { reference_table: val, reference_column: fkData.reference_column || 'id', display_column: fkData.display_column || 'name' };
            else delete tableData.foreign_keys[colName];
            renderEditor(tableName, tableData, false); 
        }));

        if (tableData.foreign_keys[colName] && tableData.foreign_keys[colName].reference_table) {
            const fkContainer = document.createElement('div');
            fkContainer.style.marginLeft = '20px'; fkContainer.style.paddingLeft = '10px'; fkContainer.style.borderLeft = '2px solid var(--accent)'; fkContainer.style.marginBottom = '15px';
            fkContainer.appendChild(createTextInput('fk_ref_col', 'Reference Column (e.g., id)', tableData.foreign_keys[colName].reference_column, (val) => tableData.foreign_keys[colName].reference_column = val));
            fkContainer.appendChild(createTextInput('fk_disp_col', 'Display Column (e.g., name)', tableData.foreign_keys[colName].display_column, (val) => tableData.foreign_keys[colName].display_column = val));
            block.appendChild(fkContainer);
        }
        
        block.appendChild(createCheckbox('show_in_grid', 'Show in Grid', colCfg.show_in_grid, (val) => colCfg.show_in_grid = val, true));
        block.appendChild(createCheckbox('show_in_edit', 'Show in Edit Form', colCfg.show_in_edit, (val) => colCfg.show_in_edit = val, true));
        block.appendChild(createCheckbox('not_null', 'Is Required (Not Null)', colCfg.not_null, (val) => colCfg.not_null = val, false));
        block.appendChild(createCheckbox('readonly', 'Read Only', colCfg.readonly, (val) => colCfg.readonly = val, false));
        
        workspaceEl.appendChild(block);
    });

    const subTitle = document.createElement('h3');
    subTitle.textContent = 'Subtables Configuration (Has Many Relationships)';
    subTitle.style.marginTop = '40px';
    workspaceEl.appendChild(subTitle);

    const subContainer = document.createElement('div');
    workspaceEl.appendChild(subContainer);

    const renderSubtables = () => {
        subContainer.innerHTML = '';
        tableData.subtables.forEach((subCfg, index) => {
            const block = document.createElement('div');
            block.className = 'column-block';
            block.style.borderLeft = '4px solid #4CAF50'; 

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.marginBottom = '15px';
            
            const h4 = document.createElement('h4');
            h4.textContent = `Subtable #${index + 1}`;
            h4.style.margin = '0';
            
            const btnDel = document.createElement('button');
            btnDel.textContent = '🗑️ Delete';
            btnDel.style.cssText = 'background:none; border:none; color:red; cursor:pointer; font-weight:bold;';
            btnDel.onclick = () => {
                tableData.subtables.splice(index, 1);
                renderSubtables();
            };

            headerDiv.appendChild(h4);
            headerDiv.appendChild(btnDel);
            block.appendChild(headerDiv);

            block.appendChild(createSelectInput('sub_table', 'Child Table (Target)', getTableOptions(), subCfg.table || '', (val) => subCfg.table = val));
            block.appendChild(createTextInput('sub_fk', 'Foreign Key Column in Child Table', subCfg.foreign_key, (val) => subCfg.foreign_key = val));
            block.appendChild(createTextInput('sub_label', 'Display Label', subCfg.label, (val) => subCfg.label = val));
            
            const colsStr = subCfg.columns_to_show ? subCfg.columns_to_show.join(', ') : '';
            block.appendChild(createTextInput('sub_cols', 'Columns to Show (Comma separated)', colsStr, (val) => {
                if(val) {
                    subCfg.columns_to_show = val.split(',').map(s => s.trim()).filter(s => s !== ''); 
                } else {
                    subCfg.columns_to_show = [];
                }
            }));

            subContainer.appendChild(block);
        });

        const btnAddSub = document.createElement('button');
        btnAddSub.className = 'btn-add';
        btnAddSub.style.background = '#4CAF50';
        btnAddSub.textContent = '+ Add Subtable';
        btnAddSub.onclick = () => {
            tableData.subtables.push({ table: '', foreign_key: '', label: '', columns_to_show: ['id'] });
            renderSubtables();
        };
        subContainer.appendChild(btnAddSub);
    };

    renderSubtables();
}