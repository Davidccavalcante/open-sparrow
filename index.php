<?php

session_start();
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// 1. If this is an API call -> pass control to api.php and exit
if (isset($_GET['api'])) {
    require __DIR__ . '/api.php';
    exit;
}

// 2. If this is a standard request -> load the schema for the template
$schemaPath = __DIR__ . '/includes/schema.json';

if (!file_exists($schemaPath)) {
    http_response_code(500);
    die('Error: Missing schema.json configuration file');
}

$schemaJson = file_get_contents($schemaPath);

if ($schemaJson === false) {
    http_response_code(500);
    die('Error: Cannot read schema.json file');
}

// 3. Render the view
include __DIR__ . '/templates/template.php';
