import 'package:flutter/material.dart';

/// GCTU royal/navy/gold palette shared with the web platform.
class CampusColors {
  static const primary = Color(0xFF003399);
  static const primaryDark = Color(0xFF0B2545);
  static const accent = Color(0xFFFFCC00);
  static const success = Color(0xFF1E7E46);
  static const warning = Color(0xFFB7791F);
  static const danger = Color(0xFFB3261E);

  /// Dark-theme brand tint (web `--brand: #8fb0ff` in dark mode).
  static const primaryDarkMode = Color(0xFF8FB0FF);
}

/// Radii copied from the web design tokens so both clients round things the
/// same way: controls 14, cards 20, media 24, pills fully round.
class CampusRadii {
  static const control = 14.0;
  static const card = 20.0;
  static const media = 24.0;
  static const pill = 999.0;
}

ThemeData buildLightTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: CampusColors.primary,
    primary: CampusColors.primary,
    secondary: CampusColors.accent,
  );
  return _theme(scheme);
}

ThemeData buildDarkTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: CampusColors.primary,
    brightness: Brightness.dark,
    primary: CampusColors.primaryDarkMode,
    secondary: CampusColors.accent,
  );
  return _theme(scheme);
}

ThemeData _theme(ColorScheme scheme) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surface,
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.surface,
      foregroundColor: scheme.onSurface,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CampusRadii.card),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CampusRadii.control),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(CampusRadii.control),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(minimumSize: const Size(0, 48)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(CampusRadii.control),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 68,
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(fontSize: 12, color: scheme.onSurfaceVariant),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CampusRadii.control),
      ),
    ),
    dialogTheme: DialogThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(CampusRadii.card),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(CampusRadii.card),
        ),
      ),
    ),
  );
}
