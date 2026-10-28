import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';

class Membership {
  Membership({
    required this.id,
    required this.clubId,
    required this.userId,
    required this.status,
    required this.applicantName,
    required this.note,
    required this.requestedAt,
  });

  final String id;
  final String clubId;
  final String userId;
  final String status;
  final String applicantName;
  final String note;
  final String requestedAt;

  factory Membership.fromJson(Map<String, dynamic> json) => Membership(
    id: asString(json['id']),
    clubId: asString(json['clubId']),
    userId: asString(json['userId']),
    status: asString(json['status']),
    applicantName: asString(json['applicantName']),
    note: asString(json['note']),
    requestedAt: asString(json['requestedAt']),
  );
}

class MyClub {
  MyClub({
    required this.clubId,
    required this.clubName,
    required this.category,
    required this.status,
    required this.managed,
    required this.pendingRequests,
  });

  final String clubId;
  final String clubName;
  final String category;
  final String status;
  final bool managed;
  final int pendingRequests;

  factory MyClub.fromJson(Map<String, dynamic> json) => MyClub(
    clubId: asString(json['clubId']),
    clubName: asString(json['clubName'], 'Campus club'),
    category: asString(json['category']),
    status: asString(json['status']),
    managed: json['managed'] == true,
    pendingRequests: asInt(json['pendingRequests']),
  );
}

class ClubsRepository {
  ClubsRepository(this._api);

  final ApiClient _api;

  /// Clubs the signed-in user belongs to, with manage rights attached.
  Future<List<MyClub>> mine() async {
    final json = await _api.get(ApiPaths.myClubs);
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(MyClub.fromJson)
        .toList();
  }

  Future<Membership> requestMembership(String clubId, {String note = ''}) async {
    final json = await _api.post(
      ApiPaths.clubMembership(clubId),
      body: {'note': note},
    );
    return Membership.fromJson(asMap(asMap(json)['item']));
  }

  Future<void> leave(String clubId) =>
      _api.delete(ApiPaths.clubMembership(clubId));

  Future<Membership> review(String membershipId, String status) async {
    final json = await _api.patch(
      ApiPaths.membership(membershipId),
      body: {'status': status},
    );
    return Membership.fromJson(asMap(asMap(json)['item']));
  }

  Future<bool> saved(String clubId) async {
    final json = await _api.get(ApiPaths.clubSaved(clubId));
    return asMap(json)['saved'] == true;
  }

  Future<bool> setSaved(String clubId, bool value) async {
    final json = await _api.put(
      ApiPaths.clubSaved(clubId),
      body: {'saved': value},
    );
    return asMap(json)['saved'] == true;
  }

  Future<List<Membership>> members(String clubId) async {
    final json = await _api.get(ApiPaths.manage(clubId, 'members'));
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(Membership.fromJson)
        .toList();
  }
}
