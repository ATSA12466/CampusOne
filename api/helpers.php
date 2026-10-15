<?php
// Minimal helper functions used by controllers

function json_response($data, $code = 200) {
    header('Content-Type: application/json');
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function get_json_input() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    $pad = 4 - (strlen($data) % 4);
    if ($pad < 4) $data .= str_repeat('=', $pad);
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode($payload, $secret, $expirySeconds = 3600) {
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['exp'] = time() + $expirySeconds;
    $segments = [];
    $segments[] = base64url_encode(json_encode($header));
    $segments[] = base64url_encode(json_encode($payload));
    $signing_input = implode('.', $segments);
    $signature = hash_hmac('sha256', $signing_input, $secret, true);
    $segments[] = base64url_encode($signature);
    return implode('.', $segments);
}

function jwt_decode($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$head64, $payload64, $sig64] = $parts;
    $signing_input = $head64 . '.' . $payload64;
    $expected_sig = base64url_encode(hash_hmac('sha256', $signing_input, $secret, true));
    if (!hash_equals($expected_sig, $sig64)) return null;
    $payload = json_decode(base64url_decode($payload64), true);
    if (!$payload) return null;
    if (isset($payload['exp']) && time() > $payload['exp']) return null;
    return $payload;
}

function get_bearer_token() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null;
    if (!$h) return null;
    if (preg_match('/Bearer\s+(.*)$/i', $h, $matches)) return $matches[1];
    return null;
}
