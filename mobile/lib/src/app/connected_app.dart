import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api/api_client.dart';
import '../core/auth/auth_session.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/theme_prefs.dart';
import '../features/academics/gpa_screen.dart';
import '../features/academics/study_notes_screen.dart';
import '../features/attendance/attendance_history_screen.dart';
import '../features/clubs/clubs_screen.dart';
import '../features/community/community_screen.dart';
import '../features/events/events_screen.dart';
import '../features/messages/conversations_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/saved/saved_screen.dart';
import '../features/tasks/tasks_screen.dart';
import '../features/auth/student_email_verification_screen.dart';

const _apiUrl = String.fromEnvironment('CAMPUSONE_API_URL');

class CampusOneApp extends StatefulWidget {
  const CampusOneApp({super.key});

  @override
  State<CampusOneApp> createState() => _CampusOneAppState();
}

class _CampusOneAppState extends State<CampusOneApp> {
  late final Future<ThemePrefs> _theme = ThemePrefs.load();
  ApiClient? _api;
  AuthSession? _session;
  Map<String, dynamic> _config = const {};
  String? _error;
  bool _busy = true;

  @override
  void initState() {
    super.initState();
    _restoreServer();
  }

  Future<void> _restoreServer() async {
    final saved = await AuthSession.savedBaseUrl();
    final url = saved ?? (_apiUrl.trim().isEmpty ? null : _apiUrl.trim());
    if (url == null) {
      if (mounted) setState(() => _busy = false);
      return;
    }
    await _connect(url, save: false);
  }

  Future<void> _connect(String url, {bool save = true}) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final api = ApiClient(baseUrl: 'https://probe.invalid');
    try {
      api.setBaseUrl(url);
      final health = await api.get('/api/health');
      if (health is! Map<String, dynamic> || health['ok'] != true) {
        throw ApiException('That address is not a CampusOne server.');
      }
      final config = await api.get('/api/v1/config') as Map<String, dynamic>;
      final session = AuthSession(api: api);
      await session.restore();
      if (save) await AuthSession.saveBaseUrl(api.baseUrl);
      if (!mounted) {
        api.close();
        return;
      }
      setState(() {
        _api = api;
        _session = session;
        _config = config;
        _busy = false;
      });
    } on ApiException catch (e) {
      api.close();
      if (mounted)
        setState(() {
          _error = e.message;
          _busy = false;
        });
    } catch (_) {
      api.close();
      if (mounted)
        setState(() {
          _error = 'Could not load CampusOne settings.';
          _busy = false;
        });
    }
  }

  @override
  void dispose() {
    _api?.close();
    _session?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<ThemePrefs>(
        future: _theme,
        builder: (context, snapshot) {
          final prefs = snapshot.data;
          if (prefs == null)
            return MaterialApp(
                home: const Scaffold(
                    body: Center(child: CircularProgressIndicator())));
          return AnimatedBuilder(
            animation: prefs,
            builder: (context, _) {
              final connected = !_busy && _api != null && _session != null;
              Widget app = MaterialApp(
                title: _text('appName', 'CampusOne'),
                debugShowCheckedModeBanner: false,
                theme: buildLightTheme(
                    seedColor: _color('primaryColor', CampusColors.primary),
                    accentColor: _color('accentColor', CampusColors.accent)),
                darkTheme: buildDarkTheme(
                    seedColor: _color('primaryColor', CampusColors.primary),
                    accentColor: _color('accentColor', CampusColors.accent)),
                themeMode: prefs.mode,
                home: _busy
                    ? const Scaffold(
                        body: Center(child: CircularProgressIndicator()))
                    : !connected
                        ? _ServerConnect(onConnect: _connect, error: _error)
                        : _ConnectedRoot(
                            api: _api!,
                            session: _session!,
                            config: _config,
                            onReload: () =>
                                _connect(_api!.baseUrl, save: false),
                          ),
              );

              // Keep the session above MaterialApp so its Navigator and every
              // route pushed by it inherit the authenticated API/session scope.
              if (connected) {
                app = SessionScope(session: _session!, api: _api!, child: app);
              }
              return app;
            },
          );
        },
      );

  String _text(String key, String fallback) {
    final branding = _config['branding'];
    final value = branding is Map ? branding[key] : null;
    return value is String && value.trim().isNotEmpty ? value : fallback;
  }

  Color _color(String key, Color fallback) {
    final branding = _config['branding'];
    final value = branding is Map ? branding[key] : null;
    if (value is! String || !RegExp(r'^#[0-9a-fA-F]{6}$').hasMatch(value))
      return fallback;
    return Color(int.parse(value.substring(1), radix: 16) | 0xff000000);
  }
}

class _ServerConnect extends StatefulWidget {
  const _ServerConnect({required this.onConnect, this.error});
  final Future<void> Function(String) onConnect;
  final String? error;
  @override
  State<_ServerConnect> createState() => _ServerConnectState();
}

class _ServerConnectState extends State<_ServerConnect> {
  final _url = TextEditingController(text: _apiUrl);
  bool _busy = false;
  @override
  void dispose() {
    _url.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Connect to CampusOne')),
        body: ListView(padding: const EdgeInsets.all(24), children: [
          const Icon(Icons.dns_outlined, size: 56),
          const SizedBox(height: 16),
          Text(widget.error ?? 'Enter the public CampusOne server address.',
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          TextField(
              controller: _url,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(
                  labelText: 'Server URL',
                  hintText: 'https://campus.example.edu')),
          const SizedBox(height: 16),
          FilledButton(
              onPressed: _busy
                  ? null
                  : () async {
                      setState(() => _busy = true);
                      await widget.onConnect(_url.text.trim());
                      if (mounted) setState(() => _busy = false);
                    },
              child: Text(_busy ? 'Connecting…' : 'Connect')),
        ]),
      );
}

class _ConnectedRoot extends StatefulWidget {
  const _ConnectedRoot(
      {required this.api,
      required this.session,
      required this.config,
      required this.onReload});
  final ApiClient api;
  final AuthSession session;
  final Map<String, dynamic> config;
  final VoidCallback onReload;
  @override
  State<_ConnectedRoot> createState() => _ConnectedRootState();
}

class _ConnectedRootState extends State<_ConnectedRoot> {
  bool _onboarded = false;
  bool _ready = false;
  bool _splashDone = false;
  Timer? _splashTimer;
  @override
  void initState() {
    super.initState();
    _loadOnboarding();
    _splashTimer = Timer(const Duration(milliseconds: 900), () {
      if (mounted) setState(() => _splashDone = true);
    });
  }

