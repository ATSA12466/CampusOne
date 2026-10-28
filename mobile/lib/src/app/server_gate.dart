import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../core/api/api_client.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/theme_prefs.dart';
import '../core/widgets/states.dart';

/// First-run gate when no usable backend URL is configured (typically a
/// release build without `CAMPUSONE_API_URL`). Store builds never fall back
/// to an emulator address or LAN IP: the user must enter a real server, and
/// release builds only accept `https://` URLs.
class ServerGateScreen extends StatefulWidget {
  const ServerGateScreen({super.key, required this.onSaved, this.error});

  final VoidCallback onSaved;
  final String? error;

  @override
  State<ServerGateScreen> createState() => _ServerGateScreenState();
}

class _ServerGateScreenState extends State<ServerGateScreen> {
  final _controller = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy) return;
    setState(() => _busy = true);
    final probe = ApiClient(baseUrl: 'https://probe.invalid');
    try {
      probe.setBaseUrl(_controller.text.trim());
      final health = await probe.get('/api/health');
      if (health is! Map<String, dynamic> || health['ok'] != true) {
        throw ApiException('That address is not a CampusOne server.');
      }
      await AuthSession.saveBaseUrl(probe.baseUrl);
      if (mounted) widget.onSaved();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      probe.close();
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Connect to CampusOne')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Icon(Icons.dns_outlined, size: 56),
          const SizedBox(height: 16),
          Text(
            'Server setup required',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            widget.error ??
                'Enter your campus server address to continue.'
                    '${kReleaseMode ? ' Release builds require an https:// address.' : ''}',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Backend URL',
              hintText: 'https://campus.example.edu',
            ),
            onSubmitted: (_) => _save(),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _save,
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }
}

/// Root gate used before the full app exists (no API client yet).
class ServerGateApp extends StatelessWidget {
  const ServerGateApp({
    super.key,
    required this.prefs,
    required this.onSaved,
    this.error,
  });

  final ThemePrefs prefs;
  final VoidCallback onSaved;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return ThemeScope(
      prefs: prefs,
      child: Builder(
        builder: (context) => MaterialApp(
          title: 'CampusOne',
          theme: buildLightTheme(),
          darkTheme: buildDarkTheme(),
          themeMode: ThemeScope.of(context).mode,
          home: ServerGateScreen(onSaved: onSaved, error: error),
        ),
      ),
    );
  }
}
