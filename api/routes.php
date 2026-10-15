<?php
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/src/controllers/AuthController.php';
require_once __DIR__ . '/src/controllers/UsersController.php';
require_once __DIR__ . '/src/controllers/AnnouncementsController.php';
require_once __DIR__ . '/src/controllers/ClubsController.php';
require_once __DIR__ . '/src/controllers/EventsController.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
$path = $uri;
if ($base && strpos($path, $base) === 0) {
    $path = substr($path, strlen($base));
}
$path = preg_replace('#^/api#', '', $path);
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

// routing table - minimal
if ($segments === []) {
    json_response(['message' => 'CampusOne PHP API (Phase 1 scaffold)', 'routes' => ['auth','users','invitations','announcements','clubs','events','health']]);
}

if ($segments[0] === 'health') {
    json_response(['status' => 'ok', 'time' => date(DATE_ATOM)]);
}

if ($segments[0] === 'auth') {
    // /api/auth
    $sub = $segments[1] ?? null;
    if ($method === 'POST' && $sub === 'register') return AuthController::register($DB);
    if ($method === 'POST' && $sub === 'login') return AuthController::login($DB);
    if ($method === 'POST' && $sub === 'refresh') return AuthController::refresh($DB);
    if ($method === 'POST' && $sub === 'logout') return AuthController::logout($DB);
    if ($method === 'GET' && $sub === 'me') return AuthController::me($DB);
}

if ($segments[0] === 'users') {
    $id = $segments[1] ?? null;
    if ($method === 'GET' && $id) return UsersController::get($DB, $id);
}

if ($segments[0] === 'announcements') {
    if ($method === 'GET') return AnnouncementsController::list($DB);
    if ($method === 'POST') return AnnouncementsController::create($DB);
}

if ($segments[0] === 'clubs') {
    $id = $segments[1] ?? null;
    if ($method === 'GET' && !$id) return ClubsController::list($DB);
    if ($method === 'GET' && $id) return ClubsController::get($DB, $id);
    if ($method === 'POST' && $id && ($segments[2] ?? '') === 'join') return ClubsController::join($DB, $id);
}

if ($segments[0] === 'events') {
    $id = $segments[1] ?? null;
    if ($method === 'GET' && !$id) return EventsController::list($DB);
    if ($method === 'GET' && $id) return EventsController::get($DB, $id);
    if ($method === 'POST' && $id && ($segments[2] ?? '') === 'register') return EventsController::register($DB, $id);
}

// Delegate to existing invitations handler if path starts with invitations
if ($segments[0] === 'invitations') {
    require __DIR__ . '/invitations.php';
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'not_found']);
