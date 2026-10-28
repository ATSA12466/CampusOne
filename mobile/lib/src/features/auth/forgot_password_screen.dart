import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/theme/appearance_button.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import 'auth_validation.dart';
import 'widgets/auth_story.dart';

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
      appBar: AppBar(
        title: const CampusBrandMark(size: BrandMarkSize.sm),
        actions: const [AppearanceButton()],
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Web `authStories.recovery`, kept verbatim.
            const AuthStoryPanel(story: AuthStory.recovery),
            const SizedBox(height: 20),
            Text(
              'Let’s get you back.',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 6),
            Text(
              'A small step back toward your workspace. Email delivery requires a connected service.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 16),
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
              decoration: const InputDecoration(
                labelText: 'Email',
                counterText: '',
              ),
              keyboardType: TextInputType.emailAddress,
              autocorrect: false,
              maxLength: 254,
              validator: AuthValidation.email,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Request reset link'),
            ),
            TextButton.icon(
              onPressed: _busy ? null : () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back),
              label: const Text('Back to sign in'),
            ),
            const SizedBox(height: 20),
            const IndependenceNotice(),
          ],
        ),
      ),
    );
  }
}
