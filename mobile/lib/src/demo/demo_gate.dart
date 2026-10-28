import 'dart:async';

import 'package:flutter/material.dart';

import '../core/theme/appearance_button.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/widgets/social_auth_options.dart';
import 'demo_store.dart';

typedef DemoAppBuilder = Widget Function(VoidCallback onLogout);

enum _DemoStage { splash, onboarding, signIn, register, forgotPassword, app }

class DemoGate extends StatefulWidget {
  const DemoGate({super.key, required this.store, required this.appBuilder});

  final DemoStore store;
  final DemoAppBuilder appBuilder;

  @override
  State<DemoGate> createState() => _DemoGateState();
}

class _DemoGateState extends State<DemoGate> {
  _DemoStage _stage = _DemoStage.splash;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _stage = _DemoStage.onboarding);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _signIn() => setState(() => _stage = _DemoStage.app);
  void _logout() => setState(() => _stage = _DemoStage.signIn);

  @override
  Widget build(BuildContext context) {
    final screen = switch (_stage) {
      _DemoStage.splash => const _SplashScreen(),
      _DemoStage.onboarding => DemoOnboardingScreen(
          onContinue: () => setState(() => _stage = _DemoStage.signIn),
        ),
      _DemoStage.signIn => DemoSignInScreen(
          onContinue: _signIn,
          onBack: () => setState(() => _stage = _DemoStage.onboarding),
          onRegister: () => setState(() => _stage = _DemoStage.register),
          onForgotPassword: () =>
              setState(() => _stage = _DemoStage.forgotPassword),
        ),
      _DemoStage.register => _DemoRegisterScreen(
          onBack: () => setState(() => _stage = _DemoStage.signIn),
          onContinue: _signIn,
        ),
      _DemoStage.forgotPassword => _DemoForgotPasswordScreen(
          onBack: () => setState(() => _stage = _DemoStage.signIn),
        ),
      _DemoStage.app => widget.appBuilder(_logout),
    };
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 320),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      child: KeyedSubtree(key: ValueKey(_stage), child: screen),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset('assets/demo/gctu-students-together.jpg',
              fit: BoxFit.cover, alignment: Alignment.topCenter),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xE800173F),
                  Color(0xB0003399),
                  Color(0xF500173F)
                ],
                stops: [0, .48, 1],
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 26),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 15, vertical: 9),
                      decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .13),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: Colors.white24)),
                      child: const Text('GCTU STUDENT EXPERIENCE',
                          style: TextStyle(
                              color: Color(0xFFFFD34D),
                              fontWeight: FontWeight.w800,
                              fontSize: 10,
                              letterSpacing: 1.7)),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.all(11),
                      decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .14),
                          borderRadius: BorderRadius.circular(39),
                          border: Border.all(
                              color: Colors.white.withValues(alpha: .35),
                              width: 1.5),
                          boxShadow: const [
                            BoxShadow(
                                color: Color(0x553A63A8),
                                blurRadius: 38,
                                offset: Offset(0, 18))
                          ]),
                      child: ClipRRect(
                          borderRadius: BorderRadius.circular(29),
                          child: Image.asset('assets/icon-1024.png',
                              width: 132, height: 132, fit: BoxFit.cover)),
                    ),
                    const SizedBox(height: 25),
                    const Text('CampusOne',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -.8)),
                    const SizedBox(height: 7),
                    Text('Your campus. All in one place.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: .88),
                            fontSize: 15,
                            letterSpacing: .4)),
                    const SizedBox(height: 19),
                    Container(
                        width: 42,
                        height: 3,
                        decoration: BoxDecoration(
                            color: const Color(0xFFFFCC00),
                            borderRadius: BorderRadius.circular(4))),
                    const Spacer(),
                    const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Color(0xFFFFCC00))),
                    const SizedBox(height: 15),
                    Text('GHANA COMMUNICATION TECHNOLOGY UNIVERSITY',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: .72),
                            fontWeight: FontWeight.w700,
                            fontSize: 9,
                            letterSpacing: 1.1)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DemoOnboardingScreen extends StatefulWidget {
  const DemoOnboardingScreen({super.key, required this.onContinue});

  final VoidCallback onContinue;

  @override
  State<DemoOnboardingScreen> createState() => _DemoOnboardingScreenState();
}

