// admin/security.js
import { createTextInput } from './ui.js';

export function renderSecurityEditor(key, itemData, isArray, ctx) {
    const { workspaceEl, currentConfig } = ctx;
    
    workspaceEl.innerHTML = `
        <h3>Security Settings</h3>
        <p style="color: #777; margin-bottom: 20px;">
            Change the access password for the administrator panel. <br>
            <strong>Default password after installation is: admin</strong>
        </p>
    `;

    workspaceEl.appendChild(createTextInput('admin_password', 'New Admin Password', currentConfig.admin_password || '', v => {
        currentConfig.admin_password = v;
    }));
}