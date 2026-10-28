import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';

class ModerationReport {
  ModerationReport({
    required this.id,
    required this.targetType,
    required this.targetId,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String targetType;
  final String targetId;
  final String reason;
  final String status;
  final String createdAt;

  factory ModerationReport.fromJson(Map<String, dynamic> json) =>
      ModerationReport(
        id: asString(json['id']),
        targetType: asString(json['targetType'], 'content'),
        targetId: asString(json['targetId']),
        reason: asString(json['reason']),
        status: asString(json['status'], 'open'),
        createdAt: asString(json['createdAt']),
      );
}

class AdminUserRow {
  AdminUserRow({required this.name, required this.email, required this.role});

  final String name;
  final String email;
  final String role;

  factory AdminUserRow.fromJson(Map<String, dynamic> json) => AdminUserRow(
    name: asString(json['name']),
    email: asString(json['email']),
    role: asString(json['role']),
  );
}

class AdminRepository {
  AdminRepository(this._api);

  final ApiClient _api;

  Future<List<ModerationReport>> reports() async {
    // Reuses the web contract; role-gated server-side.
    final json = await _api.get('/api/admin/reports');
    final list = asList(json is Map<String, dynamic> ? json['items'] : json);
    return list.map(ModerationReport.fromJson).toList();
  }

  Future<List<AdminUserRow>> users() async {
    final json = await _api.get('/api/admin/users');
    final list = asList(json is Map<String, dynamic> ? json['items'] : json);
    return list.map(AdminUserRow.fromJson).toList();
  }
}