class _DemoOnboardingScreenState extends State<DemoOnboardingScreen> {
  final PageController _controller = PageController();
  Timer? _autoAdvance;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _autoAdvance = Timer.periodic(const Duration(seconds: 4), (timer) {
      if (!mounted || _page >= _titles.length - 1) {
        timer.cancel();
        return;
      }
      _controller.animateToPage(
        _page + 1,
        duration: const Duration(milliseconds: 650),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  void _onPageChanged(int page) {
    setState(() => _page = page);
    if (page == _titles.length - 1) _autoAdvance?.cancel();
  }

  static const _titles = [
    'Never miss a class',
    'Keep your campus close',
    'Find your people',
    'Stay connected',
  ];
  static const _descriptions = [
    'Keep up with campus events, reminders and the moments that matter.',
    'Explore the places, services and opportunities around GCTU.',
    'Meet student communities, discover clubs and make campus yours.',
    'Follow campus updates and keep your student life in one place.',
  ];

  @override
  void dispose() {
    _autoAdvance?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final colors = Theme.of(context).colorScheme;
    final imageHeight = (size.height * .60).clamp(360.0, 620.0);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              height: imageHeight,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: PageView.builder(
                      controller: _controller,
                      itemCount: _titles.length,
                      onPageChanged: _onPageChanged,
                      itemBuilder: (context, index) =>
                          _OnboardingPhotoMosaic(page: index),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 22,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xD900173F),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: .48)),
                      ),
                      child:
                          const Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.school_rounded,
                            color: Color(0xFFFFCC00), size: 17),
                        SizedBox(width: 7),
                        Text('CampusOne',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 14)),
                      ]),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 20,
                    child: TextButton(
                      onPressed: widget.onContinue,
                      style: TextButton.styleFrom(
                        backgroundColor: const Color(0xD900173F),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 17, vertical: 8),
                        shape: const StadiumBorder(),
                        side: BorderSide(
                            color: Colors.white.withValues(alpha: .48)),
                      ),
                      child: const Text('Skip',
                          style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 14)),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(26, 18, 26, 12),
                child: Column(
                  children: [
                    const Spacer(),
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      child: Column(
                        key: ValueKey(_page),
                        children: [
                          Text(_titles[_page],
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: colors.onSurface,
                                  fontSize: 29,
                                  height: 1.1,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -.7)),
                          const SizedBox(height: 12),
                          Text(_descriptions[_page],
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: colors.onSurfaceVariant,
                                  fontSize: 16,
                                  height: 1.45)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 22),
                    Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                            4,
                            (index) => AnimatedContainer(
                                  duration: const Duration(milliseconds: 180),
                                  margin:
                                      const EdgeInsets.symmetric(horizontal: 4),
                                  width: index == _page ? 30 : 9,
                                  height: 9,
                                  decoration: BoxDecoration(
                                      color: index == _page
                                          ? colors.primary
                                          : colors.outlineVariant,
                                      borderRadius: BorderRadius.circular(10)),
                                ))),
                    const Spacer(),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          if (_page == 3) {
                            widget.onContinue();
                          } else {
                            _controller.animateToPage(
                              _page + 1,
                              duration: const Duration(milliseconds: 420),
                              curve: Curves.easeOutCubic,
                            );
                          }
                        },
                        style: FilledButton.styleFrom(
                            backgroundColor: colors.primary,
                            foregroundColor: colors.onPrimary,
                            minimumSize: const Size.fromHeight(58),
                            shape: const StadiumBorder(),
                            textStyle: const TextStyle(
                                fontSize: 17, fontWeight: FontWeight.w800)),
                        child: Text(_page == 3 ? 'Get Started' : 'Continue'),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPhotoMosaic extends StatelessWidget {
  const _OnboardingPhotoMosaic({required this.page});
  final int page;

  static const _photos = [
    'assets/demo/gctu-students-1.jpg',
    'assets/demo/gctu-students-2.jpg',
    'assets/demo/gctu-students-3.jpg',
    'assets/demo/gctu-student-matriculation.jpg',
    'assets/demo/gctu-students-together.jpg',
    'assets/demo/ama-demo-profile.jpg',
  ];

  @override
  Widget build(BuildContext context) {
    final surface = Theme.of(context).scaffoldBackgroundColor;
    final first = _photos[page % _photos.length];
    final second = _photos[(page + 1) % _photos.length];
    final third = _photos[(page + 2) % _photos.length];
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Row(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Expanded(
                flex: 95,
                child: Column(children: [
                  Expanded(child: _MosaicImage(path: first, radius: 0)),
                  const SizedBox(height: 8),
                  Expanded(child: _MosaicImage(path: second, radius: 0)),
                ]),
              ),
              const SizedBox(width: 8),
              Expanded(flex: 105, child: _MosaicImage(path: third, radius: 0)),
            ]),
            IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    stops: [0, .45, 1],
                    colors: [Color(0x00FFFFFF), Color(0x25FFFFFF), surface],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MosaicImage extends StatelessWidget {
  const _MosaicImage({required this.path, this.radius = 24});
  final String path;
  final double radius;
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: SizedBox.expand(
            child: Image.asset(path,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stack) => Container(
                    color: const Color(0xFFE8EEF7),
                    child: Icon(Icons.school_rounded,
                        size: 48,
                        color: Theme.of(context).colorScheme.primary)))),
      );
}

