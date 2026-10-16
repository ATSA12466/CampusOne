<?php

require_once __DIR__ . '/Config.php';

function getPdo(): PDO
{
    $host = env('DB_HOST', '127.0.0.1');
    $port = env('DB_PORT', '5432');
    $db = env('DB_NAME', 'campusone');
    $user = env('DB_USER', 'postgres');
    $pass = env('DB_PASSWORD', 'postgres');

    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s', $host, $port, $db, $user, $pass);

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    return $pdo;
}

function ensureDatabaseSchema(): void
{
    $pdo = getPdo();
    $sql = file_get_contents(APP_ROOT . '/database/schema.sql');
    if ($sql === false) {
        return;
    }

    $pdo->exec($sql);
}

function ensureSeedUser(): array
{
    $pdo = getPdo();
    $user = $pdo->query("SELECT * FROM users WHERE email = 'demo@campusone.test' LIMIT 1")->fetch();
    if ($user) {
        return $user;
    }

    $id = 'user-1';
    $passwordHash = password_hash('password123', PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, name, role, roles, permissions, programme, level, verified_student, avatar) VALUES (:id, :email, :password_hash, :name, :role, :roles, :permissions, :programme, :level, :verified_student, :avatar)');
    $stmt->execute([
        ':id' => $id,
        ':email' => 'demo@campusone.test',
        ':password_hash' => $passwordHash,
        ':name' => 'CampusOne Demo User',
        ':role' => 'student',
        ':roles' => json_encode(['student']),
        ':permissions' => json_encode(['read:profile', 'write:profile', 'read:clubs', 'read:events']),
        ':programme' => 'Computer Science',
        ':level' => 'Level 200',
        ':verified_student' => true,
        ':avatar' => null,
    ]);

    $user = $pdo->query("SELECT * FROM users WHERE id = '$id' LIMIT 1")->fetch();
    return $user ?: [];
}