  @override
  void dispose() {
    _splashTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    final revision =
        ((widget.config['branding'] as Map?)?['revision'] ?? '1').toString();
    if (mounted)
      setState(() {
        _onboarded =
            prefs.getString('campusone.onboarding_revision') == revision;
        _ready = true;
      });
  }

  Map<String, dynamic> get brand =>
      (widget.config['branding'] as Map?)?.cast<String, dynamic>() ?? const {};
  String text(String key, String fallback) =>
      (brand[key] as String?)?.trim().isNotEmpty == true
          ? (brand[key] as String)
          : fallback;
  @override
  Widget build(BuildContext context) {
    if (widget.config['maintenance'] == true)
      return _RemoteMessage(
          title: 'We’ll be back soon',
          body: text('maintenanceText',
              'CampusOne is being updated. Please check again shortly.'),
          image: text('splashImageUrl', ''),
          logo: text('logoImageUrl', ''),
          brand: text('appName', 'CampusOne'));
    if (!_ready || !widget.session.ready)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (!_splashDone)
      return _RemoteMessage(
          title: text('splashTitle', 'Your campus, connected.'),
          body: text(
              'splashSubtitle', text('tagline', 'Campus life in one place.')),
          image: text('splashImageUrl', ''),
          logo: text('logoImageUrl', ''),
          brand: text('appName', 'CampusOne'));
    if (!_onboarded) {
      return _WelcomePage(
          brand: brand,
          onContinue: () async {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString('campusone.onboarding_revision',
                ((brand['revision'] ?? '1')).toString());
            if (mounted) setState(() => _onboarded = true);
          });
    }
    return AnimatedBuilder(
      animation: widget.session,
      builder: (context, _) => widget.session.signedIn
          ? _CampusHome(
              api: widget.api,
              session: widget.session,
              config: widget.config,
              onReload: widget.onReload)
          : _SignInPage(
              session: widget.session,
              registrationOpen: widget.config['registrationOpen'] != false),
    );
  }
}

class _WelcomePage extends StatelessWidget {
  const _WelcomePage({required this.brand, required this.onContinue});
  final Map<String, dynamic> brand;
  final VoidCallback onContinue;
  String value(String key, String fallback) =>
      (brand[key] as String?)?.trim().isNotEmpty == true
          ? brand[key] as String
          : fallback;
  @override
  Widget build(BuildContext context) => _RemoteMessage(
        title: value(
            'onboardingTitle', value('splashTitle', 'Your campus, connected.')),
        body: value('onboardingText',
            value('tagline', 'CampusOne brings campus life together.')),
        image: value('onboardingImageUrl', value('splashImageUrl', '')),
        button: value('onboardingButtonText', 'Get started'),
        onContinue: onContinue,
        brand: value('appName', 'CampusOne'),
        logo: value('logoImageUrl', ''),
      );
}

class _RemoteMessage extends StatelessWidget {
  const _RemoteMessage(
      {required this.title,
      required this.body,
      required this.image,
      this.button,
      this.onContinue,
      this.brand = 'CampusOne',
      this.logo = ''});
  final String title, body, image, brand;
  final String logo;
  final String? button;
  final VoidCallback? onContinue;
  @override
  Widget build(BuildContext context) {
    String? resolve(String source) {
      if (source.startsWith('https://') || source.startsWith('http://'))
        return source;
      final baseUrl = SessionScope.apiOrNull(context)?.baseUrl;
      if (source.startsWith('/') && baseUrl != null)
        return Uri.parse(baseUrl).resolve(source).toString();
      return null;
    }

    final imageUrl = resolve(image);
    final logoUrl = resolve(logo);
    return Scaffold(
      body: Stack(fit: StackFit.expand, children: [
        if (imageUrl != null)
          Image.network(imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) =>
                  const ColoredBox(color: CampusColors.primary))
        else
          const ColoredBox(color: CampusColors.primary),
        const DecoratedBox(
            decoration: BoxDecoration(
                gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x5500143a), Color(0xee00143a)]))),
        SafeArea(
            child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        if (logoUrl != null)
                          ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(logoUrl,
                                  width: 38,
                                  height: 38,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => const Icon(
                                      Icons.school,
                                      color: Colors.white)))
                        else
                          const Icon(Icons.school, color: Colors.white),
                        const SizedBox(width: 10),
                        Text(brand,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 18)),
                      ]),
                      const Spacer(),
                      Text(title,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 34,
                              height: 1.1,
                              fontWeight: FontWeight.w800)),
                      const SizedBox(height: 12),
                      Text(body,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 16, height: 1.45)),
                      const SizedBox(height: 24),
                      if (onContinue != null)
                        SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                                onPressed: onContinue,
                                child: Text(button ?? 'Continue'))),
                    ]))),
      ]),
    );
  }
}

class _SignInPage extends StatefulWidget {
  const _SignInPage({required this.session, required this.registrationOpen});
  final AuthSession session;
  final bool registrationOpen;
  @override
  State<_SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<_SignInPage> {
  final _email = TextEditingController(),
      _password = TextEditingController(),
      _name = TextEditingController();
  bool _register = false, _busy = false;
  String? _error;
  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      if (_register) {
        await widget.session.register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            password: _password.text);
      } else {
        await widget.session
            .signIn(email: _email.text.trim(), password: _password.text);
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted)
        setState(() => _error = 'Could not sign in. Please try again.');
    }
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('CampusOne')),
      body: ListView(padding: const EdgeInsets.all(24), children: [
        Text(_register ? 'Create your account' : 'Sign in',
            style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        const Text(
            'Your campus information comes from your university dashboard.'),
        if (_register) ...[
          const SizedBox(height: 18),
          TextField(
              controller: _name,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Full name'))
        ],
        const SizedBox(height: 18),
        TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 12),
        TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password')),
        if (_error != null)
          Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(_error!,
                  style:
                      TextStyle(color: Theme.of(context).colorScheme.error))),
        const SizedBox(height: 18),
        FilledButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy
                ? 'Please wait…'
                : _register
                    ? 'Create account'
                    : 'Sign in')),
        if (widget.registrationOpen)
          TextButton(
              onPressed: _busy
                  ? null
                  : () => setState(() {
                        _register = !_register;
                        _error = null;
                      }),
              child: Text(_register
                  ? 'Already registered? Sign in'
                  : 'New student? Create an account')),
      ]));
}

class _CampusHome extends StatefulWidget {
  const _CampusHome(
      {required this.api,
      required this.session,
      required this.config,
      required this.onReload});
  final ApiClient api;
  final AuthSession session;
  final Map<String, dynamic> config;
  final VoidCallback onReload;
  @override
  State<_CampusHome> createState() => _CampusHomeState();
}