class DemoSignInScreen extends StatefulWidget {
  const DemoSignInScreen({
    super.key,
    required this.onContinue,
    required this.onBack,
    required this.onRegister,
    required this.onForgotPassword,
  });

  final VoidCallback onContinue;
  final VoidCallback onBack;
  final VoidCallback onRegister;
  final VoidCallback onForgotPassword;

  @override
  State<DemoSignInScreen> createState() => _DemoSignInScreenState();
}

class _DemoSignInScreenState extends State<DemoSignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _hidePassword = true;
  bool _remember = true;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _showSocialNotice(String provider) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
          content: Text(
              '$provider sign-in is not connected in this offline demo. Use Login to continue.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            ListView(
              padding: const EdgeInsets.fromLTRB(22, 12, 22, 22),
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _AuthIconButton(
                        icon: Icons.arrow_back_rounded, onTap: widget.onBack),
                    Text('CampusOne',
                        style: TextStyle(
                            color: colors.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 15)),
                    const AppearanceButton(),
                  ],
                ),
                const SizedBox(height: 20),
                Center(
                  child: Container(
                    width: 94,
                    height: 94,
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: .88),
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Image.asset('assets/icon-1024.png',
                            fit: BoxFit.cover)),
                  ),
                ),
                const SizedBox(height: 14),
                Text('Welcome Back',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: colors.onSurface,
                        fontSize: 29,
                        height: 1.1,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -.7)),
                const SizedBox(height: 5),
                Text('Sign in to continue',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: colors.onSurfaceVariant,
                        fontSize: 13,
                        letterSpacing: 2.2)),
                const SizedBox(height: 11),
                Center(
                    child: Container(
                        width: 34,
                        height: 3,
                        decoration: BoxDecoration(
                            color: CampusColors.accent,
                            borderRadius: BorderRadius.circular(4)))),
                const SizedBox(height: 12),
                _AuthTextField(
                    controller: _email,
                    hint: 'Username or Email',
                    icon: Icons.person_outline_rounded),
                const SizedBox(height: 12),
                _AuthTextField(
                  controller: _password,
                  hint: 'Password',
                  icon: Icons.lock_outline_rounded,
                  obscure: _hidePassword,
                  suffix: IconButton(
                    tooltip: _hidePassword ? 'Show password' : 'Hide password',
                    onPressed: () =>
                        setState(() => _hidePassword = !_hidePassword),
                    icon: Icon(
                        _hidePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: colors.onSurfaceVariant),
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Checkbox(
                        value: _remember,
                        onChanged: (value) =>
                            setState(() => _remember = value ?? false),
                        activeColor: colors.primary,
                        visualDensity: VisualDensity.compact),
                    Text('Remember Me',
                        style:
                            TextStyle(color: colors.onSurface, fontSize: 13)),
                    const Spacer(),
                    TextButton(
                        onPressed: widget.onForgotPassword,
                        child: Text('Forgot Password?',
                            style: TextStyle(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                                fontSize: 12))),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 56,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                        color: colors.primary,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: const [
                          BoxShadow(
                              color: Color(0x44306DE5),
                              blurRadius: 18,
                              offset: Offset(0, 8))
                        ]),
                    child: ElevatedButton(
                      onPressed: widget.onContinue,
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          foregroundColor: colors.onPrimary,
                          shadowColor: Colors.transparent,
                          shape: const StadiumBorder()),
                      child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text('Login',
                                style: TextStyle(
                                    color: colors.onPrimary,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16)),
                            SizedBox(width: 10),
                            Icon(Icons.arrow_forward_rounded,
                                color: colors.onPrimary, size: 21)
                          ]),
                    ),
                  ),
                ),
                const SizedBox(height: 9),
                Text('Offline demo · no account required',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: colors.onSurfaceVariant, fontSize: 11)),
                const SizedBox(height: 18),
                SocialAuthOptions(
                  action: 'Sign in with',
                  onProvider: _showSocialNotice,
                ),
                const SizedBox(height: 17),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text('New to CampusOne? ',
                      style: TextStyle(
                          color: colors.onSurfaceVariant, fontSize: 13)),
                  TextButton(
                      onPressed: widget.onRegister,
                      child: Text('Create demo account',
                          style: TextStyle(
                              color: colors.primary,
                              fontWeight: FontWeight.w800))),
                ]),
                const SizedBox(height: 5),
                Text('GHANA COMMUNICATION TECHNOLOGY UNIVERSITY',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: colors.onSurfaceVariant,
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.1)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _AuthIconButton extends StatelessWidget {
  const _AuthIconButton({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Material(
      color: colors.surfaceContainerHigh,
      borderRadius: BorderRadius.circular(15),
      child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(15),
          child: SizedBox(
              width: 44,
              height: 44,
              child: Icon(icon, color: colors.onSurface, size: 21))),
    );
  }
}

