import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'src/app/app_shell.dart';
import 'src/app/deep_links.dart';
import 'src/app/server_gate.dart';
import 'src/core/api/api_client.dart';
import 'src/core/auth/auth_session.dart';
import 'src/core/push/push_service.dart';
import 'src/core/theme/app_theme.dart';
import 'src/core/theme/theme_prefs.dart';
import 'src/features/onboarding/welcome_screen.dart';
import 'src/features/onboarding/welcome_prefs.dart';

/// Default backend. Overridden at build time with:
///   flutter build ... --dart-define=CAMPUSONE_API_URL=https://host
/// A saved in-app Server setting always wins over this default.
/// Debug builds fall back to the Android emulator loopback; release builds
/// have no usable fallback and open the server gate instead.
const _defaultApiUrl = String.fromEnvironment(
  'CAMPUSONE_API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final theme = await ThemePrefs.load();
  runApp(_Bootstrap(theme: theme));
}

class _Bootstrap extends StatefulWidget {
  const _Bootstrap({required this.theme});

  final ThemePrefs theme;

  @override
  State<_Bootstrap> createState() => _BootstrapState();
}

class _BootstrapState extends State<_Bootstrap> {
  ApiClient? _api;
  AuthSession? _session;
  bool? _seenWelcome;
  String? _gateError;
  bool _starting = true;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    setState(() {
      _starting = true;
      _gateError = null;
    });
    try {
      final saved = await AuthSession.savedBaseUrl();
      final api = ApiClient(baseUrl: saved ?? _defaultApiUrl);
      if (kReleaseMode) {
        // setBaseUrl applies the release https:// policy; the constructor
        // does not, so re-validate here before any network use.
        api.setBaseUrl(api.baseUrl);
      }
      final session = AuthSession(api: api);
      await session.restore();
      await PushService.init(api);
      final seenWelcome = await WelcomePrefs.seen();
      if (!mounted) return;
      setState(() {
        _api = api;
        _session = session;
        _seenWelcome = seenWelcome;
        _starting = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _gateError = error.message;
        _starting = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _gateError = kReleaseMode
            ? 'Release builds require an https:// server URL.'
            : 'Enter a valid http(s) server URL.';
        _starting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = _api;
    final session = _session;
    final seenWelcome = _seenWelcome;
    if (_starting || api == null || session == null || seenWelcome == null) {
      final gateError = _gateError;
      if (_starting && gateError == null) {
        return MaterialApp(
          home: const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          ),
        );
      }
      return ServerGateApp(
        prefs: widget.theme,
        error: gateError,
        onSaved: _start,
      );
    }
    return CampusOneApp(
      api: api,
      session: session,
      theme: widget.theme,
      seenWelcome: seenWelcome,
    );
  }
}

class CampusOneApp extends StatelessWidget {
  const CampusOneApp({
    super.key,
    required this.api,
    required this.session,
    required this.theme,
    required this.seenWelcome,
  });

  final ApiClient api;
  final AuthSession session;
  final ThemePrefs theme;
  final bool seenWelcome;

  @override
  Widget build(BuildContext context) {
    return ThemeScope(
      prefs: theme,
      child: SessionScope(
        session: session,
        api: api,
        child: Builder(
          builder: (context) => MaterialApp(
            title: 'CampusOne',
            theme: buildLightTheme(),
            darkTheme: buildDarkTheme(),
            themeMode: ThemeScope.of(context).mode,
            home: DeepLinkHandler(
              child: seenWelcome ? const AppShell() : const WelcomeScreen(),
            ),
          ),
        ),
      ),
    );
  }
}
