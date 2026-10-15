<?php
// Simple invitations API (single-file).
// Place this file at: api/invitations.php
// Requirements: PDO extension for MySQL. Configure DB via environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASS

header('Content-Type: application/json');

$dsnHost = getenv('DB_HOST') ?: '127.0.0.1';
$dsnDb = getenv('DB_NAME') ?: 'campusone';
$dsnUser = getenv('DB_USER') ?: 'root';
$dsnPass = getenv('DB_PASS') ?: '';
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['REQUEST_SCHEME'] ?? '') === 'https' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'example.com';

try {
    $pdo = new PDO("mysql:host={$dsnHost};dbname={$dsnDb};charset=utf8mb4", $dsnUser, $dsnPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed', 'message' => $e->getMessage()]);
    exit;
}

$inputJson = file_get_contents('php://input');
$input = json_decode($inputJson, true);
if (!is_array($input)) {
    // support form-encoded fallback
    $input = $_POST;
}
$method = $_SERVER['REQUEST_METHOD'];

function json_resp($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

// Simple router: GET -> list, POST -> send/accept based on action
if ($method === 'GET') {
    // optional query params: email, status
    $params = [];
    $where = [];
    if (!empty($_GET['email'])) { $where[] = 'email = :email'; $params[':email'] = $_GET['email']; }
    if (!empty($_GET['status'])) { $where[] = 'status = :status'; $params[':status'] = $_GET['status']; }
    $sql = 'SELECT id, email, sender_id, token, status, created_at, accepted_at FROM invitations';
    if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
    $sql .= ' ORDER BY created_at DESC LIMIT 500';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    json_resp(['invitations' => $rows]);
}

$action = $input['action'] ?? null;

if ($method === 'POST' && $action === 'send') {
    $email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $sender_id = isset($input['sender_id']) ? (int)$input['sender_id'] : null;
    if (!$email) json_resp(['error' => 'Invalid email'], 400);

    try {
        $token = bin2hex(random_bytes(16));
        $sql = "INSERT INTO invitations (email, sender_id, token, status, created_at) VALUES (:email, :sender_id, :token, 'pending', NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':email' => $email, ':sender_id' => $sender_id, ':token' => $token]);

        $invite_link = sprintf('%s://%s/invitations/accept?token=%s', $scheme, $host, $token);

        // TODO: Integrate with your mailer to send the invite_link to $email

        json_resp(['message' => 'Invitation created', 'token' => $token, 'invite_link' => $invite_link], 201);
    } catch (Exception $e) {
        json_resp(['error' => 'Database error', 'message' => $e->getMessage()], 500);
    }
}

if ($method === 'POST' && $action === 'accept') {
    $token = $input['token'] ?? null;
    if (!$token) json_resp(['error' => 'Missing token'], 400);

    $sql = 'SELECT id, email, status FROM invitations WHERE token = :token LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':token' => $token]);
    $inv = $stmt->fetch();

    if (!$inv) json_resp(['error' => 'Invalid token'], 404);
    if ($inv['status'] === 'accepted') json_resp(['error' => 'Already accepted'], 400);

    $sql = "UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $inv['id']]);

    // Optionally: create user account or link to existing account here

    json_resp(['message' => 'Invitation accepted', 'email' => $inv['email']]);
}

if ($method === 'POST' && $action === 'revoke') {
    $token = $input['token'] ?? null;
    if (!$token) json_resp(['error' => 'Missing token'], 400);
    $sql = "UPDATE invitations SET status = 'revoked' WHERE token = :token";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':token' => $token]);
    json_resp(['message' => 'Invitation revoked']);
}

json_resp(['error' => 'Unsupported method or action'], 400);