class _AuthTextField extends StatelessWidget {
  const _AuthTextField(
      {required this.controller,
      required this.hint,
      required this.icon,
      this.obscure = false,
      this.suffix});
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final Widget? suffix;
  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
          color: colors.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: colors.outlineVariant, width: 1),
          boxShadow: const [
            BoxShadow(
                color: Color(0x1A526B95), blurRadius: 15, offset: Offset(0, 7)),
          ]),
      child: TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                  color: colors.onSurfaceVariant.withValues(alpha: .78),
                  fontSize: 14),
              prefixIcon: Icon(icon, color: colors.onSurfaceVariant),
              suffixIcon: suffix,
              border: InputBorder.none,
              contentPadding:
                  const EdgeInsets.symmetric(vertical: 18, horizontal: 16))),
    );
  }
}

class _DemoRegisterScreen extends StatefulWidget {
  const _DemoRegisterScreen({required this.onBack, required this.onContinue});
  final VoidCallback onBack;
  final VoidCallback onContinue;

  @override
  State<_DemoRegisterScreen> createState() => _DemoRegisterScreenState();
}

class _DemoRegisterScreenState extends State<_DemoRegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _accepted = true;
  bool _error = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  void _createDemoProfile() {
    setState(() => _error = _name.text.trim().isEmpty ||
        _email.text.trim().isEmpty ||
        _password.text.length < 4 ||
        _password.text != _confirm.text ||
        !_accepted);
    if (!_error) widget.onContinue();
  }

  @override
  Widget build(BuildContext context) => _AuthFlowPage(
        title: 'Create your profile',
        subtitle: 'Set up a student demo profile',
        onBack: widget.onBack,
        children: [
          _AuthTextField(
              controller: _name,
              hint: 'Full name',
              icon: Icons.person_outline_rounded),
          const SizedBox(height: 12),
          _AuthTextField(
              controller: _email,
              hint: 'Student email or index number',
              icon: Icons.school_outlined),
          const SizedBox(height: 12),
          _AuthTextField(
              controller: _password,
              hint: 'Create password (4+ characters)',
              icon: Icons.lock_outline_rounded,
              obscure: true),
          const SizedBox(height: 12),
          _AuthTextField(
              controller: _confirm,
              hint: 'Confirm password',
              icon: Icons.lock_reset_rounded,
              obscure: true),
          CheckboxListTile(
            contentPadding: EdgeInsets.zero,
            value: _accepted,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (value) => setState(() => _accepted = value ?? false),
            title: Text('I understand this profile is demo-only.',
                style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
            controlAffinity: ListTileControlAffinity.leading,
          ),
          if (_error)
            Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Text(
                    'Check the fields, use matching passwords, and accept the demo notice.',
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontSize: 12))),
          _AuthPrimaryButton(
              label: 'Create demo profile', onPressed: _createDemoProfile),
          const SizedBox(height: 18),
          SocialAuthOptions(
            action: 'Sign up with',
            onProvider: (provider) =>
                ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(
                      '$provider sign-up is not connected in this demo yet.')),
            ),
          ),
          const SizedBox(height: 12),
          Text('This presentation does not send or store registration data.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11)),
        ],
      );
}

