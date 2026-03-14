<?php
session_start();

// Default password for fresh GitHub installation
$admin_password = 'admin'; 

$securityFile = __DIR__ . '/../includes/security.json';
if (file_exists($securityFile)) {
    $secData = json_decode(file_get_contents($securityFile), true);
    if (isset($secData['admin_password']) && $secData['admin_password'] !== '') {
        $admin_password = $secData['admin_password'];
    }
}

if (isset($_GET['logout'])) {
    unset($_SESSION['sparrow_admin_logged_in']);
    header("Location: index.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
    if ($_POST['admin_password'] === $admin_password) {
        $_SESSION['sparrow_admin_logged_in'] = true;
        header("Location: index.php");
        exit;
    } else {
        $login_error = "Invalid password!";
    }
}

if (!isset($_SESSION['sparrow_admin_logged_in']) || $_SESSION['sparrow_admin_logged_in'] !== true) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Sparrow Admin | Login</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { margin: 0; padding: 0; font-family: sans-serif; background: #e2e8f0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            .login-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 320px; text-align: center; }
            .login-card h2 { margin-top: 0; color: #334155; }
            .login-card input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; outline: none; }
            .login-card input:focus { border-color: #3b82f6; }
            .login-card button { width: 100%; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
            .login-card button:hover { background: #2563eb; }
            .error { color: #ef4444; font-size: 14px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="login-card">
            <h2>Sparrow Admin</h2>
            <p style="font-size:13px; color:#666; margin-bottom:15px;">Default password: <strong>admin</strong></p>
            <?php if (isset($login_error)) echo "<div class='error'>{$login_error}</div>"; ?>
            <form method="POST" action="index.php">
                <input type="password" name="admin_password" placeholder="Enter password" required autofocus>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sparrow Admin | Dashboard</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
    <link rel="stylesheet" href="style.css?v=<?php echo filemtime('style.css'); ?>">
</head>
<body>
    <header>
        <div class="brand-logo">
            <h1>Sparrow Admin</h1>
        </div>
        
		<div class="admin-header-tabs">
            <button class="admin-tab active" data-file="schema">Schema</button>
            <button class="admin-tab" data-file="dashboard">Dashboard</button>
            <button class="admin-tab" data-file="calendar">Calendar</button>
            <button class="admin-tab" data-file="database">Database</button>
            <button class="admin-tab" data-file="security">Security</button>
            <button class="admin-tab" data-file="health">System Health</button>
            <button class="admin-tab" data-file="docs">Documentation</button>
        </div>

        <div class="header-user-menu">
            <label style="color: white; margin-right: 15px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="debugToggle" style="cursor: pointer; accent-color: var(--accent);">
                Debug Mode
            </label>
            
            <button id="btnExport" class="btn-logout" style="background: #10b981; border-color: #10b981; margin-right:5px;" title="Download JSON Backup">📥 Export Config</button>
            <button id="btnImport" class="btn-logout" style="background: #f59e0b; border-color: #f59e0b; margin-right:15px;" title="Upload JSON Backup">📤 Import Config</button>
            <input type="file" id="importFileInput" accept=".zip" style="display: none;">

            <button id="btnSave" class="btn-logout" style="background: var(--accent); color: white; border-color: var(--accent);">Save File</button>
            <button onclick="window.location.href='index.php?logout=1'" class="btn-logout" style="background: #ef4444; border-color: #ef4444;">Logout</button>
            <button onclick="window.location.href='../index.php'" class="btn-logout">Back to CRM</button>
        </div>
    </header>

    <main class="admin-container">
        <aside class="admin-sidebar" id="sidebar">
            <h3 id="sidebarTitle">Tables</h3>
            <ul id="itemList"></ul>
        </aside>

        <section class="admin-workspace" id="workspace">
            <h2>Select an item to edit</h2>
            <div id="editorForm"></div>
        </section>
    </main>

    <script type="module" src="app.js?v=<?php echo filemtime('app.js'); ?>"></script>
</body>
</html>