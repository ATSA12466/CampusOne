import 'package:flutter/material.dart';

import '../../app/app_shell.dart';
import '../auth/sign_in_screen.dart';
import 'welcome_prefs.dart';

/// First-run introduction (replayable from Settings).
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  final _pages = PageController();
  int _index = 0;

  static const _slides = [
    _Slide(
      icon: Icons.school_outlined,
      title: 'Your campus in one app',
      body:
          'Clubs, events, announcements, housing, study tools and the SRC office — the same CampusOne backend as the web.',
    ),
    _Slide(
      icon: Icons.qr_code_scanner,
      title: 'RSVP, scan, collect',
      body:
          'Grab a ticket, scan the session QR to check in, and earn badges for showing up.',
    ),
    _Slide(
      icon: Icons.lock_outline,
      title: 'Yours stays yours',
      body:
          'Tasks, notes, grades and plans sync to your account. Photos you attach stay with your records.',
    ),
  ];

  Future<void> _finish({bool signIn = false}) async {
    await WelcomePrefs.markSeen();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
    if (signIn && mounted) {
      Navigator.of(
        context,
      ).push(MaterialPageRoute(builder: (_) => const SignInScreen()));
    }
  }

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView.builder(
                controller: _pages,
                itemCount: _slides.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: Image.asset(
                            'assets/icon-1024.png',
                            width: 96,
                            height: 96,
                          ),
                        ),
                        const SizedBox(height: 32),
                        Icon(
                          slide.icon,
                          size: 48,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          slide.title,
                          style: theme.textTheme.headlineSmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          slide.body,
                          style: theme.textTheme.bodyLarge,
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (i) => Container(
                  margin: const EdgeInsets.all(4),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i == _index
                        ? theme.colorScheme.primary
                        : theme.colorScheme.surfaceContainerHighest,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  FilledButton(
                    onPressed: _index < _slides.length - 1
                        ? () => _pages.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeOut,
                          )
                        : () => _finish(signIn: true),
                    child: Text(
                      _index < _slides.length - 1 ? 'Next' : 'Sign in',
                    ),
                  ),
                  TextButton(
                    onPressed: () => _finish(),
                    child: const Text('Browse as guest'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Slide {
  const _Slide({required this.icon, required this.title, required this.body});

  final IconData icon;
  final String title;
  final String body;
}
