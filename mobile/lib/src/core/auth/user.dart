/// Signed-in user as returned by the shared backend.
class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.roles,
    required this.permissions,
    required this.programme,
    required this.level,
    required this.verifiedStudent,
    this.avatar,
  });

  final String id;
  final String email;
  final String name;
  final String role;
  final List<String> roles;
  final List<String> permissions;
  final String programme;
  final String level;
  final bool verifiedStudent;
  final String? avatar;

  static List<String> _strings(dynamic value) =>
      value is List ? value.whereType<String>().toList() : <String>[];

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['id'] as String? ?? '',
    email: json['email'] as String? ?? '',
    name: json['name'] as String? ?? '',
    role: json['role'] as String? ?? 'student',
    roles: _strings(json['roles']),
    permissions: _strings(json['permissions']),
    programme: json['programme'] as String? ?? '',
    level: json['level'] as String? ?? '',
    verifiedStudent: json['verifiedStudent'] == true,
    avatar: json['avatar'] as String?,
  );

  bool get isExecutive =>
      roles.contains('club-president') ||
      roles.contains('club-executive') ||
      permissions.contains('club.members.manage');

  bool get isAdminRole =>
      role == 'super-admin' ||
      role == 'src-admin' ||
      roles.contains('super-admin') ||
      roles.contains('src-admin') ||
      permissions.contains('platform.users.manage');

  String roleLabel() {
    const labels = {
      'student': 'Student',
      'club-president': 'Club president',
      'club-executive': 'Club executive',
      'src-admin': 'SRC admin',
      'super-admin': 'Super admin',
    };
    return labels[role] ?? role;
  }

  String get initials {
    final parts = name
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first)
        .toUpperCase();
  }
}
