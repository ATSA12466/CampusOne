import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/api_paths.dart';

/// Push-notification wiring. Fully guarded: without a Firebase project
/// (google-services.json / GoogleService-Info.plist) every step fails soft and
/// the app keeps working with the server notification feed instead.
class PushService {
  PushService._();

  static bool _ready = false;
  static bool get ready => _ready;

  static Future<void> init(ApiClient api) async {
    try {
      await Firebase.initializeApp();
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission();
      final token = await messaging.getToken();
      if (token != null && token.isNotEmpty) {
        _ready = true;
        await _upload(api, token);
        FirebaseMessaging.instance.onTokenRefresh.listen(
          (refreshed) => _upload(api, refreshed),
          onError: (_) {},
        );
      }
    } catch (error) {
      // No Firebase project configured (or no network): push stays disabled.
      debugPrint('Push disabled: $error');
      _ready = false;
    }
  }

  static Future<void> refreshToken(ApiClient api) async {
    if (!_ready) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) await _upload(api, token);
    } catch (_) {
      // Best-effort; the feed remains the source of truth.
    }
  }

  static Future<void> _upload(ApiClient api, String token) async {
    try {
      await api.post(ApiPaths.devices, body: {
        'platform': Platform.isIOS ? 'ios' : 'android',
        'token': token,
        'appVersion': '0.1.0',
      });
    } on ApiException catch (error) {
      // Signed out (or offline): skip silently, retry after next sign-in.
      debugPrint('Device upload skipped: ${error.message}');
    } catch (_) {
      // Never let push bookkeeping break the app.
    }
  }
}
