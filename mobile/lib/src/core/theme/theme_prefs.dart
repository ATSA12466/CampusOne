import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Device-local appearance choice (mirrors the web theme switcher).
class ThemePrefs extends ChangeNotifier {
  ThemePrefs._(this._mode);

  static const _key = 'campusone.theme_mode';
  static ThemePrefs? _instance;

  ThemeMode _mode;
  ThemeMode get mode => _mode;

  static Future<ThemePrefs> load() async {
    if (_instance != null) return _instance!;
    var mode = ThemeMode.system;
    try {
      final prefs = await SharedPreferences.getInstance();
      mode = ThemeMode.values.firstWhere(
        (m) => m.name == prefs.getString(_key),
        orElse: () => ThemeMode.system,
      );
    } catch (_) {
      // Fall back to the system theme.
    }
    _instance = ThemePrefs._(mode);
    return _instance!;
  }

  Future<void> setMode(ThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_key, mode.name);
    } catch (_) {
      // The choice still applies for this session.
    }
  }
}

class ThemeScope extends InheritedNotifier<ThemePrefs> {
  const ThemeScope({super.key, required ThemePrefs prefs, required super.child})
    : super(notifier: prefs);

  static ThemePrefs of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<ThemeScope>();
    assert(scope != null, 'ThemeScope missing above this widget.');
    return scope!.notifier!;
  }
}
