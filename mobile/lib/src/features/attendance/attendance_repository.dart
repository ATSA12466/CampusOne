import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';
import '../badges/badges_repository.dart';

class AttendanceSession {
  AttendanceSession({
    required this.id,
    required this.eventId,
    required this.eventTitle,
    required this.clubId,
    required this.clubName,
    required this.status,
    required this.startsAt,
    required this.endsAt,
    required this.requireMembership,
    required this.maxCheckins,
  });

  final String id;
  final String eventId;
  final String eventTitle;
  final String clubId;
  final String clubName;
  final String status;
  final String startsAt;
  final String endsAt;
  final bool requireMembership;
  final int maxCheckins;

  factory AttendanceSession.fromJson(Map<String, dynamic> json) =>
      AttendanceSession(
        id: asString(json['id']),
        eventId: asString(json['eventId']),
        eventTitle: asString(json['eventTitle']),
        clubId: asString(json['clubId']),
        clubName: asString(json['clubName']),
        status: asString(json['status']),
        startsAt: asString(json['startsAt']),
        endsAt: asString(json['endsAt']),
        requireMembership: json['requireMembership'] == true,
        maxCheckins: asInt(json['maxCheckins']),
      );
}

class AttendanceRecord {
  AttendanceRecord({
    required this.id,
    required this.sessionId,
    required this.eventId,
    required this.eventTitle,
    required this.clubName,
    required this.status,
    required this.method,
    required this.checkedInAt,
    this.userName = '',
  });

  final String id;
  final String sessionId;
  final String eventId;
  final String eventTitle;
  final String clubName;
  final String status;
  final String method;
  final String checkedInAt;
  final String userName;

  /// Display name in exec lists (falls back to the event when absent).
  String get attendee => userName.isEmpty ? eventTitle : userName;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: asString(json['id']),
        sessionId: asString(json['sessionId']),
        eventId: asString(json['eventId']),
        eventTitle: asString(json['eventTitle'], 'Campus event'),
        clubName: asString(json['clubName']),
        status: asString(json['status']),
        method: asString(json['method']),
        checkedInAt: asString(json['checkedInAt']),
        userName: asString(json['userName']),
      );
}

class SessionCode {
  SessionCode({
    required this.code,
    required this.sessionId,
    required this.slotEndsAt,
  });

  final String code;
  final String sessionId;
  final String slotEndsAt;

  factory SessionCode.fromJson(Map<String, dynamic> json) => SessionCode(
    code: asString(json['code']),
    sessionId: asString(json['sessionId']),
    slotEndsAt: asString(json['slotEndsAt']),
  );
}

class CheckInResult {
  CheckInResult({
    required this.record,
    required this.duplicate,
    required this.badges,
  });

  final AttendanceRecord record;
  final bool duplicate;
  final List<BadgeAward> badges;
}

class AttendanceRepository {
  AttendanceRepository(this._api);

  final ApiClient _api;

  Future<List<AttendanceSession>> sessionsForEvent(String eventId) async {
    final json = await _api.get(
      ApiPaths.attendanceSessions,
      query: {'eventId': eventId},
    );
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(AttendanceSession.fromJson)
        .toList();
  }

  Future<AttendanceSession> createSession({
    required String eventId,
    required DateTime startsAt,
    required DateTime endsAt,
    String clubId = '',
    String clubName = '',
    bool requireMembership = false,
    int maxCheckins = 0,
  }) async {
    final json = await _api.post(
      ApiPaths.attendanceSessions,
      body: {
        'eventId': eventId,
        'startsAt': startsAt.toUtc().toIso8601String(),
        'endsAt': endsAt.toUtc().toIso8601String(),
        if (clubId.isNotEmpty) 'clubId': clubId,
        if (clubName.isNotEmpty) 'clubName': clubName,
        'requireMembership': requireMembership,
        'maxCheckins': maxCheckins,
      },
    );
    return AttendanceSession.fromJson(asMap(asMap(json)['item']));
  }

  Future<AttendanceSession> setStatus(String id, String status) async {
    final json = await _api.patch(
      ApiPaths.attendanceSession(id),
      body: {'status': status},
    );
    return AttendanceSession.fromJson(asMap(asMap(json)['item']));
  }

  Future<SessionCode> liveCode(String id) async {
    final json = await _api.get(ApiPaths.sessionCode(id));
    return SessionCode.fromJson(asMap(json));
  }

  Future<CheckInResult> checkIn(String code) async {
    final json = await _api.post(ApiPaths.checkIn, body: {'code': code.trim()});
    final root = asMap(json);
    final rawBadges = root['badges'];
    return CheckInResult(
      record: AttendanceRecord.fromJson(asMap(root['record'])),
      duplicate: root['duplicate'] == true,
      badges: rawBadges is List
          ? rawBadges
                .whereType<Map<String, dynamic>>()
                .map(BadgeAward.fromJson)
                .toList()
          : const [],
    );
  }

  Future<List<AttendanceRecord>> myRecords() async {
    final json = await _api.get(ApiPaths.attendanceRecords);
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(AttendanceRecord.fromJson)
        .toList();
  }

  Future<List<AttendanceRecord>> sessionCheckins(String id) async {
    final json = await _api.get(ApiPaths.attendanceSession(id));
    final items = asMap(json)['checkins'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(AttendanceRecord.fromJson)
        .toList();
  }

  Future<AttendanceRecord> correctRecord(
    String id, {
    required String status,
    required String reason,
  }) async {
    final json = await _api.patch(
      ApiPaths.attendanceRecord(id),
      body: {'status': status, 'reason': reason},
    );
    return AttendanceRecord.fromJson(asMap(asMap(json)['item']));
  }
}
