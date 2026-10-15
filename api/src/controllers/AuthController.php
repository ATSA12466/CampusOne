<?php
class AuthController {
    public static function register($DB) {
        $data = get_json_input();
        $email = ($data['email'] ?? '');
        $password = ($data['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
            return json_response(['error' => 'INVALID_INPUT'], 400);
        }
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $DB->prepare('INSERT INTO users (email, password_hash, role, created_at) VALUES (:email, :hash, :role, NOW()) RETURNING id, email, role, created_at');
        $stmt->execute([':email' => $email, ':hash' => $hash, ':role' => 'student']);
        $user = $stmt->fetch();
        return json_response(['data' => $user], 201);
    }

    public static function login($DB) {
        $data = get_json_input();
        $email = ($data['email'] ?? '');
        $password = ($data['password'] ?? '');
        $stmt = $DB->prepare('SELECT id, email, password_hash, role FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($password, $user['password_hash'])) {
            return json_response(['error' => 'INVALID_CREDENTIALS'], 401);
        }
        $secret = getenv('JWT_SECRET') ?: 'dev_secret_change_me';
        $access = jwt_encode(['uid' => $user['id'], 'email' => $user['email'], 'role' => $user['role']], $secret, 900);
        $refresh = bin2hex(random_bytes(32));
        $stmt = $DB->prepare('INSERT INTO refresh_tokens (user_id, token, expires_at, created_at) VALUES (:uid, :token, NOW() + INTERVAL \':days days\', NOW())');
        // 30 days
        $stmt->execute([':uid' => $user['id'], ':token' => $refresh, ':days' => 30]);

        return json_response(['accessToken' => $access, 'refreshToken' => $refresh, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]]);
    }

    public static function me($DB) {
        $token = get_bearer_token();
        if (!$token) return json_response(['error' => 'AUTH_REQUIRED'], 401);
        $secret = getenv('JWT_SECRET') ?: 'dev_secret_change_me';
        $payload = jwt_decode($token, $secret);
        if (!$payload) return json_response(['error' => 'INVALID_TOKEN'], 401);
        $stmt = $DB->prepare('SELECT id, email, role, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $payload['uid']]);
        $user = $stmt->fetch();
        if (!$user) return json_response(['error' => 'USER_NOT_FOUND'], 404);
        return json_response(['data' => $user]);
    }

    public static function refresh($DB) {
        $data = get_json_input();
        $token = $data['refreshToken'] ?? null;
        if (!$token) return json_response(['error' => 'MISSING_REFRESH_TOKEN'], 400);
        $stmt = $DB->prepare('SELECT user_id FROM refresh_tokens WHERE token = :token AND expires_at > NOW() LIMIT 1');
        $stmt->execute([':token' => $token]);
        $row = $stmt->fetch();
        if (!$row) return json_response(['error' => 'INVALID_REFRESH_TOKEN'], 401);
        $stmt = $DB->prepare('SELECT id, email, role FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $row['user_id']]);
        $user = $stmt->fetch();
        if (!$user) return json_response(['error' => 'USER_NOT_FOUND'], 404);
        $secret = getenv('JWT_SECRET') ?: 'dev_secret_change_me';
        $access = jwt_encode(['uid' => $user['id'], 'email' => $user['email'], 'role' => $user['role']], $secret, 900);
        return json_response(['accessToken' => $access, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]]);
    }

    public static function logout($DB) {
        $data = get_json_input();
        $token = $data['refreshToken'] ?? null;
        if ($token) {
            $stmt = $DB->prepare('DELETE FROM refresh_tokens WHERE token = :token');
            $stmt->execute([':token' => $token]);
        }
        return json_response(['message' => 'logged_out']);
    }
}
