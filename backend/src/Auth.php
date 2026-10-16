<?php

require_once __DIR__ . '/Config.php';

function base64UrlEncode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64UrlDecode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }
    return base64_decode(strtr($value, '-_', '+/'));
}

function signJwt(array $payload): string
{
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $secret = env('JWT_SECRET', 'campusone-dev-secret');
    $encodedHeader = base64UrlEncode(json_encode($header));
    $encodedPayload = base64UrlEncode(json_encode($payload));
    $signatureInput = $encodedHeader . '.' . $encodedPayload;
    $signature = hash_hmac('sha256', $signatureInput, $secret, true);
    return $signatureInput . '.' . base64UrlEncode($signature);
}

function verifyJwt(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;
    $secret = env('JWT_SECRET', 'campusone-dev-secret');
    $expected = hash_hmac('sha256', $header . '.' . $payload, $secret, true);
    if (!hash_equals(base64UrlEncode($expected), $signature)) {
        return null;
    }

    $decodedPayload = json_decode(base64UrlDecode($payload), true);
    if (!is_array($decodedPayload)) {
        return null;
    }

    if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
        return null;
    }

    return $decodedPayload;
}

function bearerToken(): ?string
{
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
        return $matches[1];
    }
    return null;
}

function currentUserFromRequest(PDO $pdo): ?array
{
    $token = bearerToken();
    if (!$token) {
        return null;
    }

    $claims = verifyJwt($token);
    if (!$claims) {
        return null;
    }

    $subject = $claims['sub'] ?? $claims['email'] ?? null;
    if (!$subject) {
        return null;
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :subject OR email = :subject LIMIT 1');
    $stmt->execute([':subject' => $subject]);
    $user = $stmt->fetch();

    if (!$user) {
        return null;
    }

    return normalizeUser($user);
}

function normalizeUser(array $user): array
{
    $roles = json_decode($user['roles'] ?? '[]', true);
    $permissions = json_decode($user['permissions'] ?? '[]', true);
    return [
        'id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'roles' => is_array($roles) ? $roles : [],
        'permissions' => is_array($permissions) ? $permissions : [],
        'programme' => $user['programme'] ?? null,
        'level' => $user['level'] ?? null,
        'verifiedStudent' => (bool) ($user['verified_student'] ?? true),
        'avatar' => $user['avatar'] ?? null,
    ];
}

function requireUser(PDO $pdo): ?array
{
    return currentUserFromRequest($pdo);
}

function jsonResponse($payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
