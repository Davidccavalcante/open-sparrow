<?php

session_start();
if (isset($_SESSION['user_id'])) {
    require __DIR__ . '/includes/db.php';
    require __DIR__ . '/includes/api_helpers.php';
    $conn = db_connect();
// Log logout action
    log_user_action($conn, $_SESSION['user_id'], 'LOGOUT');
}

session_destroy();
header("Location: login.php");
exit;
