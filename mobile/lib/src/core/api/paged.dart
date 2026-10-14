/// Typed wrapper for `{ items, total, page, pageSize }` list responses.
class Paged<T> {
  Paged({
    required this.items,
    required this.total,
    this.page = 1,
    this.pageSize = 30,
  });

  final List<T> items;
  final int total;
  final int page;
  final int pageSize;

  static Paged<T> fromJson<T>(
    dynamic json,
    T Function(Map<String, dynamic>) map,
  ) {
    final root = json is Map<String, dynamic> ? json : <String, dynamic>{};
    final raw = root['items'];
    final items = raw is List
        ? raw.whereType<Map<String, dynamic>>().map(map).toList()
        : <T>[];
    return Paged<T>(
      items: items,
      total: root['total'] is int ? root['total'] as int : items.length,
      page: root['page'] is int ? root['page'] as int : 1,
      pageSize: root['pageSize'] is int ? root['pageSize'] as int : 30,
    );
  }
}
