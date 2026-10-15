<?php
class UsersController {
    public static function get($DB, $id) {
        $stmt = $DB->prepare('SELECT id, email, role, created_at FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();
        if (!$user) return json_response(['error' => 'USER_NOT_FOUND'], 404);
        return json_response(['data' => $user]);
    }
}
