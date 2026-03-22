<?php

declare(strict_types=1);

function db_connect(): \PgSql\Connection
{

    // Path to the configuration file from the admin panel
    $configFile = __DIR__ . '/database.json';
// Default values (Fallback to environment variables or local values)
    $host = getenv('PGHOST') ?: '';
    $port = getenv('PGPORT') ?: '';
    $dbname = getenv('PGDATABASE') ?: '';
    $user = getenv('PGUSER') ?: '';
    $password = getenv('PGPASSWORD') ?: '';
// Retrieve data entered in the admin panel if the file exists
    if (file_exists($configFile)) {
        $json = file_get_contents($configFile);
        $config = json_decode($json, true);
        if (is_array($config)) {
        // Using ?: so empty values in JSON don't overwrite defaults
            $host = $config['host'] ?: $host;
            $port = $config['port'] ?: $port;
            $dbname = $config['dbname'] ?: $dbname;
            $user = $config['user'] ?: $user;
        // Using ?? here because the password can theoretically be empty
            $password = $config['password'] ?? $password;
        }
    }

    $connStr = sprintf(
        "host=%s port=%s dbname=%s user=%s password=%s",
        $host,
        $port,
        $dbname,
        $user,
        $password
    );
// Suppressing (@) native error in case of bad password to throw a custom, cleaner exception
    $conn = @pg_connect($connStr);
    if (!$conn) {
        throw new RuntimeException('Cannot connect to Postgres: ' . pg_last_error());
    }

    // Set timezone BEFORE returning the connection
    pg_query($conn, "SET TIME ZONE 'Europe/Warsaw'");
    return $conn;
}
