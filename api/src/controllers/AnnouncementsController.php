<?php
class AnnouncementsController {
    public static function list($DB) {
        $stmt = $DB->query('SELECT id, title, content, category, published_at FROM announcements ORDER BY published_at DESC LIMIT 100');
        $rows = $stmt->fetchAll();
        return json_response(['data' => $rows]);
    }

    public static function create($DB) {
        $data = get_json_input();
        $title = $data['title'] ?? null;
        $content = $data['content'] ?? null;
        $category = $data['category'] ?? 'campus';
        if (!$title || !$content) return json_response(['error' => 'INVALID_INPUT'], 400);
        $stmt = $DB->prepare('INSERT INTO announcements (title, content, category, published_at, created_at) VALUES (:title, :content, :category, :published_at, NOW()) RETURNING id, title, content, category, published_at');
        $published = $data['published_at'] ?? date('Y-m-d');
        $stmt->execute([':title' => $title, ':content' => $content, ':category' => $category, ':published_at' => $published]);
        $row = $stmt->fetch();
        return json_response(['data' => $row], 201);
    }
}