class _CampusHomeState extends State<_CampusHome> {
  static const _tabTitles = [
    'Home',
    'SRC Office',
    'Community',
    'Learning',
    'Campus'
  ];
  int _tab = 0;
  late final _pages = <Widget>[
    _TodayPage(
        api: widget.api,
        name: widget.session.user?.name ?? 'Student',
        onOpenTab: (index) => setState(() => _tab = index),
        onOpenMore: _openMore,
        onOpenSearchSection: _openSearchSection),
    _SrcOfficePage(api: widget.api, session: widget.session),
    if (((widget.config['flags'] as Map?)?['community']) != false)
      const CommunityScreen()
    else
      _DataPage(
          api: widget.api,
          title: 'Announcements',
          path: '/api/v1/announcements',
          collection: 'announcements',
          fields: const ['body', 'audience']),
    _LearningHubPage(
        api: widget.api,
        session: widget.session,
        aiEnabled: (widget.config['ai'] as Map?)?['studyAssistant'] == true,
        attendanceEnabled:
            ((widget.config['flags'] as Map?)?['attendance']) != false),
    _CampusHubPage(
        api: widget.api,
        flags: (widget.config['flags'] as Map?)?.cast<String, dynamic>() ??
            const {}),
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
        extendBody: true,
        appBar: AppBar(
          title: Text(_tabTitles[_tab]),
          actions: [
            IconButton(
                tooltip: 'Notifications',
                onPressed: () => _open(const NotificationsScreen()),
                icon: const Icon(Icons.notifications_none_rounded)),
            IconButton(
                tooltip: 'More services and account',
                onPressed: _openMore,
                icon: CircleAvatar(
                    radius: 16,
                    child: Text(widget.session.user?.initials ?? 'S'))),
          ],
        ),
        body: IndexedStack(index: _tab, children: _pages),
        floatingActionButton:
            ((widget.config['ai'] as Map?)?['studyAssistant'] == true &&
                    widget.session.user?.verifiedStudent == true)
                ? FloatingActionButton.extended(
                    onPressed: () => _open(_StudyChatPage(api: widget.api)),
                    icon: const Icon(Icons.auto_awesome_rounded),
                    label: const Text('Ask AI'),
                  )
                : null,
        bottomNavigationBar: SafeArea(
          minimum: const EdgeInsets.fromLTRB(14, 0, 14, 8),
          child: Container(
            decoration: BoxDecoration(
              color: Theme.of(context)
                  .colorScheme
                  .surfaceContainer
                  .withValues(alpha: .96),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                  color: Theme.of(context)
                      .colorScheme
                      .outlineVariant
                      .withValues(alpha: .8)),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: .3),
                    blurRadius: 22,
                    offset: const Offset(0, 8))
              ],
            ),
            child: NavigationBar(
              height: 68,
              backgroundColor: Colors.transparent,
              selectedIndex: _tab,
              onDestinationSelected: (i) => setState(() => _tab = i),
              destinations: const [
                NavigationDestination(
                    icon: Icon(Icons.home_outlined),
                    selectedIcon: Icon(Icons.home_rounded),
                    label: 'Home'),
                NavigationDestination(
                    icon: Icon(Icons.account_balance_outlined),
                    selectedIcon: Icon(Icons.account_balance_rounded),
                    label: 'SRC Office'),
                NavigationDestination(
                    icon: Icon(Icons.dynamic_feed_outlined),
                    selectedIcon: Icon(Icons.dynamic_feed_rounded),
                    label: 'Community'),
                NavigationDestination(
                    icon: Icon(Icons.school_outlined),
                    selectedIcon: Icon(Icons.school_rounded),
                    label: 'Learning'),
                NavigationDestination(
                    icon: Icon(Icons.explore_outlined),
                    selectedIcon: Icon(Icons.explore_rounded),
                    label: 'Campus'),
              ],
            ),
          ),
        ),
      );

  void _open(Widget page) => Navigator.push<void>(
      context, MaterialPageRoute<void>(builder: (_) => page));

  void _openMore() => _open(_MorePage(
      session: widget.session,
      attendanceEnabled:
          ((widget.config['flags'] as Map?)?['attendance']) != false));

  void _openSearchSection(String section) {
    final tab = switch (section) {
      'announcements' => 1,
      'community' => 2,
      'learning' => 3,
      _ => 4
    };
    setState(() => _tab = tab);
  }
}

