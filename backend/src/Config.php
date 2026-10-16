<?php

define('APP_ROOT', dirname(__DIR__));

function loadEnv(string $path): array
{
    $vars = [];
    if (!is_file($path)) {
        return $vars;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#')) {
            continue;
        }

        [$key, $value] = array_pad(explode('=', $trimmed, 2), 2, '');
        $vars[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
    }

    return $vars;
}

$env = loadEnv(APP_ROOT . '/.env');
if (!$env) {
    $env = loadEnv(APP_ROOT . '/.env.example');
}

function env(string $key, $default = null)
{
    global $env;
    return $env[$key] ?? getenv($key) ?? $default;
}
