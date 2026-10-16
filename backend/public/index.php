<?php

require_once __DIR__ . '/../src/Config.php';
require_once __DIR__ . '/../src/Database.php';
require_once __DIR__ . '/../src/Auth.php';

try {
    ensureDatabaseSchema();
    $seed = ensureSeedUser();
} catch (Throwable $e) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database unavailable.']);
    exit;
}

$pdo = getPdo();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($path === '/api/health') {
    jsonResponse(['ok' => true]);
    exit;
}

if ($path === '/api/auth/token' && $method === 'POST') {
    $body = readJsonBody();
    $email = (string) ($body['email'] ?? '');
    $password = (string) ($body['password'] ?? '');

    if ($email === '' || $password === '') {
        jsonResponse(['error' => 'Email or password is incorrect.'], 401);
        exit;
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
        jsonResponse(['error' => 'Email or password is incorrect.'], 401);
        exit;
    }

    $payload = [
        'sub' => $user['id'],
        'email' => $user['email'],
        'exp' => time() + (int) env('JWT_TTL', 43200),
    ];
    $token = signJwt($payload);
    jsonResponse([
        'token' => $token,
        'expiresAt' => gmdate('c', time() + (int) env('JWT_TTL', 43200)),
        'user' => normalizeUser($user),
    ]);
    exit;
}

if ($path === '/api/auth/token' && $method === 'GET') {
    $user = currentUserFromRequest($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    jsonResponse(['user' => $user]);
    exit;
}

if ($path === '/api/auth/token' && $method === 'DELETE') {
    jsonResponse(['ok' => true]);
    exit;
}

if ($path === '/api/users/me' && $method === 'GET') {
    $user = requireUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    jsonResponse(['user' => $user]);
    exit;
}

if ($path === '/api/users/me' && $method === 'PATCH') {
    $user = requireUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    $body = readJsonBody();
    $name = isset($body['name']) ? trim((string) $body['name']) : null;
    $programme = array_key_exists('programme', $body) ? ($body['programme'] === null ? null : trim((string) $body['programme'])) : null;
    $level = array_key_exists('level', $body) ? ($body['level'] === null ? null : trim((string) $body['level'])) : null;
    $avatar = array_key_exists('avatar', $body) ? $body['avatar'] : null;

    if ($name === '' && isset($body['name'])) {
        jsonResponse(['error' => 'Profile details are invalid.'], 400);
        exit;
    }

    $update = [];
    if ($name !== null) {
        $update[] = 'name = :name';
    }
    if ($programme !== null || array_key_exists('programme', $body)) {
        $update[] = 'programme = :programme';
    }
    if ($level !== null || array_key_exists('level', $body)) {
        $update[] = 'level = :level';
    }
    if ($avatar !== null || array_key_exists('avatar', $body)) {
        $update[] = 'avatar = :avatar';
    }

    if (!$update) {
        jsonResponse(['error' => 'Profile details are invalid.'], 400);
        exit;
    }

    $sql = 'UPDATE users SET ' . implode(', ', $update) . ', updated_at = NOW() WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $params = [':id' => $user['id']];
    if ($name !== null) { $params[':name'] = $name; }
    if ($programme !== null || array_key_exists('programme', $body)) { $params[':programme'] = $programme; }
    if ($level !== null || array_key_exists('level', $body)) { $params[':level'] = $level; }
    if ($avatar !== null || array_key_exists('avatar', $body)) { $params[':avatar'] = $avatar; }
    $stmt->execute($params);

    $fresh = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $fresh->execute([':id' => $user['id']]);
    $updated = $fresh->fetch();
    jsonResponse(['user' => normalizeUser($updated)]);
    exit;
}

if ($path === '/api/me/store' && $method === 'GET') {
    $user = requireUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    $collection = $_GET['collection'] ?? '';
    if ($collection !== '') {
        $stmt = $pdo->prepare('SELECT * FROM me_store WHERE user_id = :user_id AND collection = :collection ORDER BY created_at DESC');
        $stmt->execute([':user_id' => $user['id'], ':collection' => $collection]);
        $rows = $stmt->fetchAll();
        $items = array_map(fn($row) => json_decode($row['item'], true), $rows);
        jsonResponse(['items' => $items, 'total' => count($items), 'page' => 1, 'pageSize' => count($items)]);
        exit;
    }

    $stmt = $pdo->prepare('SELECT * FROM me_store WHERE user_id = :user_id ORDER BY created_at DESC');
    $stmt->execute([':user_id' => $user['id']]);
    $rows = $stmt->fetchAll();
    $items = array_map(fn($row) => json_decode($row['item'], true), $rows);
    jsonResponse(['items' => $items, 'total' => count($items), 'page' => 1, 'pageSize' => count($items)]);
    exit;
}

if ($path === '/api/me/store' && $method === 'PUT') {
    $user = requireUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    $body = readJsonBody();
    $collection = (string) ($body['collection'] ?? '');
    $item = $body['item'] ?? [];
    if ($collection === '' || !is_array($item)) {
        jsonResponse(['error' => 'Invalid request body.'], 400);
        exit;
    }

    $id = (string) ($item['id'] ?? bin2hex(random_bytes(8)));
    $jsonValue = json_encode($item, JSON_UNESCAPED_SLASHES);
    $stmt = $pdo->prepare('INSERT INTO me_store (id, user_id, collection, item, created_at, updated_at) VALUES (:id, :user_id, :collection, :item, NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET collection = EXCLUDED.collection, item = EXCLUDED.item, updated_at = NOW()');
    $stmt->execute([
        ':id' => $id,
        ':user_id' => $user['id'],
        ':collection' => $collection,
        ':item' => $jsonValue,
    ]);

    jsonResponse(['item' => $item]);
    exit;
}

if ($path === '/api/saves' && $method === 'GET') {
    $user = requireUser($pdo);
    if (!$user) {
        jsonResponse(['error' => 'Please sign in to continue.'], 401);
        exit;
    }

    jsonResponse(['items' => [], 'total' => 0, 'page' => 1, 'pageSize' => 20]);
    exit;
}

if ($path === '/api/branding/public' && $method === 'GET') {
    jsonResponse([
        'id' => 'campusone-brand',
        'name' => 'CampusOne',
        'theme' => 'light',
        'accent' => '#1d4ed8',
        'logo' => null,
    ]);
    exit;
}

jsonResponse(['error' => 'Route not found: ' . $path], 404);