class _TodayPage extends StatelessWidget {
  const _TodayPage(
      {required this.api,
      required this.name,
      required this.onOpenTab,
      required this.onOpenMore,
      required this.onOpenSearchSection});
  final ApiClient api;
  final String name;
  final ValueChanged<int> onOpenTab;
  final VoidCallback onOpenMore;
  final ValueChanged<String> onOpenSearchSection;
  @override
  Widget build(BuildContext context) => FutureBuilder<List<dynamic>>(
        future: SessionScope.sessionOf(context).user?.verifiedStudent == true
            ? Future.wait(
                [api.get('/api/v1/timetable'), api.get('/api/v1/exams')])
            : Future.value(const []),
        builder: (context, snapshot) {
          if (SessionScope.sessionOf(context).user?.verifiedStudent != true) {
            final user = SessionScope.sessionOf(context).user;
            return ListView(
                padding: const EdgeInsets.fromLTRB(18, 20, 18, 112),
                children: [
                  Text(
                      'Good ${DateTime.now().hour < 12 ? 'morning' : DateTime.now().hour < 17 ? 'afternoon' : 'evening'},',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color:
                              Theme.of(context).colorScheme.onSurfaceVariant)),
                  Text(
                      user?.name.trim().split(RegExp(r'\s+')).first ??
                          'Student',
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  _HomeSearchBar(api: api, onOpenSection: onOpenSearchSection),
                  const SizedBox(height: 20),
                  _DashboardHero(
                      title: 'Unlock your academic tools',
                      subtitle:
                          'Verify your @live.gctu.edu.gh address to use your timetable, course materials, study tools, and academic assistant.',
                      icon: Icons.verified_user_outlined,
                      actionLabel: 'Verify student email',
                      onTap: () => Navigator.push<void>(
                          context,
                          MaterialPageRoute<void>(
                              builder: (_) =>
                                  const StudentEmailVerificationScreen()))),
                  const SizedBox(height: 18),
                  _FeatureTile(
                      width: double.infinity,
                      title: 'Campus social',
                      subtitle: 'Connect with students',
                      icon: Icons.forum_rounded,
                      color: CampusColors.primaryLight,
                      onTap: () => onOpenTab(2)),
                  const SizedBox(height: 12),
                  _FeatureTile(
                      width: double.infinity,
                      title: 'Campus life',
                      subtitle: 'Events and opportunities',
                      icon: Icons.explore_rounded,
                      color: CampusColors.accent,
                      onTap: () => onOpenTab(4)),
                ]);
          }
          if (snapshot.hasError)
            return _ErrorState(error: snapshot.error!, onRetry: () {});
          if (!snapshot.hasData)
            return const Center(child: CircularProgressIndicator());
          final classes = _maps(snapshot.data![0]['slots']);
          final exams = _maps(snapshot.data![1]['slots']);
          final firstName = name.trim().split(RegExp(r'\s+')).first;
          return ListView(
              padding: const EdgeInsets.fromLTRB(18, 4, 18, 112),
              children: [
                Text(
                    'Good ${DateTime.now().hour < 12 ? 'morning' : DateTime.now().hour < 17 ? 'afternoon' : 'evening'},',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant)),
                const SizedBox(height: 3),
                Text(firstName,
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('Your campus, all in one place.',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant)),
                const SizedBox(height: 12),
                _HomeSearchBar(api: api, onOpenSection: onOpenSearchSection),
                const SizedBox(height: 20),
                _DashboardHero(
                  title: classes.isEmpty
                      ? 'Make today count'
                      : 'Your semester starts here',
                  subtitle: classes.isEmpty
                      ? 'Your timetable will show here when it is ready.'
                      : '${classes.length} class${classes.length == 1 ? '' : 'es'} and ${exams.length} upcoming exam${exams.length == 1 ? '' : 's'} in your schedule.',
                  icon: Icons.auto_awesome_rounded,
                  actionLabel: 'View timetable',
                  onTap: () => Navigator.push<void>(
                      context,
                      MaterialPageRoute<void>(
                          builder: (_) => _DataPage(
                                  api: api,
                                  title: 'Timetable',
                                  path: '/api/v1/timetable',
                                  collection: 'slots',
                                  fields: const [
                                    'when',
                                    'time',
                                    'venue',
                                    'level'
                                  ]))),
                ),
                const SizedBox(height: 22),
                Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Explore CampusOne',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      TextButton(
                          onPressed: onOpenMore, child: const Text('See all'))
                    ]),
                const SizedBox(height: 10),
                LayoutBuilder(builder: (context, constraints) {
                  final width = (constraints.maxWidth - 12) / 2;
                  return Wrap(spacing: 12, runSpacing: 12, children: [
                    _FeatureTile(
                        width: width,
                        title: 'Campus social',
                        subtitle: 'Connect with students',
                        icon: Icons.forum_rounded,
                        color: CampusColors.primaryLight,
                        onTap: () => onOpenTab(2)),
                    _FeatureTile(
                        width: width,
                        title: 'Class reminder',
                        subtitle: 'Keep your schedule close',
                        icon: Icons.calendar_month_rounded,
                        color: CampusColors.accent,
                        onTap: () => Navigator.push<void>(
                            context,
                            MaterialPageRoute<void>(
                                builder: (_) => _DataPage(
                                        api: api,
                                        title: 'Timetable',
                                        path: '/api/v1/timetable',
                                        collection: 'slots',
                                        fields: const [
                                          'when',
                                          'time',
                                          'venue',
                                          'level'
                                        ])))),
                    _FeatureTile(
                        width: width,
                        title: 'Learning materials',
                        subtitle: 'Resources by course',
                        icon: Icons.menu_book_rounded,
                        color: CampusColors.accent,
                        onTap: () => onOpenTab(3)),
                    _FeatureTile(
                        width: width,
                        title: 'Campus life',
                        subtitle: 'Events and opportunities',
                        icon: Icons.explore_rounded,
                        color: CampusColors.primaryLight,
                        onTap: () => onOpenTab(4)),
                  ]);
                }),
                const SizedBox(height: 22),
                Row(children: [
                  Expanded(
                      child: _StatTile(
                          label: 'Classes',
                          value: '${classes.length}',
                          icon: Icons.school_outlined)),
                  const SizedBox(width: 10),
                  Expanded(
                      child: _StatTile(
                          label: 'Exams',
                          value: '${exams.length}',
                          icon: Icons.assignment_outlined))
                ]),
                if (classes.isNotEmpty) ...[
                  const SizedBox(height: 22),
                  Text('On your timetable',
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  ...classes.take(3).map((x) => _DataCard(
                      item: x,
                      fields: const ['when', 'time', 'venue', 'level'])),
                ],
              ]);
        },
      );
}

class _HomeSearchBar extends StatelessWidget {
  const _HomeSearchBar({required this.api, required this.onOpenSection});
  final ApiClient api;
  final ValueChanged<String> onOpenSection;

  @override
  Widget build(BuildContext context) => TextField(
        readOnly: true,
        onTap: () => Navigator.push<void>(
            context,
            MaterialPageRoute<void>(
                builder: (_) =>
                    _GlobalSearchPage(api: api, onOpenSection: onOpenSection))),
        decoration: const InputDecoration(
            hintText: 'Search anything on campus',
            prefixIcon: Icon(Icons.search_rounded),
            suffixIcon: Icon(Icons.arrow_forward_rounded)),
      );
}

class _GlobalSearchPage extends StatefulWidget {
  const _GlobalSearchPage({required this.api, required this.onOpenSection});
  final ApiClient api;
  final ValueChanged<String> onOpenSection;

  @override
  State<_GlobalSearchPage> createState() => _GlobalSearchPageState();
}

class _GlobalSearchPageState extends State<_GlobalSearchPage> {
  final _query = TextEditingController();
  Timer? _debounce;
  Future<List<Map<String, dynamic>>>? _results;

  @override
  void dispose() {
    _debounce?.cancel();
    _query.dispose();
    super.dispose();
  }

  void _search(String value) {
    _debounce?.cancel();
    final query = value.trim();
    if (query.length < 2) {
      setState(() => _results = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 220), () {
      if (!mounted) return;
      setState(() => _results = _fetch(query));
    });
  }

