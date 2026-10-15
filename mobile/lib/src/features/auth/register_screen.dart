import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/push/push_service.dart';
import '../../core/theme/appearance_button.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import '../onboarding/welcome_screen.dart';
import 'auth_validation.dart';
import 'widgets/auth_story.dart';

/// Registration. Name/email/password limits match the server contract in
/// `src/server/auth.ts`; confirmation, preview consent, copy and fields mirror
/// the web form (`register-form.tsx`). After the real API account is created,
/// the app continues to the five-step welcome/profile setup just like the web.
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
  final _confirm = TextEditingController();
  bool _obscured = true;
  bool _consent = false;
  bool _busy = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate() || _busy) return;
    if (!_consent) {
      showAppMessage(context, 'Confirm the preview notice first.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await SessionScope.sessionOf(context).register(
        name: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
      );
      await PushService.refreshToken(SessionScope.apiOf(context));
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const WelcomeScreen()),
          (_) => false,
        );
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const CampusBrandMark(size: BrandMarkSize.sm),
        actions: const [AppearanceButton()],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _form,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthStoryPanel(story: AuthStory.register),
                const SizedBox(height: 20),
                // Web `/register` copy, verbatim.
                Text('Start your next chapter.', style: theme.textTheme.headlineSmall),
                const SizedBox(height: 6),
                Text(
                  'A name, a little curiosity, and a campus full of possibilities.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 20),
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
                  validator: AuthValidation.email,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _password,
                  obscureText: _obscured,
                  maxLength: 128,
                  decoration: InputDecoration(
                    labelText: 'Password (8+ characters)',
                    counterText: '',
                    helperText:
                        'Use 8–128 characters and choose a unique password. '
                        'Never reuse your LMS or SIP password.',
                    helperMaxLines: 2,
                    suffixIcon: IconButton(
                      tooltip: _obscured ? 'Show password' : 'Hide password',
                      onPressed: () => setState(() => _obscured = !_obscured),
                      icon: Icon(
                        _obscured
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                    ),
                  ),
                  validator: (value) => (value ?? '').length >= 8
                      ? null
                      : 'Use at least 8 characters.',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _confirm,
                  obscureText: _obscured,
                  maxLength: 128,
                  decoration: const InputDecoration(
                    labelText: 'Confirm password',
                    counterText: '',
                  ),
                  validator: (value) => (value ?? '') == _password.text
                      ? null
                      : 'Passwords must match.',
                ),
                const SizedBox(height: 4),
                CheckboxListTile(
                  value: _consent,
                  onChanged: _busy
                      ? null
                      : (value) => setState(() => _consent = value ?? false),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('I understand the preview notice'),
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
                TextButton(
                  onPressed: _busy ? null : () => Navigator.of(context).pop(),
                  child: const Text('Already have a profile? Sign in'),
                ),
                const SizedBox(height: 8),
                const IndependenceNotice(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
