import 'package:flutter/material.dart';

import 'src/app/app_shell.dart';
import 'src/core/api/api_client.dart';
import 'src/core/auth/auth_session.dart';
import 'src/core/push/push_service.dart';
import 'src/core/theme/app_theme.dart';

/// Default backend. Overridden at build time with:
///   flutter build ... --dart-define=CAMPUSONE_API_URL=https://host
/// A saved in-app Server setting always wins over this default.
const _defaultApiUrl = String.fromEnvironment(
  'CAMPUSONE_API_URL',
  defaultValue: 'http://10.0.2.2:3000',
);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saved = await AuthSession.savedBaseUrl();
  final api = ApiClient(baseUrl: saved ?? _defaultApiUrl);
  final session = AuthSession(api: api);
  await session.restore();
  await PushService.init(api);
  runApp(CampusOneApp(api: api, session: session));
}

class CampusOneApp extends StatelessWidget {
  const CampusOneApp({super.key, required this.api, required this.session});

  final ApiClient api;
  final AuthSession session;

  @override
  Widget build(BuildContext context) {
    return SessionScope(
      session: session,
      api: api,
      child: MaterialApp(
        title: 'CampusOne',
        theme: buildLightTheme(),
        darkTheme: buildDarkTheme(),
        home: const AppShell(),
      ),
    );
  }
}