  Future<List<Map<String, dynamic>>> _fetch(String query) async {
    final json = await widget.api.get('/api/v1/search', query: {'q': query});
    return _maps((json as Map<String, dynamic>)['items']);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Search CampusOne')),
        body: Column(children: [
          Padding(
              padding: const EdgeInsets.all(16),
              child: SearchBar(
                  controller: _query,
                  hintText: 'Courses, announcements, events…',
                  leading: const Icon(Icons.search_rounded),
                  onChanged: _search,
                  trailing: [
                    IconButton(
                        tooltip: 'Clear',
                        onPressed: () {
                          _query.clear();
                          _search('');
                        },
                        icon: const Icon(Icons.close_rounded))
                  ])),
          Expanded(
              child: _results == null
                  ? const Center(
                      child: Text('Type a keyword to search across campus.'))
                  : FutureBuilder<List<Map<String, dynamic>>>(
                      future: _results,
                      builder: (context, snapshot) {
                        if (snapshot.hasError)
                          return Center(
                              child: Text(snapshot.error is ApiException
                                  ? (snapshot.error as ApiException).message
                                  : 'Search is unavailable right now.'));
                        if (!snapshot.hasData)
                          return const Center(
                              child: CircularProgressIndicator());
                        final items = snapshot.data!;
                        if (items.isEmpty)
                          return const Center(
                              child:
                                  Text('No matches yet. Try another keyword.'));
                        return ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                            itemCount: items.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 6),
                            itemBuilder: (context, index) {
                              final item = items[index];
                              final section = '${item['section']}';
                              final subtitle = '${item['subtitle'] ?? ''}';
                              final snippet = '${item['snippet'] ?? ''}';
                              return Card(
                                  child: ListTile(
                                      leading: Icon(_searchIcon(section)),
                                      title: Text(
                                          '${item['title'] ?? 'Campus result'}',
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis),
                                      subtitle: Text(
                                          '$subtitle${snippet.isEmpty ? '' : '\n$snippet'}',
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis),
                                      isThreeLine: true,
                                      trailing: const Icon(Icons.chevron_right),
                                      onTap: () {
                                        widget.onOpenSection(section);
                                        Navigator.of(context).pop();
                                      }));
                            });
                      })),
        ]),
      );

  IconData _searchIcon(String section) => switch (section) {
        'announcements' => Icons.campaign_outlined,
        'community' => Icons.forum_outlined,
        'learning' => Icons.school_outlined,
        'clubs' => Icons.groups_outlined,
        'events' => Icons.event_outlined,
        _ => Icons.explore_outlined,
      };
}

class _AcademicMaterialsPage extends StatelessWidget {
  const _AcademicMaterialsPage({required this.api});
  final ApiClient api;

  @override
  Widget build(BuildContext context) {
    if (SessionScope.sessionOf(context).user?.verifiedStudent != true) {
      return const StudentEmailVerificationScreen();
    }
    return _DataPage(
      api: api,
      title: 'Learning materials',
      path: '/api/v1/materials',
      collection: 'materials',
      fields: const ['course', 'type', 'url'],
    );
  }
}

class _SrcOfficePage extends StatelessWidget {
  const _SrcOfficePage({required this.api, required this.session});
  final ApiClient api;
  final AuthSession session;

  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(18, 20, 18, 112), children: [
        Text('SRC Office',
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Official updates and student support, all in one place.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(height: 18),
        _OfficeAction(
            icon: Icons.campaign_outlined,
            title: 'Official announcements',
            subtitle: 'Updates from the SRC',
            onTap: () => _open(
                context,
                _DataPage(
                    api: api,
                    title: 'Announcements',
                    path: '/api/v1/announcements',
                    collection: 'announcements',
                    fields: const ['body', 'audience']))),
        _OfficeAction(
            icon: Icons.support_agent_outlined,
            title: 'Student concerns',
            subtitle: 'Send a question or concern to the SRC',
            onTap: () => _open(context, _EnquiryPage(api: api))),
        _OfficeAction(
            icon: Icons.poll_outlined,
            title: 'Polls and voting',
            subtitle: 'Take part in open student polls',
            onTap: () => _open(context, _PollsPage(api: api))),
        _OfficeAction(
            icon: Icons.groups_outlined,
            title: 'Course representatives',
            subtitle: 'Find the rep for your class and group',
            onTap: () => _open(
                context,
                session.user?.verifiedStudent == true
                    ? _DataPage(
                        api: api,
                        title: 'Class representatives',
                        path: '/api/v1/class-reps',
                        collection: 'classReps',
                        fields: const [
                            'programme',
                            'level',
                            'group',
                            'session',
                            'phone'
                          ])
                    : const StudentEmailVerificationScreen())),
        _OfficeAction(
            icon: Icons.event_available_outlined,
            title: 'Request a club or event',
            subtitle: 'Send a proposal for SRC review',
            onTap: () => _open(context, _ApprovalPage(api: api))),
      ]);

  void _open(BuildContext context, Widget page) => Navigator.push<void>(
      context, MaterialPageRoute<void>(builder: (_) => page));
}

class _OfficeAction extends StatelessWidget {
  const _OfficeAction(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.onTap});
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
          title: Text(title),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: onTap));
}

class _LearningHubPage extends StatelessWidget {
  const _LearningHubPage(
      {required this.api,
      required this.session,
      required this.aiEnabled,
      required this.attendanceEnabled});
  final ApiClient api;
  final AuthSession session;
  final bool aiEnabled, attendanceEnabled;

