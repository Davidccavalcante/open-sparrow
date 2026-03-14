<?php
declare(strict_types=1);

function db_connect(): \PgSql\Connection {
    $host = getenv('PGHOST') ?: '23206.p.tld.pl';
    $port = getenv('PGPORT') ?: '5432';
    $dbname = getenv('PGDATABASE') ?: 'pg23206_opensparrow';
    $user = getenv('PGUSER') ?: 'pg23206_opensparrow';
    $password = getenv('PGPASSWORD') ?: 'e5L*l5V#g1';

    $connStr = sprintf(
        "host=%s port=%s dbname=%s user=%s password=%s",
        $host, $port, $dbname, $user, $password
    );
    $conn = pg_connect($connStr);
    if (!$conn) {
        throw new RuntimeException('Cannot connect to Postgres: ' . pg_last_error());
    }
    return $conn;
	
	pg_query($conn, "SET TIME ZONE 'Europe/Warsaw'");
}