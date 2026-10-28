import 'package:flutter/material.dart';

/// CampusOne palette shared with the web platform.
class CampusColors {
  // GCTU identity: deep blue with warm gold from the supplied SRC crest.
  static const primary = Color(0xFF25206A);
  static const primaryDark = Color(0xFF11112E);
  static const primaryLight = Color(0xFFAAA4E8);
  static const accent = Color(0xFFF4B52A);
  static const success = Color(0xFF1E7E46);
  static const warning = Color(0xFFB7791F);
  static const danger = Color(0xFFB3261E);
}

/// Shared corner radii for the older feature screens.
class CampusRadii {
  static const double media = 24;
  static const double card = 20;
  static const double control = 12;
  static const double pill = 999;
}

ThemeData buildLightTheme({Color? seedColor, Color? accentColor}) {
  final primary = seedColor ?? CampusColors.primary;
  final accent = accentColor ?? CampusColors.accent;
  final scheme = ColorScheme.fromSeed(
    seedColor: primary,
    primary: primary,
    secondary: accent,
    onSecondary: CampusColors.primaryDark,
  ).copyWith(
    surface: const Color(0xFFF6F8FC),
    onSurface: CampusColors.primaryDark,
    onSurfaceVariant: const Color(0xFF52617A),
    outline: const Color(0xFF8A96A8),
    outlineVariant: const Color(0xFFD5DDEA),
    surfaceContainerLowest: Colors.white,
    surfaceContainerLow: const Color(0xFFF0F3F9),
    surfaceContainer: const Color(0xFFE9EEF7),
    surfaceContainerHigh: const Color(0xFFE1E8F3),
    surfaceContainerHighest: const Color(0xFFD8E1EF),
  );
  return _theme(scheme);
}

ThemeData buildDarkTheme({Color? seedColor, Color? accentColor}) {
  final primary = seedColor ?? CampusColors.primary;
  final accent = accentColor ?? CampusColors.accent;
  final scheme = ColorScheme.fromSeed(
    seedColor: primary,
    brightness: Brightness.dark,
    primary: primary,
    secondary: accent,
    onSecondary: CampusColors.primaryDark,
  ).copyWith(
    surface: const Color(0xFF08090D),
    onSurface: const Color(0xFFF4F7FD),
    onSurfaceVariant: const Color(0xFFC2CBE0),
    outline: const Color(0xFF71809A),
    outlineVariant: const Color(0xFF3A4961),
    surfaceContainerLowest: const Color(0xFF08090D),
    surfaceContainerLow: const Color(0xFF101116),
    surfaceContainer: const Color(0xFF15171E),
    surfaceContainerHigh: const Color(0xFF1B1E27),
    surfaceContainerHighest: const Color(0xFF252935),
  );
  return _theme(scheme);
}

ThemeData _theme(ColorScheme scheme) {
  final light = scheme.brightness == Brightness.light;
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: light ? const Color(0xFFF6F8FC) : const Color(0xFF08090D),
    appBarTheme: AppBarTheme(
      backgroundColor: light ? const Color(0xFFF6F8FC) : const Color(0xFF08090D),
      foregroundColor: scheme.onSurface,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: scheme.onSurface,
        fontSize: 21,
        fontWeight: FontWeight.w800,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: light ? Colors.white : scheme.surfaceContainerLow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: BorderSide(color: scheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: light ? Colors.white : scheme.surfaceContainerHigh,
      surfaceTintColor: Colors.transparent,
      elevation: 12,
      insetPadding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(26)),
      titleTextStyle: TextStyle(
        color: scheme.onSurface,
        fontSize: 21,
        fontWeight: FontWeight.w800,
        height: 1.2,
      ),
      contentTextStyle: TextStyle(
        color: scheme.onSurfaceVariant,
        fontSize: 14,
        height: 1.45,
      ),
      actionsPadding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: light ? Colors.white : scheme.surfaceContainerHigh,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(26)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size(0, 48),
        shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(minimumSize: const Size(0, 48)),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: light ? const Color(0xFFF7F8FC) : scheme.surfaceContainer,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: scheme.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: scheme.primary, width: 1.7),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: scheme.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(18),
        borderSide: BorderSide(color: scheme.error, width: 1.7),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
    ),
    navigationBarTheme: NavigationBarThemeData(
      height: 68,
      backgroundColor: light ? Colors.white : scheme.surfaceContainer,
      indicatorColor: scheme.secondary.withValues(alpha: .16),
      labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
        fontSize: 12,
        fontWeight: states.contains(WidgetState.selected)
            ? FontWeight.w700
            : FontWeight.w500,
        color: states.contains(WidgetState.selected)
            ? scheme.secondary
            : scheme.onSurfaceVariant,
      )),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected) ? scheme.primary : null),
      checkColor: WidgetStatePropertyAll(scheme.onPrimary),
      side: BorderSide(color: scheme.outline),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected) ? scheme.onPrimary : null),
      trackColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? scheme.primary
              : scheme.surfaceContainerHighest),
    ),
    dividerTheme: DividerThemeData(color: scheme.outlineVariant),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