  @override
  Widget build(BuildContext context) {
    final verified =
        SessionScope.sessionOf(context).user?.verifiedStudent == true;
    Widget gate(Widget page) =>
        verified ? page : const StudentEmailVerificationScreen();
    void open(Widget page) => Navigator.push<void>(
        context, MaterialPageRoute<void>(builder: (_) => page));
    return ListView(
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 112),
        children: [
          Text('Learning',
              style: Theme.of(context)
                  .textTheme
                  .headlineMedium
                  ?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text('Your classes, study resources and progress.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant)),
          if (!verified) ...[
            const SizedBox(height: 14),
            Card(
                child: ListTile(
                    leading: const Icon(Icons.verified_user_outlined),
                    title: const Text('Verify your GCTU email'),
                    subtitle: const Text(
                        'Academic tools open after student verification.'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => open(const StudentEmailVerificationScreen()))),
          ],
          const SizedBox(height: 14),
          _OfficeAction(
              icon: Icons.calendar_month_outlined,
              title: 'Timetable and exams',
              subtitle: 'View your classes, dates and venues',
              onTap: () => open(gate(_DataPage(
                  api: api,
                  title: 'Timetable',
                  path: '/api/v1/timetable',
                  collection: 'slots',
                  fields: const ['when', 'time', 'venue', 'level'])))),
          _OfficeAction(
              icon: Icons.menu_book_outlined,
              title: 'Course materials',
              subtitle: 'Browse approved resources',
              onTap: () => open(gate(_AcademicMaterialsPage(api: api)))),
          if (aiEnabled)
            _OfficeAction(
                icon: Icons.auto_awesome_outlined,
                title: 'Study assistant',
                subtitle: 'Ask questions about your studies',
                onTap: () => open(gate(_StudyChatPage(api: api)))),
          _OfficeAction(
              icon: Icons.calculate_outlined,
              title: 'Grades and GPA',
              subtitle: 'Track marks and estimate your GPA',
              onTap: () => open(gate(const GpaScreen()))),
          _OfficeAction(
              icon: Icons.note_alt_outlined,
              title: 'Study notes',
              subtitle: 'Keep notes together',
              onTap: () => open(gate(const StudyNotesScreen()))),
          _OfficeAction(
              icon: Icons.checklist_outlined,
              title: 'Tasks',
              subtitle: 'Track assignments and deadlines',
              onTap: () => open(gate(const TasksScreen()))),
          if (attendanceEnabled)
            _OfficeAction(
                icon: Icons.qr_code_scanner_rounded,
                title: 'Attendance',
                subtitle: 'View your attendance record',
                onTap: () => open(gate(const AttendanceHistoryScreen()))),
        ]);
  }
}

class _CampusHubPage extends StatelessWidget {
  const _CampusHubPage({required this.api, required this.flags});
  final ApiClient api;
  final Map<String, dynamic> flags;

  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.fromLTRB(18, 20, 18, 112), children: [
        Text('Campus',
            style: Theme.of(context)
                .textTheme
                .headlineMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('Find what is happening and what you need around campus.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(height: 16),
        _OfficeAction(
            icon: Icons.event_outlined,
            title: 'Events',
            subtitle: 'Discover and join campus events',
            onTap: () => Navigator.push<void>(context,
                MaterialPageRoute<void>(builder: (_) => const EventsScreen()))),
        _OfficeAction(
            icon: Icons.groups_outlined,
            title: 'Clubs and societies',
            subtitle: 'Find groups and request to join',
            onTap: () => Navigator.push<void>(context,
                MaterialPageRoute<void>(builder: (_) => const ClubsScreen()))),
        _OfficeAction(
            icon: Icons.storefront_outlined,
            title: 'Campus listings',
            subtitle: 'Hostels, marketplace and opportunities',
            onTap: () => Navigator.push<void>(
                context,
                MaterialPageRoute<void>(
                    builder: (_) => _ListingsPage(api: api, flags: flags)))),
      ]);
}

class _DashboardHero extends StatelessWidget {
  const _DashboardHero(
      {required this.title,
      required this.subtitle,
      required this.icon,
      required this.actionLabel,
      required this.onTap});
  final String title, subtitle, actionLabel;
  final IconData icon;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final blue = Theme.of(context).colorScheme.primary;
    return Material(
        color: Colors.transparent,
        child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(26),
            child: Ink(
              decoration: BoxDecoration(
                  gradient: LinearGradient(
                      colors: [blue, const Color(0xff171441)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight),
                  borderRadius: BorderRadius.circular(26),
                  border: Border.all(
                      color: CampusColors.accent.withValues(alpha: .45))),
              child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(icon, color: Colors.white, size: 30),
                        const SizedBox(height: 20),
                        Text(title,
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800)),
                        const SizedBox(height: 6),
                        Text(subtitle,
                            style: Theme.of(context)
                                .textTheme
                                .bodyMedium
                                ?.copyWith(
                                    color:
                                        Colors.white.withValues(alpha: .88))),
                        const SizedBox(height: 16),
                        Row(children: [
                          Text(actionLabel,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700)),
                          const SizedBox(width: 6),
                          const Icon(Icons.arrow_forward_rounded,
                              color: Colors.white, size: 18)
                        ]),
                      ])),
            )));
  }
}

class _FeatureTile extends StatelessWidget {
  const _FeatureTile(
      {required this.width,
      required this.title,
      required this.subtitle,
      required this.icon,
      required this.color,
      required this.onTap});
  final double width;
  final String title, subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(
      width: width,
      height: 142,
      child: Material(
          color: Theme.of(context).colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(22),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
              onTap: onTap,
              child: Padding(
                  padding: const EdgeInsets.all(15),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Icon(icon, color: color, size: 28),
                        Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w800)),
                              const SizedBox(height: 3),
                              Text(subtitle,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .onSurfaceVariant))
                            ]),
                      ])))));
}

class _StatTile extends StatelessWidget {
  const _StatTile(
      {required this.label, required this.value, required this.icon});
  final String label, value;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 10),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text(value,
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge
                          ?.copyWith(fontWeight: FontWeight.w800)),
                  Text(label,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color:
                              Theme.of(context).colorScheme.onSurfaceVariant))
                ]))
          ])));
}

class _DataPage extends StatelessWidget {
  const _DataPage(
      {required this.api,
      required this.title,
      required this.path,
      required this.collection,
      required this.fields});
  final ApiClient api;
  final String title, path, collection;
  final List<String> fields;
  @override
  Widget build(BuildContext context) => FutureBuilder<dynamic>(
      future: api.get(path),
      builder: (context, snapshot) {
        if (snapshot.hasError)
          return _ErrorState(error: snapshot.error!, onRetry: () {});
        if (!snapshot.hasData)
          return const Center(child: CircularProgressIndicator());
        final list = _maps(snapshot.data[collection]);
        if (list.isEmpty)
          return Center(child: Text('No $title available yet.'));
        return ListView(
            padding: const EdgeInsets.all(16),
            children:
                list.map((x) => _DataCard(item: x, fields: fields)).toList());
      });
}

class _ListingsPage extends StatefulWidget {
  const _ListingsPage({required this.api, required this.flags});
  final ApiClient api;
  final Map<String, dynamic> flags;
  @override
  State<_ListingsPage> createState() => _ListingsPageState();
}

class _ListingsPageState extends State<_ListingsPage> {
  String _kind = 'hostel';
  @override
  Widget build(BuildContext context) => Column(children: [
        SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              for (final k in const [
                'hostel',
                'market',
                'opportunity',
                'promo'
              ])
                if (widget.flags[k == 'hostel'
                        ? 'hostels'
                        : k == 'market'
                            ? 'market'
                            : k == 'opportunity'
                                ? 'jobs'
                                : 'promo'] !=
                    false)
                  Padding(
                      padding: const EdgeInsets.all(4),
                      child: ChoiceChip(
                          label: Text(k),
                          selected: _kind == k,
                          onSelected: (_) => setState(() => _kind = k)))
            ])),
        if (_kind == 'market')
          Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                  onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => _ListingSubmitPage(api: widget.api))),
                  icon: const Icon(Icons.add),
                  label: const Text('Post an item'))),
        Expanded(
            child: _DataPage(
                api: widget.api,
                title: 'Listings',
                path: '/api/v1/listings?kind=$_kind',
                collection: 'listings',
                fields: const ['subtitle', 'owner', 'price'])),
      ]);
}

