// admin/health.js
export async function renderHealthDashboard(ctx) {
    const { workspaceEl } = ctx;
    workspaceEl.innerHTML = `<h3>Checking system status...</h3>`;
    
    try {
        const res = await fetch('api.php?action=health');
        const data = await res.json();
        
        let html = `
            <h3>Server Diagnostics (System Health)</h3>
            <p style="color: #777; margin-bottom: 20px;">This panel helps diagnose issues with your hosting environment after installing Sparrow CRM.</p>
            <div style="display:grid; gap: 15px;">
        `;

        const renderCard = (title, isOk, msg) => `
            <div style="padding: 15px; border-left: 4px solid ${isOk ? '#10b981' : '#ef4444'}; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 4px;">
                <strong style="font-size: 16px; display: block; margin-bottom: 5px;">${isOk ? '✅' : '❌'} ${title}</strong>
                <span style="color: #475569; font-size: 14px;">${msg}</span>
            </div>
        `;

        html += renderCard('PHP Version', data.php_version_ok, `Installed: <strong>${data.php_version}</strong> (Required: PHP >= 8.0)`);
        html += renderCard('PostgreSQL Module', data.pgsql_ok, data.pgsql_ok ? 'Installed and active (pdo_pgsql / pgsql)' : 'Extension missing! Database will not work. Enable it in your hosting panel.');
        
        if (data.db_connected) {
            html += renderCard('Database Connection', true, 'Successfully connected to PostgreSQL using your credentials.');
        } else {
            html += renderCard('Database Connection', false, `Connection failed: <strong>${data.db_error}</strong>. Check your Database settings!`);
        }

        html += renderCard('Write Permissions (includes/ directory)', data.dir_writable, data.dir_writable ? 'Directory has write permissions (JSON files can be saved)' : 'No write permissions! Change CHMOD of the includes/ folder to 755.');

        html += `</div>`;

        // --- INITIALIZE DATABASE ---
        if (data.db_connected) {
            html += `
                <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px;">
                    <h4 style="margin-top:0; color: #1d4ed8;">🚀 First Time Setup</h4>
                    <p style="font-size: 14px; color: #1e40af;">Click the button below to create core system tables (Users, Logs, Notifications) and the default admin account.</p>
                    <button id="initDbBtn" style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s;">
                        Initialize System Tables
                    </button>
                </div>
            `;
        }
        // ------------------------------------------------

        workspaceEl.innerHTML = html;

        const initBtn = document.getElementById('initDbBtn');
        if (initBtn) {
            initBtn.onclick = async () => {
                if (!confirm("This will execute DDL scripts to create system tables in the 'app' schema. Continue?")) return;
                
                initBtn.disabled = true;
                initBtn.innerText = "Processing...";

                try {
                    const setupRes = await fetch('api.php?action=init_db');
                    const result = await setupRes.json();
                    if (result.status === 'success') {
                        alert("Success! System tables initialized. You can now sync them in the Schema tab.");
                        location.reload();
                    } else {
                        alert("Error: " + result.error);
                        initBtn.disabled = false;
                        initBtn.innerText = "Initialize System Tables";
                    }
                } catch (err) {
                    alert("Request failed. Check console for details.");
                    initBtn.disabled = false;
                    initBtn.innerText = "Initialize System Tables";
                }
            };
        }

    } catch (e) {
        workspaceEl.innerHTML = `<h3 style="color:#ef4444;">❌ Error loading diagnostics! Check server logs.</h3>`;
    }
}