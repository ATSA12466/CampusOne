import 'package:shared_preferences/shared_preferences.dart';

class WelcomePrefs {
  WelcomePrefs._();

  static const _key = 'campusone.welcome_seen';

  static Future<bool> seen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool(_key) ?? false;
    } catch (_) {
      return false;
    }
  }

  static Future<void> markSeen() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, true);
    } catch (_) {
      // Showing the welcome again is harmless.
    }
  }

  static Future<void> reset() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_key, false);
    } catch (_) {
      // Best effort.
    }
  }
}