class _DemoForgotPasswordScreen extends StatefulWidget {
  const _DemoForgotPasswordScreen({required this.onBack});
  final VoidCallback onBack;
  @override
  State<_DemoForgotPasswordScreen> createState() =>
      _DemoForgotPasswordScreenState();
}

class _DemoForgotPasswordScreenState extends State<_DemoForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _showDemoNotice = false;
  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => _AuthFlowPage(
        title: 'Forgot password?',
        subtitle: 'Enter the email on your student profile',
        onBack: widget.onBack,
        children: [
          _AuthTextField(
              controller: _email,
              hint: 'Student email',
              icon: Icons.alternate_email_rounded),
          const SizedBox(height: 15),
          _AuthPrimaryButton(
              label: 'Continue',
              onPressed: () => setState(() => _showDemoNotice = true)),
          if (_showDemoNotice)
            Container(
              margin: const EdgeInsets.only(top: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(16)),
              child: Text(
                  'Password recovery is not connected in this offline presentation, so no email has been sent. Return to demo sign-in to continue.',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                      fontSize: 13,
                      height: 1.4)),
            ),
          const SizedBox(height: 12),
          Center(
              child: TextButton(
                  onPressed: widget.onBack,
                  child: const Text('Back to sign in'))),
        ],
      );
}

class _AuthFlowPage extends StatelessWidget {
  const _AuthFlowPage(
      {required this.title,
      required this.subtitle,
      required this.onBack,
      required this.children});
  final String title;
  final String subtitle;
  final VoidCallback onBack;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
          child: Stack(children: [
        ListView(padding: const EdgeInsets.fromLTRB(22, 12, 22, 28), children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            _AuthIconButton(icon: Icons.arrow_back_rounded, onTap: onBack),
            Text('CampusOne',
                style: TextStyle(
                    color: colors.onSurface,
                    fontWeight: FontWeight.w800,
                    fontSize: 15)),
            const AppearanceButton(),
          ]),
          const SizedBox(height: 28),
          Center(
              child: Container(
                  width: 82,
                  height: 82,
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(27)),
                  child: ClipRRect(
                      borderRadius: BorderRadius.circular(21),
                      child: Image.asset('assets/icon-1024.png',
                          fit: BoxFit.cover)))),
          const SizedBox(height: 18),
          Text(title,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: colors.onSurface,
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -.5)),
          const SizedBox(height: 6),
          Text(subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: colors.onSurfaceVariant,
                  fontSize: 13,
                  letterSpacing: .5)),
          const SizedBox(height: 24),
          ...children,
          const SizedBox(height: 24),
          Text('GHANA COMMUNICATION TECHNOLOGY UNIVERSITY',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: colors.onSurfaceVariant,
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.1)),
        ]),
      ])),
    );
  }
}

class _AuthPrimaryButton extends StatelessWidget {
  const _AuthPrimaryButton({required this.label, required this.onPressed});
  final String label;
  final VoidCallback onPressed;
  @override
  Widget build(BuildContext context) => SizedBox(
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary,
            borderRadius: BorderRadius.circular(30),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x44306DE5),
                  blurRadius: 18,
                  offset: Offset(0, 8))
            ]),
        child: ElevatedButton(
            onPressed: onPressed,
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Theme.of(context).colorScheme.onPrimary,
                shadowColor: Colors.transparent,
                shape: const StadiumBorder()),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(label,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 15)),
              const SizedBox(width: 10),
              Icon(Icons.arrow_forward_rounded,
                  color: Theme.of(context).colorScheme.onPrimary, size: 21)
            ])),
      ));
}
