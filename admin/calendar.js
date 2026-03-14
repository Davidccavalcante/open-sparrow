// admin/calendar.js
import { createTextInput, createSelectInput, createColorInput, createIconPicker } from './ui.js';

export function renderCalendarEditor(key, itemData, isArray, ctx) {
    const { workspaceEl, getTableOptions, getColumnOptionsForTable, renderEditor } = ctx;
    
    if (itemData.date_field !== undefined) {
        itemData.date_column = itemData.date_field;
        delete itemData.date_field;
    }
    if (itemData.title_field !== undefined) {
        itemData.title_column = itemData.title_field;
        delete itemData.title_field;
    }
    if (itemData.user_id_field !== undefined) {
        itemData.user_id_column = itemData.user_id_field;
        delete itemData.user_id_field;
    }
    // ------------------------------------------------

    const columnOptions = getColumnOptionsForTable(itemData.table);

    workspaceEl.appendChild(createSelectInput('table', 'Source Table', getTableOptions(), itemData.table, v => { 
        itemData.table = v; 
        itemData.date_column = ""; 
        itemData.title_column = ""; 
        itemData.user_id_column = "";
        renderEditor(key, itemData, isArray); 
    }));
    
    workspaceEl.appendChild(createSelectInput('date_column', 'Date Column Name', columnOptions, itemData.date_column, v => itemData.date_column = v));
    workspaceEl.appendChild(createSelectInput('title_column', 'Title Column Name', columnOptions, itemData.title_column, v => itemData.title_column = v));
    
    workspaceEl.appendChild(createIconPicker('icon', 'Event Icon', itemData.icon || '', v => {
        if (v && v.trim() !== '') {
            itemData.icon = v;
        } else {
            delete itemData.icon;
        }
    }));
    
    workspaceEl.appendChild(createColorInput('color', 'Event Color', itemData.color || '#3788d8', v => itemData.color = v));
    workspaceEl.appendChild(createTextInput('notify_before_days', 'Notify Before (Days)', itemData.notify_before_days, v => itemData.notify_before_days = parseInt(v) || 0));
    workspaceEl.appendChild(createSelectInput('user_id_column', 'User ID Column (For notifications)', columnOptions, itemData.user_id_column, v => itemData.user_id_column = v));
    workspaceEl.appendChild(createTextInput('url_template', 'URL Template', itemData.url_template, v => itemData.url_template = v));
}