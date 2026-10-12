import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/api_client.dart';
import '../api/api_paths.dart';
import 'user.dart';

/// Owns the Bearer token (secure storage) and the signed-in user.
/// UI reads it through [SessionScope]; screens never touch tokens directly.
class AuthSession extends ChangeNotifier {
  AuthSession({required ApiClient api, FlutterSecureStorage? storage})
    : _api = api,
      _storage = storage ?? const FlutterSecureStorage();

  final ApiClient _api;
  final FlutterSecureStorage _storage;

  static const _tokenKey = 'campusone.session_token';
  static const _baseUrlKey = 'campusone.base_url';

  AppUser? _user;
  bool _ready = false;

  AppUser? get user => _user;
  bool get signedIn => _user != null;
  bool get ready => _ready;

  Future<void> restore() async {
    try {
      final token = await _storage.read(key: _tokenKey);
      if (token == null || token.isEmpty) {
        _ready = true;
        notifyListeners();
        return;
      }
      _api.setToken(token);
      final json = await _api.get(ApiPaths.authToken);
      final user = json is Map<String, dynamic> ? json['user'] : null;
      if (user is Map<String, dynamic>) {
        _user = AppUser.fromJson(user);
      } else {
        await _clearToken();
      }
    } on ApiException {
      await _clearToken();
    } catch (_) {
      // Offline on launch: stay signed out rather than crash; the user can
      // retry from the sign-in screen once connectivity returns.
      await _clearToken();
    }
    _ready = true;
    notifyListeners();
  }

  Future<void> signIn({
    required String email,
    required String password,
    String deviceName = '',
  }) async {
    final json = await _api.post(
      ApiPaths.authToken,
      body: {'email': email, 'password': password, 'deviceName': deviceName},
    ) as Map<String, dynamic>;
    final token = json['token'] as String;
    await _storage.write(key: _tokenKey, value: token);
    _api.setToken(token);
    _user = AppUser.fromJson(json['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String password,
    String programme = '',
    String level = '',
  }) async {
    await _api.post(
      ApiPaths.register,
      body: {
        'name': name,
        'email': email,
        'password': password,
        'programme': programme,
        'level': level,
      },
    );
    await signIn(email: email, password: password);
  }

  Future<void> refreshUser() async {
    final json = await _api.get(ApiPaths.me) as Map<String, dynamic>;
    _user = AppUser.fromJson(json['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  Future<void> updateProfile({String? name, String? programme, String? level}) async {
    final json = await _api.patch(ApiPaths.me, body: {
      if (name != null) 'name': name,
      if (programme != null) 'programme': programme,
      if (level != null) 'level': level,
    }) as Map<String, dynamic>;
    _user = AppUser.fromJson(json['user'] as Map<String, dynamic>);
    notifyListeners();
  }

  /// Switches backend, signs out locally, and remembers the choice.
  /// The server issues tokens per backend, so the old token is discarded
  /// without a revocation round-trip.
  Future<void> setBaseUrl(String value) async {
    _api.setBaseUrl(value);
    await saveBaseUrl(_api.baseUrl);
    await _clearToken();
    _user = null;
    notifyListeners();
  }

  Future<void> signOut() async {
    try {
      await _api.delete(ApiPaths.authToken);
    } on ApiException {
      // Revocation is best-effort; local state still clears below.
    } finally {
      await _clearToken();
      _user = null;
      notifyListeners();
    }
  }

  Future<void> _clearToken() async {
    _api.setToken(null);
    try {
      await _storage.delete(key: _tokenKey);
    } catch (_) {
      // Storage failures must not block sign-out.
    }
  }

  /// Remembers a custom API base URL (LAN development). Production builds
  /// ship with the default compiled in and rarely need this.
  static Future<void> saveBaseUrl(String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_baseUrlKey, value);
  }

  static Future<String?> savedBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_baseUrlKey);
  }

  /// Signed-out guard helper for screens: throws nothing, callers check.
  void requireAuth() {
    if (!signedIn) throw ApiException('Please sign in to continue.', status: 401);
  }

  @override
  String toString() => 'AuthSession(${_user?.email ?? 'signed out'})';
}

/// Makes the [AuthSession] (and API client) available to the widget tree.
class SessionScope extends InheritedNotifier<AuthSession> {
  const SessionScope({
    super.key,
    required AuthSession session,
    required this.api,
    required super.child,
  }) : super(notifier: session);

  final ApiClient api;

  static AuthSession sessionOf(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<SessionScope>();
    assert(scope != null, 'SessionScope missing above this widget.');
    return scope!.notifier!;
  }

  static ApiClient apiOf(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<SessionScope>();
    assert(scope != null, 'SessionScope missing above this widget.');
    return scope!.api;
  }
}

/// Small JSON helpers shared by repositories.
Map<String, dynamic> asMap(dynamic json) =>
    json is Map<String, dynamic> ? json : <String, dynamic>{};

String asString(dynamic value, [String fallback = '']) =>
    value is String ? value : fallback;

int asInt(dynamic value, [int fallback = 0]) =>
    value is int ? value : fallback;

String prettyDate(String iso) {
  try {
    final date = DateTime.parse(iso).toLocal();
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final day = date.day.toString().padLeft(2, '0');
    return '$day ${months[date.month - 1]} ${date.year}';
  } catch (_) {
    return iso.length >= 10 ? iso.substring(0, 10) : iso;
  }
}

String prettyDateTime(String iso) {
  try {
    final date = DateTime.parse(iso).toLocal();
    final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
    final minute = date.minute.toString().padLeft(2, '0');
    final suffix = date.hour >= 12 ? 'pm' : 'am';
    return '${prettyDate(iso)} · $hour:$minute $suffix';
  } catch (_) {
    return iso;
  }
}

String jsonPreview(Object? value) {
  try {
    return const JsonEncoder.withIndent('  ').convert(value);
  } catch (_) {
    return '$value';
  }
}
