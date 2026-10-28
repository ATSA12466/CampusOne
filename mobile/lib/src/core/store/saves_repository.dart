import '../api/api_client.dart';
import '../api/api_paths.dart';
import '../auth/auth_session.dart';

class SavedItem {
  SavedItem({required this.kind, required this.entityId, required this.savedAt});

  final String kind;
  final String entityId;
  final String savedAt;

  /// Listing saves use composite ids ("domain:id").
  String get domain => entityId.contains(':') ? entityId.split(':').first : '';
  String get ref => entityId.contains(':') ? entityId.split(':').last : entityId;

  factory SavedItem.fromJson(Map<String, dynamic> json) => SavedItem(
    kind: asString(json['kind']),
    entityId: asString(json['entityId']),
    savedAt: asString(json['createdAt']),
  );
}

class SavesRepository {
  SavesRepository(this._api);

  final ApiClient _api;

  Future<List<SavedItem>> list([String? kind]) async {
    final json = await _api.get(
      ApiPaths.saves,
      query: kind == null ? null : {'kind': kind},
    );
    return asList(
      asMap(json)['items'],
    ).map(SavedItem.fromJson).toList();
  }

  Future<bool> setSaved(String kind, String entityId, bool saved) async {
    final json = await _api.put(
      ApiPaths.saves,
      body: {'kind': kind, 'entityId': entityId, 'saved': saved},
    );
    return asMap(json)['saved'] == true;
  }

  Future<bool> isSaved(String kind, String entityId) async {
    final items = await list(kind);
    return items.any((item) => item.entityId == entityId);
  }

  static String listingRef(String domain, String id) => '$domain:$id';
}