class _ListingSubmitPage extends StatefulWidget {
  const _ListingSubmitPage({required this.api});
  final ApiClient api;
  @override
  State<_ListingSubmitPage> createState() => _ListingSubmitPageState();
}

class _ListingSubmitPageState extends State<_ListingSubmitPage> {
  final _title = TextEditingController(),
      _details = TextEditingController(),
      _price = TextEditingController();
  bool _busy = false;
  String? _message;
  @override
  void dispose() {
    _title.dispose();
    _details.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.api.post('/api/v1/listings', body: {
        'title': _title.text.trim(),
        'subtitle': _details.text.trim(),
        'price': _price.text.trim()
      });
      if (mounted)
        setState(() => _message =
            'Submitted. Your post appears after Super Admin review.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Post to marketplace')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Item')),
        const SizedBox(height: 12),
        TextField(
            controller: _details,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Details')),
        const SizedBox(height: 12),
        TextField(
            controller: _price,
            decoration: const InputDecoration(labelText: 'Price')),
        if (_message != null)
          Padding(padding: const EdgeInsets.all(12), child: Text(_message!)),
        const SizedBox(height: 12),
        FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Submitting…' : 'Submit for review'))
      ]));
}

class _MorePage extends StatelessWidget {
  const _MorePage({required this.session, required this.attendanceEnabled});
  final AuthSession session;
  final bool attendanceEnabled;
  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.all(16), children: [
        Text('More', style: Theme.of(context).textTheme.headlineSmall),
        ListTile(
            title: const Text('Notifications'),
            leading: const Icon(Icons.notifications_outlined),
            onTap: () => _open(context, const NotificationsScreen())),
        ListTile(
            title: const Text('Saved items'),
            leading: const Icon(Icons.bookmark_border_outlined),
            onTap: () => _open(context, const SavedScreen())),
        ListTile(
            title: const Text('Campus events'),
            leading: const Icon(Icons.event_outlined),
            onTap: () => _open(context, const EventsScreen())),
        ListTile(
            title: const Text('Clubs and societies'),
            leading: const Icon(Icons.groups_outlined),
            onTap: () => _open(context, const ClubsScreen())),
        ListTile(
            title: const Text('Messages'),
            leading: const Icon(Icons.chat_outlined),
            onTap: () => _open(context, const ConversationsScreen())),
        if (attendanceEnabled)
          ListTile(
              title: const Text('My attendance'),
              leading: const Icon(Icons.qr_code_scanner),
              onTap: () => _open(
                  context,
                  session.user?.verifiedStudent == true
                      ? const AttendanceHistoryScreen()
                      : const StudentEmailVerificationScreen())),
        ListTile(
            title: const Text('My account'),
            leading: const Icon(Icons.person_outline),
            subtitle: Text(session.user?.email ?? ''),
            onTap: () => showDialog<void>(
                context: context,
                builder: (_) => AlertDialog(
                        title: Text(session.user?.name ?? 'Account'),
                        content: Text(
                            '${session.user?.programme ?? ''} · ${session.user?.level ?? ''}'),
                        actions: [
                          TextButton(
                              onPressed: () {
                                Navigator.pop(context);
                                session.signOut();
                              },
                              child: const Text('Sign out'))
                        ]))),
      ]);

  void _open(BuildContext context, Widget page) => Navigator.push<void>(
      context, MaterialPageRoute<void>(builder: (_) => page));
}

class _PollsPage extends StatefulWidget {
  const _PollsPage({required this.api});
  final ApiClient api;
  @override
  State<_PollsPage> createState() => _PollsPageState();
}

class _PollsPageState extends State<_PollsPage> {
  late Future<dynamic> _polls = widget.api.get('/api/v1/polls');
  final Set<String> _voting = {};
  String? _error;
  Future<void> _vote(String id, int option) async {
    setState(() {
      _voting.add(id);
      _error = null;
    });
    try {
      await widget.api.post('/api/v1/polls/$id/vote', body: {'option': option});
      setState(() => _polls = widget.api.get('/api/v1/polls'));
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _voting.remove(id));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Campus polls')),
      body: FutureBuilder<dynamic>(
          future: _polls,
          builder: (context, snapshot) {
            if (snapshot.hasError)
              return Center(
                  child: Text(snapshot.error is ApiException
                      ? (snapshot.error as ApiException).message
                      : 'Polls are unavailable.'));
            if (!snapshot.hasData)
              return const Center(child: CircularProgressIndicator());
            final polls = _maps(snapshot.data['polls']);
            if (polls.isEmpty)
              return const Center(
                  child: Text('There are no open polls right now.'));
            return ListView(padding: const EdgeInsets.all(16), children: [
              if (_error != null)
                Text(_error!,
                    style:
                        TextStyle(color: Theme.of(context).colorScheme.error)),
              ...polls.map((p) {
                final id = p['id'].toString();
                final options =
                    p['options'] is List ? (p['options'] as List) : const [];
                return Card(
                    child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('${p['question'] ?? 'Poll'}',
                                  style:
                                      Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 8),
                              for (var i = 0; i < options.length; i++)
                                ListTile(
                                    title: Text('${options[i]}'),
                                    subtitle: Text(
                                        '${(p['votes'] is List && i < (p['votes'] as List).length) ? p['votes'][i] : 0} votes'),
                                    trailing: p['myVote'] != null
                                        ? (p['myVote'] == i
                                            ? const Icon(Icons.check_circle)
                                            : null)
                                        : null,
                                    onTap: p['myVote'] != null ||
                                            _voting.contains(id)
                                        ? null
                                        : () => _vote(id, i))
                            ])));
              })
            ]);
          }));
}

class _SubmitMaterialPage extends StatefulWidget {
  const _SubmitMaterialPage({required this.api});
  final ApiClient api;
  @override
  State<_SubmitMaterialPage> createState() => _SubmitMaterialPageState();
}

class _SubmitMaterialPageState extends State<_SubmitMaterialPage> {
  final _course = TextEditingController(),
      _title = TextEditingController(),
      _url = TextEditingController();
  String _type = 'Slides';
  bool _busy = false;
  String? _message;
  @override
  void dispose() {
    _course.dispose();
    _title.dispose();
    _url.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.api.post('/api/v1/materials', body: {
        'course': _course.text.trim(),
        'title': _title.text.trim(),
        'type': _type,
        'url': _url.text.trim()
      });
      if (mounted)
        setState(() => _message =
            'Submitted. The SRC will review it before other students can see it.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Share course material')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        TextField(
            controller: _course,
            decoration: const InputDecoration(labelText: 'Course code')),
        const SizedBox(height: 12),
        TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
            initialValue: _type,
            items: const ['Slides', 'Notes', 'Past questions', 'Other']
                .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? 'Slides')),
        const SizedBox(height: 12),
        TextField(
            controller: _url,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(labelText: 'File link')),
        if (_message != null)
          Padding(padding: const EdgeInsets.all(12), child: Text(_message!)),
        const SizedBox(height: 12),
        FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Submitting…' : 'Submit for review'))
      ]));
}

