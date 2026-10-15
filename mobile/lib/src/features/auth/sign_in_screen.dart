import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/push/push_service.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';
import 'widgets/auth_story.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _obscured = true;
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await SessionScope.sessionOf(
        context,
      ).signIn(email: _email.text.trim(), password: _password.text);
      // Upload this device for push now that a token exists.
      await PushService.refreshToken(SessionScope.apiOf(context));
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Retries a saved session after an offline/server-error launch. The token
  /// was kept (only a 401 clears it), so this can sign in with no typing.
  Future<void> _retrySession() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final session = SessionScope.sessionOf(context);
      await session.restore();
      if (session.signedIn) {
        await PushService.refreshToken(SessionScope.apiOf(context));
        if (mounted) Navigator.of(context).pop();
      } else if (mounted && session.restoreError != null) {
        showAppMessage(context, session.restoreError!, error: true);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final restoreError = SessionScope.sessionOf(context).restoreError;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // The web puts this photo story beside the form; on a phone
                    // it opens the screen, same picture and copy.
                    const AuthStoryPanel(story: AuthStory.signIn),
                    const SizedBox(height: 28),
                    const Center(
                      child: CampusBrandMark(size: BrandMarkSize.lg, center: true),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Welcome to CampusOne',
                      style: theme.textTheme.headlineSmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Clubs, events, attendance and campus life in one place.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    if (restoreError != null) ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Your saved session could not be restored ($restoreError). It is kept on this device — retry, or sign in below.',
                                style: theme.textTheme.bodySmall,
                              ),
                              const SizedBox(height: 8),
                              OutlinedButton(
                                onPressed: _busy ? null : _retrySession,
                                child: const Text('Retry saved session'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.alternate_email),
                      ),
                      validator: (value) {
                        if (value == null ||
                            !value.contains('@') ||
                            value.trim().length < 5) {
                          return 'Enter your email address.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscured,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          tooltip: _obscured ? 'Show password' : 'Hide password',
                          onPressed: () =>
                              setState(() => _obscured = !_obscured),
                          icon: Icon(
                            _obscured
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Enter your password.';
                        }
                        return null;
                      },
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
                          : const Text('Sign in'),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => const RegisterScreen(),
                              ),
                            ),
                      child: const Text('New here? Create an account'),
                    ),
                    TextButton(
                      onPressed: _busy
                          ? null
                          : () => Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    const ForgotPasswordScreen(),
                              ),
                            ),
                      child: const Text('Forgot your password?'),
                    ),
                    const SizedBox(height: 20),
                    const IndependenceNotice(),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
