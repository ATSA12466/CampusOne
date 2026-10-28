import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/push/push_service.dart';
import '../../core/theme/appearance_button.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import 'auth_validation.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';
import 'widgets/auth_story.dart';
import 'widgets/social_auth_options.dart';

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
    final session = SessionScope.sessionOf(context);
    final api = SessionScope.apiOf(context);
    try {
      await session.signIn(email: _email.text.trim(), password: _password.text);
      // Upload this device for push now that a token exists.
      await PushService.refreshToken(api);
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
    final api = SessionScope.apiOf(context);
    try {
      final session = SessionScope.sessionOf(context);
      await session.restore();
      if (session.signedIn) {
        await PushService.refreshToken(api);
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
                    Row(
                      children: [
                        const Expanded(
                          child: CampusBrandMark(size: BrandMarkSize.sm),
                        ),
                        const AppearanceButton(),
                      ],
                    ),
                    const SizedBox(height: 12),
                    // The web puts this photo story beside the form; on a phone
                    // it opens the screen, same picture and copy.
                    const AuthStoryPanel(story: AuthStory.signIn),
                    const SizedBox(height: 24),
                    // Web `/sign-in` copy, verbatim.
                    Text(
                      'Good to see you.',
                      style: theme.textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your people and your plans, in one place. Open your '
                      'student-life workspace.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
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
                      maxLength: 254,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.alternate_email),
                        counterText: '',
                      ),
                      validator: AuthValidation.email,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscured,
                      maxLength: 128,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        counterText: '',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          tooltip:
                              _obscured ? 'Show password' : 'Hide password',
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
                                  builder: (_) => const ForgotPasswordScreen(),
                                ),
                              ),
                      child: const Text('Forgot your password?'),
                    ),
                    const SizedBox(height: 14),
                    SocialAuthOptions(
                      action: 'Sign in with',
                      onProvider: (provider) => showAppMessage(
                        context,
                        '$provider sign-in is not connected yet. Use your email and password for now.',
                      ),
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
