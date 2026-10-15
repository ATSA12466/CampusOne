<?php
class ClubsController {
    public static function list($DB) {
        $stmt = $DB->query('SELECT id, name, category, description, cover FROM clubs ORDER BY name');
        $rows = $stmt->fetchAll();
        return json_response(['data' => $rows]);
    }

    public static function get($DB, $id) {
        $stmt = $DB->prepare('SELECT id, name, category, description, cover, objectives FROM clubs WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $club = $stmt->fetch();
        if (!$club) return json_response(['error' => 'CLUB_NOT_FOUND'], 404);
        // objectives stored as text[] or json
        if (isset($club['objectives']) && is_string($club['objectives'])) {
            $club['objectives'] = json_decode($club['objectives'], true) ?: [];
        }
        return json_response(['data' => $club]);
    }

    public static function join($DB, $id) {
        $data = get_json_input();
        $userId = $data['user_id'] ?? null;
        if (!$userId) return json_response(['error' => 'MISSING_USER_ID'], 400);
        // Check existing
        $stmt = $DB->prepare('SELECT id FROM club_memberships WHERE club_id = :club AND user_id = :user LIMIT 1');
        $stmt->execute([':club' => $id, ':user' => $userId]);
        if ($stmt->fetch()) return json_response(['message' => 'ALREADY_MEMBER']);
        $stmt = $DB->prepare('INSERT INTO club_memberships (club_id, user_id, status, created_at) VALUES (:club, :user, :status, NOW()) RETURNING id, club_id, user_id, status');
        $stmt->execute([':club' => $id, ':user' => $userId, ':status' => 'pending']);
        $row = $stmt->fetch();
        return json_response(['data' => $row], 201);
    }
}
