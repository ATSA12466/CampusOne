import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';

/// Points the app at a backend. Debug builds default to the dev tunnel;
/// release builds default to the production URL baked in at build time.
class ServerSettingsScreen extends StatefulWidget {
  const ServerSettingsScreen({super.key});

  @override
  State<ServerSettingsScreen> createState() => _ServerSettingsScreenState();
}

class _ServerSettingsScreenState extends State<ServerSettingsScreen> {
  final _controller = TextEditingController();
  bool _busy = false;
  String? _health;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _controller.text = SessionScope.apiOf(context).baseUrl;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await SessionScope.sessionOf(
        context,
      ).setBaseUrl(_controller.text.trim());
      if (mounted) showAppMessage(context, 'Server saved. Signed out.');
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _ping() async {
    setState(() {
      _busy = true;
      _health = null;
    });
    try {
      final probe = ApiClient(baseUrl: _controller.text.trim());
      try {
        await probe.get('/api/health');
      } finally {
        probe.close();
      }
      if (mounted) setState(() => _health = 'Reachable');
    } on ApiException catch (error) {
      if (mounted) setState(() => _health = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Server')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Use this to point the app at staging or production. Changing the server signs you out.',
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Backend URL',
              hintText: 'https://campusone.example.com',
            ),
          ),
          if (_health != null) ...[
            const SizedBox(height: 8),
            StatusChip(
              label: _health!,
              tone: _health == 'Reachable'
                  ? ChipTone.success
                  : ChipTone.warning,
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _busy ? null : _ping,
                  child: const Text('Test'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: _busy ? null : _save,
                  child: const Text('Save'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
