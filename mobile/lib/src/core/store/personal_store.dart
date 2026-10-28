import 'dart:math';

import '../api/api_client.dart';
import '../api/api_paths.dart';
import '../auth/auth_session.dart';

/// Typed access to the account-synced personal store (`/api/me/store`).
/// Same collections and shapes as the web workspace, so items stay
/// consistent if the web app migrates to this API.
class PersonalStoreRepository {
  PersonalStoreRepository(this._api);

  final ApiClient _api;

  Future<List<Map<String, dynamic>>> list(String collection) async {
    final json = await _api.get(
      ApiPaths.meStore,
      query: {'collection': collection},
    );
    return asList(asMap(json)['items']);
  }

  Future<Map<String, List<Map<String, dynamic>>>> listGrouped(
    List<String> collections,
  ) async {
    final json = await _api.get(
      ApiPaths.meStore,
      query: {'collection': collections.join(',')},
    );
    final root = asMap(asMap(json)['items']);
    return root.map((key, value) => MapEntry(key, asList(value)));
  }

  Future<Map<String, dynamic>> put(
    String collection,
    Map<String, dynamic> item,
  ) async {
    final json = await _api.put(
      ApiPaths.meStore,
      body: {'collection': collection, 'item': item},
    );
    return asMap(asMap(json)['item']);
  }

  Future<bool> remove(String collection, String id) async {
    final json = await _api.delete(
      ApiPaths.meStore,
      query: {'collection': collection, 'id': id},
    );
    return asMap(json)['removed'] == true;
  }
}

/// Client-generated record ids (match the server's recordId rules).
String newRecordId([String prefix = 'c1']) {
  final random = Random.secure();
  final suffix = List.generate(
    8,
    (_) => random.nextInt(36).toRadixString(36),
  ).join();
  return '$prefix-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}$suffix';
}