class _ApprovalPage extends StatefulWidget {
  const _ApprovalPage({required this.api});
  final ApiClient api;
  @override
  State<_ApprovalPage> createState() => _ApprovalPageState();
}

class _ApprovalPageState extends State<_ApprovalPage> {
  final _title = TextEditingController();
  String _kind = 'club';
  bool _busy = false;
  String? _message;
  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.api.post('/api/v1/approvals',
          body: {'kind': _kind, 'title': _title.text.trim()});
      if (mounted)
        setState(() => _message = 'Request sent to the SRC for review.');
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Request approval')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        DropdownButtonFormField<String>(
            initialValue: _kind,
            items: const [
              DropdownMenuItem(value: 'club', child: Text('Club')),
              DropdownMenuItem(value: 'event', child: Text('Event'))
            ],
            onChanged: (v) => setState(() => _kind = v ?? 'club')),
        const SizedBox(height: 12),
        TextField(
            controller: _title,
            decoration: const InputDecoration(labelText: 'Name')),
        if (_message != null)
          Padding(padding: const EdgeInsets.all(12), child: Text(_message!)),
        const SizedBox(height: 12),
        FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Sending…' : 'Send request'))
      ]));
}

class _StudyChatPage extends StatefulWidget {
  const _StudyChatPage({required this.api});
  final ApiClient api;
  @override
  State<_StudyChatPage> createState() => _StudyChatPageState();
}

class _StudyChatPageState extends State<_StudyChatPage> {
  final _input = TextEditingController();
  final List<(bool, String)> _messages = [];
  bool _busy = false;
  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final message = _input.text.trim();
    if (message.isEmpty || _busy) return;
    setState(() {
      _messages.add((true, message));
      _busy = true;
    });
    _input.clear();
    try {
      final result =
          await widget.api.post('/api/v1/ai/chat', body: {'message': message})
              as Map<String, dynamic>;
      if (mounted)
        setState(() => _messages.add((
              false,
              result['reply']?.toString() ?? 'I could not create a reply.'
            )));
    } on ApiException catch (e) {
      if (mounted) setState(() => _messages.add((false, e.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Study assistant')),
        body: Column(children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: _messages
                  .map((message) => Align(
                        alignment: message.$1
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Card(
                            child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Text(message.$2),
                        )),
                      ))
                  .toList(),
            ),
          ),
          SafeArea(
              child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(
                  child: TextField(
                controller: _input,
                minLines: 1,
                maxLines: 4,
                decoration:
                    const InputDecoration(hintText: 'Ask a study question'),
              )),
              IconButton(
                  onPressed: _busy ? null : _send,
                  icon: const Icon(Icons.send)),
            ]),
          )),
        ]),
      );
}

class _EnquiryPage extends StatefulWidget {
  const _EnquiryPage({required this.api});
  final ApiClient api;
  @override
  State<_EnquiryPage> createState() => _EnquiryPageState();
}

class _EnquiryPageState extends State<_EnquiryPage> {
  final _subject = TextEditingController(), _body = TextEditingController();
  bool _busy = false;
  String? _message;
  late Future<dynamic> _items = widget.api.get('/api/v1/enquiries');
  @override
  void dispose() {
    _subject.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      await widget.api.post('/api/v1/enquiries',
          body: {'subject': _subject.text.trim(), 'body': _body.text.trim()});
      if (mounted)
        setState(() {
          _message = 'Your message was sent to the SRC.';
          _items = widget.api.get('/api/v1/enquiries');
        });
    } on ApiException catch (e) {
      if (mounted) setState(() => _message = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Contact the SRC')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Text('Your messages', style: Theme.of(context).textTheme.titleLarge),
        FutureBuilder<dynamic>(
            future: _items,
            builder: (context, snapshot) {
              if (!snapshot.hasData)
                return const Padding(
                    padding: EdgeInsets.all(12),
                    child: Center(child: CircularProgressIndicator()));
              final rows = _maps(snapshot.data['enquiries']);
              if (rows.isEmpty)
                return const _EmptyCard('You have not contacted the SRC yet.');
              return Column(
                  children: rows
                      .map((e) => _DataCard(item: {
                            'title': e['subject'],
                            'body':
                                '${e['body'] ?? ''}${(e['reply'] as String?)?.isNotEmpty == true ? '\\n\\nSRC reply: ${e['reply']}' : ''}',
                            'status': e['resolved'] == true
                                ? 'Answered'
                                : 'Awaiting reply'
                          }, fields: const [
                            'status',
                            'body'
                          ]))
                      .toList());
            }),
        const Divider(height: 32),
        TextField(
            controller: _subject,
            decoration: const InputDecoration(labelText: 'Subject')),
        const SizedBox(height: 12),
        TextField(
            controller: _body,
            maxLines: 6,
            decoration: const InputDecoration(labelText: 'Message')),
        if (_message != null)
          Padding(padding: const EdgeInsets.all(12), child: Text(_message!)),
        const SizedBox(height: 12),
        FilledButton(
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'Sending…' : 'Send message')),
      ]));
}

class _DataCard extends StatelessWidget {
  const _DataCard({required this.item, required this.fields});
  final Map<String, dynamic> item;
  final List<String> fields;
  @override
  Widget build(BuildContext context) {
    final title =
        (item['title'] ?? item['course'] ?? item['question'] ?? 'Campus update')
            .toString();
    final lines = fields
        .map((key) => item[key])
        .where((v) => v != null && v.toString().trim().isNotEmpty)
        .map((v) => v is List ? v.join(' · ') : v.toString())
        .toList();
    return Card(
        child: ListTile(
            title: Text(title),
            subtitle: lines.isEmpty ? null : Text(lines.join('\n')),
            isThreeLine: lines.length > 1));
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(padding: const EdgeInsets.all(16), child: Text(text)));
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.error, required this.onRetry});
  final Object error;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
      child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(error is ApiException
              ? (error as ApiException).message
              : 'CampusOne could not load this information.')));
}

List<Map<String, dynamic>> _maps(dynamic value) => value is List
    ? value.whereType<Map>().map((x) => Map<String, dynamic>.from(x)).toList()
    : <Map<String, dynamic>>[];
