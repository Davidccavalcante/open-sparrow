<?php

session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>OpenSparrow | Dashboard | Open source</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="/assets/css/styles.css" rel="stylesheet" />
    <link href="/assets/css/mobile.css" rel="stylesheet" media="only screen and (max-width: 768px)" />
    <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>

<header>
    <a href="index.php" class="brand-logo">
       <img src="assets/img/logo-blue.png" alt="OpenSparrow Logo" />
  </a>
    <button onclick="window.location.href='index.php'" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.4); color: white; margin-right: auto; margin-left: 20px; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
        &larr; Back to Grid
    </button>
</header>

<main style="padding: 20px;">
    <h2 id="gridTitle" style="margin-bottom: 20px;">Dashboard</h2>
    
    <section id="dashboardSection" class="dashboard-grid"></section> 
</main>

<footer>
    <div class="footer-content">
        <small>
            <a href="https://opensparrow.org/">OpenSparrow.org</a> | Open source | LGPL v3. | PHP + vanilla JS + Postgres!
        </small>
    </div>
</footer>

<script type="module" src="assets/js/dashboard.js"></script>

</body>
</html>
