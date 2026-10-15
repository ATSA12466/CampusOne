import 'package:flutter/material.dart';

import 'theme_prefs.dart';

/// Small auth/onboarding counterpart to the web appearance trigger. Cycles
/// system → light → dark → system and persists the preference on this device.
class AppearanceButton extends StatelessWidget {
  const AppearanceButton({super.key});

  @override
  Widget build(BuildContext context) {
    final prefs = ThemeScope.of(context);
    final mode = prefs.mode;
    final label = switch (mode) {
      ThemeMode.system => 'System appearance',
      ThemeMode.light => 'Light appearance',
      ThemeMode.dark => 'Dark appearance',
    };
    final icon = switch (mode) {
      ThemeMode.system => Icons.brightness_6_outlined,
      ThemeMode.light => Icons.light_mode_outlined,
      ThemeMode.dark => Icons.dark_mode_outlined,
    };
    return IconButton(
      tooltip: label,
      onPressed: () => prefs.setMode(switch (mode) {
        ThemeMode.system => ThemeMode.light,
        ThemeMode.light => ThemeMode.dark,
        ThemeMode.dark => ThemeMode.system,
      }),
      icon: Icon(icon),
    );
  }
}
