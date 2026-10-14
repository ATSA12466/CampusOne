import '../api/api_client.dart';
import '../api/api_paths.dart';
import '../auth/auth_session.dart';

/// Global search: fans out over the catalog collections like the web
/// search service, then ranks title matches first.
class SearchHit {
  SearchHit({
    required this.collection,
    required this.id,
    required this.title,
    required this.subtitle,
  });

  final String collection;
  final String id;
  final String title;
  final String subtitle;
}

class SearchRepository {
  SearchRepository(this._api);

  final ApiClient _api;

  static const scopes = [
    'clubs',
    'events',
    'announcements',
    'accommodation',
    'marketplace',
    'opportunities',
    'lostFound',
    'resources',
    'media',
    'campaigns',
  ];

  Future<List<SearchHit>> search(String query, {String scope = 'all'}) async {
    final needle = query.trim();
    if (needle.length < 2) return [];
    final collections = scope == 'all'
        ? scopes
        : scopes.where((c) => c == scope).toList();
    final futures = collections.map((collection) async {
      try {
        final json = await _api.get(
          ApiPaths.catalog(collection),
          query: {'search': needle, 'pageSize': '6'},
        );
        return asList(asMap(json)['items'])
            .map((item) => _hit(collection, item))
            .toList();
      } catch (_) {
        return <SearchHit>[];
      }
    });
    final groups = await Future.wait(futures);
    final hits = groups.expand((g) => g).toList();
    final lower = needle.toLowerCase();
    hits.sort((a, b) {
      final aTitle = a.title.toLowerCase().contains(lower) ? 0 : 1;
      final bTitle = b.title.toLowerCase().contains(lower) ? 0 : 1;
      if (aTitle != bTitle) return aTitle - bTitle;
      return a.title.compareTo(b.title);
    });
    return hits.take(60).toList();
  }

  SearchHit _hit(String collection, Map<String, dynamic> item) {
    final title = asString(item['title'], asString(item['name'], 'Untitled'));
    final subtitle = switch (collection) {
      'clubs' => asString(item['category']),
      'events' => '${asString(item['date'])} · ${asString(item['venue'])}',
      'accommodation' => '${asString(item['location'])} · ${asString(item['price'])}',
      'marketplace' => asString(item['priceLabel'], asString(item['category'])),
      'opportunities' => asString(item['category']),
      'lostFound' => '${asString(item['type'])} · ${asString(item['location'])}',
      'resources' => asString(item['course']),
      'media' => asString(item['kind']),
      _ => '',
    };
    return SearchHit(
      collection: collection,
      id: asString(item['id']),
      title: title,
      subtitle: subtitle,
    );
  }
}
