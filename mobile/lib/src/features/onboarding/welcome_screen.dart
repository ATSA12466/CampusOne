import 'package:flutter/material.dart';

import '../../app/app_shell.dart';
import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/media/media.dart';
import '../../core/photos/app_photos.dart';
import '../../core/store/personal_store.dart';
import '../../core/theme/appearance_button.dart';
import '../../core/widgets/notice.dart';
import '../../core/widgets/states.dart';
import '../auth/sign_in_screen.dart';
import '../auth/widgets/auth_story.dart';
import 'onboarding_steps.dart';
import 'welcome_prefs.dart';

/// First-run tour, mirroring the web's five steps (`src/config/onboarding.ts`):
/// photo story, progress, highlights, and a profile step that saves real
/// preferences. Replayable from More → Replay welcome tour.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _name = TextEditingController();
  String? _programme;
  String? _level;
  final _interests = <String>{};
  String? _photo; // data URL of a photo the user picked on this device.
  bool _busy = false;
  int _index = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final user = SessionScope.sessionOf(context).user;
    if (_name.text.isEmpty && user != null) _name.text = user.name;
    if (_programme == null && programmes.contains(user?.programme)) {
      _programme = user!.programme;
    }
    if (_level == null && levels.contains(user?.level)) _level = user!.level;
  }

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  bool get _signedIn => SessionScope.sessionOf(context).signedIn;

  Future<void> _finish() async {
    await WelcomePrefs.markSeen();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await AppPhotos.chooseDataUrl(context);
      if (photo != null && mounted) setState(() => _photo = photo);
    } on PhotoTooLarge catch (error) {
      if (mounted) showAppMessage(context, error.toString(), error: true);
    } catch (_) {
      if (mounted) showAppMessage(context, 'That photo could not be read.', error: true);
    }
  }

  /// Saves the profile step: account record first, then the same personal-store
  /// row the profile editor writes, so the Profile screen shows the same values.
  Future<void> _finishWithProfile() async {
    if (_busy) return;
    final name = _name.text.trim();
    if (name.length < 2) {
      showAppMessage(context, 'Enter your name to finish.', error: true);
      return;
    }
    if (_programme == null || _level == null) {
      showAppMessage(context, 'Choose a demo programme and level.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final session = SessionScope.sessionOf(context);
      final api = SessionScope.apiOf(context);
      await session.updateProfile(name: name, programme: _programme!, level: _level!);
      await PersonalStoreRepository(api).put('profile', {
        'id': 'profile',
        'name': name,
        'programme': _programme!,
        'level': _level!,
        'bio': '',
        'interests': _interests.join(', '),
        'visibility': 'private',
        'showProgramme': 'yes',
        if (_photo != null) 'photo': _photo,
      }); // Matches profileInputSchema (+ owned photo) exactly.
      if (!mounted) return;
      showAppMessage(context, 'Profile preferences saved.');
      await _finish();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final step = onboardingSteps[_index];
    final last = _index == onboardingSteps.length - 1;
    final signedIn = _signedIn;
    return Scaffold(
      appBar: AppBar(
        // The web header pairs the wordmark with Sign in and Skip introduction.
        leadingWidth: 188,
        leading: const Padding(
          padding: EdgeInsets.only(left: 12),
          child: CampusBrandMark(size: BrandMarkSize.sm),
        ),
        actions: [
          if (!signedIn)
            TextButton(
              onPressed: _busy
                  ? null
                  : () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const SignInScreen()),
                      ),
              child: const Text('Sign in'),
            ),
          const AppearanceButton(),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'FIVE SMALL STEPS · YOUR CAMPUS',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                  ),
                ),
              ),
              TextButton(
                onPressed: _busy ? null : _finish,
                child: const Text('Skip introduction'),
              ),
            ],
          ),
          Text(
            'Welcome to CampusOne.',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          AuthStoryPanel(
            story: AuthStory(
              image: step.image,
              eyebrow: step.eyebrow,
              title: step.title,
              description: step.description,
            ),
          ),
          const SizedBox(height: 16),
          _Progress(current: _index + 1, total: onboardingSteps.length),
          const SizedBox(height: 20),
          if (last)
            ..._profileFields(theme, signedIn)
          else
            ...step.highlights.map((highlight) => _Highlight(highlight: highlight)),
          const SizedBox(height: 20),
          if (!signedIn) ...[
            const IndependenceNotice(compact: true),
            const SizedBox(height: 12),
          ],
          Row(
            children: [
              OutlinedButton(
                onPressed: _index == 0 || _busy
                    ? null
                    : () => setState(() => _index -= 1),
                child: const Text('Back'),
              ),
              const Spacer(),
              FilledButton(
                onPressed: _busy
                    ? null
                    : () {
                        if (!last) {
                          setState(() => _index += 1);
                        } else if (signedIn) {
                          _finishWithProfile();
                        } else {
                          _finish();
                        }
                      },
                child: Text(
                  !last
                      ? 'Continue'
                      : signedIn
                      ? 'Finish and continue'
                      : 'Continue to campus',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  /// Step 5 keeps the web's fields. Signed-out readers get the same story and a
  /// plain route into campus instead of a form with no account to save to.
  List<Widget> _profileFields(ThemeData theme, bool signedIn) {
    if (!signedIn) {
      return [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Your profile setup',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 6),
                Text(
                  'Name, programme, level and interests are saved to your CampusOne '
                  'account, so sign in to set them — you can keep browsing without one.',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ),
      ];
    }
    return [
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your profile setup',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                maxLength: 80,
                decoration: const InputDecoration(
                  labelText: 'Your name',
                  counterText: '',
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _programme,
                decoration: const InputDecoration(labelText: 'Demo programme'),
                items: [
                  for (final programme in programmes)
                    DropdownMenuItem(value: programme, child: Text(programme)),
                ],
                onChanged: _busy ? null : (value) => setState(() => _programme = value),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _level,
                decoration: const InputDecoration(labelText: 'Level'),
                items: [
                  for (final level in levels)
                    DropdownMenuItem(value: level, child: Text(level)),
                ],
                onChanged: _busy ? null : (value) => setState(() => _level = value),
              ),
              const SizedBox(height: 8),
              Text(
                'Illustrative programme choices, not an official admissions list. '
                'Saved to your CampusOne account; no university record is changed.',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Profile photo (optional)',
                style: theme.textTheme.labelMedium,
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  CampusAvatar(
                    name: _name.text.trim().isEmpty ? 'You' : _name.text.trim(),
                    image: CampusMedia.tryParse(
                      _photo,
                      alt: 'Your chosen profile photo',
                    ),
                    size: 48,
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton.icon(
                    onPressed: _busy ? null : _pickPhoto,
                    icon: const Icon(Icons.photo_camera_outlined, size: 18),
                    label: Text(_photo == null ? 'Choose a photo' : 'Change photo'),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Your initials are shown until you add a photo. Photos you choose '
                'are stored with your account profile.',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Text('What are you curious about?', style: theme.textTheme.labelMedium),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final interest in campusInterests)
                    FilterChip(
                      label: Text(interest),
                      selected: _interests.contains(interest),
                      onSelected: _busy
                          ? null
                          : (selected) => setState(() {
                              if (selected) {
                                _interests.add(interest);
                              } else {
                                _interests.remove(interest);
                              }
                            }),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    ];
  }
}

class _Progress extends StatelessWidget {
  const _Progress({required this.current, required this.total});

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          label: 'Onboarding progress',
          value: 'Step $current of $total',
          child: Row(
            children: [
              for (var i = 0; i < total; i++)
                Expanded(
                  child: Container(
                    height: 4,
                    margin: EdgeInsets.only(right: i == total - 1 ? 0 : 6),
                    decoration: BoxDecoration(
                      color: i < current
                          ? theme.colorScheme.primary
                          : theme.colorScheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // The web persists the active tour step in browser storage; this app
        // stores only completion, so it deliberately makes no persistence claim.
        Text(
          'Step $current of $total.',
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _Highlight extends StatelessWidget {
  const _Highlight({required this.highlight});

  final OnboardingHighlight highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(highlight.icon, color: theme.colorScheme.primary),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    highlight.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(highlight.text, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
