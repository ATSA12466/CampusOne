import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';

/// Password-reset request. No mail delivery is configured yet: the server
/// records the request and returns accepted — the app never claims an
/// email was sent.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _busy = false;
  bool _accepted = false;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await SessionScope.apiOf(context).post(
        ApiPaths.passwordReset,
        body: {'email': _email.text.trim()},
      );
      if (mounted) setState(() => _accepted = true);
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_accepted) ...[
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Request accepted.',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Your request was recorded. Email delivery is not configured yet, so no reset email was sent — contact your campus administrator if you cannot sign in.',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            TextFormField(
              controller: _email,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
              validator: (value) =>
                  (value ?? '').trim().contains('@') &&
                      (value ?? '').trim().length <= 254
                  ? null
                  : 'Enter a valid email address.',
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: const Text('Request reset link'),
            ),
          ],
        ),
      ),
    );
  }
}
