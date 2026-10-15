import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import 'widgets/auth_story.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _programme = TextEditingController();
  final _level = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _programme.dispose();
    _level.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await SessionScope.sessionOf(context).register(
        name: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        programme: _programme.text.trim(),
        level: _level.text.trim(),
      );
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthStoryPanel(story: AuthStory.register),
                const SizedBox(height: 24),
                TextFormField(
                  controller: _name,
                  textCapitalization: TextCapitalization.words,
                  maxLength: 80,
                  decoration: const InputDecoration(
                    labelText: 'Full name',
                    counterText: '',
                  ),
                  validator: (value) => (value ?? '').trim().length >= 2
                      ? null
                      : 'Enter your full name.',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  maxLength: 254,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    counterText: '',
                  ),
                  validator: (value) =>
                      (value ?? '').trim().contains('@') &&
                          (value ?? '').trim().length <= 254
                      ? null
                      : 'Enter a valid email address.',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  obscureText: true,
                  maxLength: 128,
                  decoration: const InputDecoration(
                    labelText: 'Password (8+ characters)',
                    counterText: '',
                  ),
                  validator: (value) => (value ?? '').length >= 8
                      ? null
                      : 'Use at least 8 characters.',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _programme,
                  textCapitalization: TextCapitalization.words,
                  maxLength: 120,
                  decoration: const InputDecoration(
                    labelText: 'Programme (optional)',
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _level,
                  maxLength: 40,
                  decoration: const InputDecoration(
                    labelText: 'Level (optional, e.g. 200)',
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Create account'),
                ),
                const SizedBox(height: 20),
                const IndependenceNotice(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
