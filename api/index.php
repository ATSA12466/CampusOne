<?php
// Simple API router that serves JSON fixtures or forwards to specific handlers.
// Place at: api/index.php
header('Content-Type: application/json');
$scriptName = $_SERVER['SCRIPT_NAME'];
$uri = $_SERVER['REQUEST_URI'];
// Normalize path and remove query string
$path = parse_url($uri, PHP_URL_PATH);
// If the API is served under /api, allow either /api or /api/index.php
$prefix = rtrim(dirname($scriptName), '/\\');
if ($prefix && strpos($path, $prefix) === 0) {
    $path = substr($path, strlen($prefix));
}
$path = preg_replace('#^/api#', '', $path);
$path = trim($path, '/');
if ($path === '') {
    echo json_encode(['message' => 'CampusOne PHP API', 'routes' => ['health','invitations','clubs','events','announcements','home/featured','life/marketplace','productivity/timetable','community/conversations']]);
    exit;
}

// Special-case health
if ($path === 'health') {
    // Basic health: DB and storage checks could go here. For now return static healthy status.
    echo json_encode(['status' => 'ok', 'time' => date(DATE_ATOM)]);
    exit;
}

// Delegate to invitations.php if requested
if (strpos($path, 'invitations') === 0) {
    // Forward to api/invitations.php
    require __DIR__ . '/invitations.php';
    exit;
}

// Map the path to a JSON fixture file under api/data/
$fixturePath = __DIR__ . '/data/' . $path . '.json';
if (file_exists($fixturePath)) {
    // Serve the JSON file
    http_response_code(200);
    readfile($fixturePath);
    exit;
}

// Not found
http_response_code(404);
echo json_encode(['error' => 'Not found', 'path' => $path]);
