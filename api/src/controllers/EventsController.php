<?php
class EventsController {
    public static function list($DB) {
        $stmt = $DB->query('SELECT id, title, venue, date, category, seats, registered FROM events ORDER BY date DESC');
        $rows = $stmt->fetchAll();
        return json_response(['data' => $rows]);
    }

    public static function get($DB, $id) {
        $stmt = $DB->prepare('SELECT id, title, venue, date, category, seats, registered, description FROM events WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $event = $stmt->fetch();
        if (!$event) return json_response(['error' => 'EVENT_NOT_FOUND'], 404);
        return json_response(['data' => $event]);
    }

    public static function register($DB, $id) {
        $data = get_json_input();
        $userId = $data['user_id'] ?? null;
        if (!$userId) return json_response(['error' => 'MISSING_USER_ID'], 400);
        $stmt = $DB->prepare('INSERT INTO event_registrations (event_id, user_id, created_at) VALUES (:event, :user, NOW()) RETURNING id, event_id, user_id');
        $stmt->execute([':event' => $id, ':user' => $userId]);
        // increment registered count
        $DB->prepare('UPDATE events SET registered = registered + 1 WHERE id = :id')->execute([':id' => $id]);
        $row = $stmt->fetch();
        return json_response(['data' => $row], 201);
    }
}
