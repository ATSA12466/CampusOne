import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';

class StudentEmailVerificationScreen extends StatefulWidget {
  const StudentEmailVerificationScreen({super.key});

  @override
  State<StudentEmailVerificationScreen> createState() =>
      _StudentEmailVerificationScreenState();
}

class _StudentEmailVerificationScreenState
    extends State<StudentEmailVerificationScreen> {
  final _code = TextEditingController();
  bool _sent = false;
  bool _busy = false;
  String? _message;
  bool _error = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() { _busy = true; _message = null; _error = false; });
    try {
      await SessionScope.apiOf(context).post(
        '/api/v1/auth/student-verification/start',
      );
      if (mounted) setState(() { _sent = true; _message = 'A 6-digit code was sent to your GCTU email. It expires in 10 minutes.'; });
    } on ApiException catch (e) {
      if (mounted) setState(() { _message = e.message; _error = true; });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _verify() async {
    setState(() { _busy = true; _message = null; _error = false; });
    try {
      await SessionScope.apiOf(context).post(
        '/api/v1/auth/student-verification/verify',
        body: {'code': _code.text.trim()},
      );
      await SessionScope.sessionOf(context).refreshUser();
      if (mounted) {
        setState(() => _message = 'Your GCTU student email is verified. Academic features are now available.');
      }
    } on ApiException catch (e) {
      if (mounted) setState(() { _message = e.message; _error = true; });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final user = session.user;
    final verified = user?.verifiedStudent == true;
    return Scaffold(
      appBar: AppBar(title: const Text('Student verification')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Icon(verified ? Icons.verified_user_rounded : Icons.school_rounded,
              size: 58, color: Theme.of(context).colorScheme.primary),
          const SizedBox(height: 18),
          Text(verified ? 'GCTU email verified' : 'Verify your GCTU email',
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(verified
              ? 'Academic features are unlocked for this account.'
              : 'Academic features are available to students with a verified university account. Your account email must end in @live.gctu.edu.gh.'),
          const SizedBox(height: 12),
          Card(child: ListTile(leading: const Icon(Icons.email_outlined), title: Text(user?.email ?? 'No signed-in account'), subtitle: const Text('Verification code is sent to this address'))),
          if (!verified) ...[
            const SizedBox(height: 20),
            if (_sent) TextField(
              controller: _code,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(labelText: '6-digit code', prefixIcon: Icon(Icons.pin_outlined)),
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _busy ? null : _sent ? _verify : _send,
              icon: _busy ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)) : Icon(_sent ? Icons.verified_outlined : Icons.mark_email_read_outlined),
              label: Text(_busy ? 'Please wait…' : _sent ? 'Verify email' : 'Send verification code'),
            ),
            if (_sent) TextButton(onPressed: _busy ? null : _send, child: const Text('Send a new code')),
          ],
          if (_message != null) ...[
            const SizedBox(height: 12),
            Text(_message!, style: TextStyle(color: _error ? Theme.of(context).colorScheme.error : Theme.of(context).colorScheme.primary)),
          ],
        ],
      ),
    );
  }
}
