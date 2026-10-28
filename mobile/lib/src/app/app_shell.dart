import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../demo/demo_data.dart';
import '../demo/demo_store.dart';
import '../demo/demo_student_tools.dart';
import '../demo/demo_student_extras.dart';
import '../demo/demo_campus_services.dart';
import '../demo/demo_campus_modules.dart';
import '../demo/demo_school_media.dart';
import '../demo/demo_community.dart';
import '../demo/demo_market_profile.dart';
import '../demo/demo_study_hub.dart';
import '../demo/demo_presentation_tour.dart';
import '../features/academics/gpa_planner_screen.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key, required this.store, required this.onLogout});

  final DemoStore store;
  final VoidCallback onLogout;

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _tab = 0;

  void _goTo(int index) => setState(() => _tab = index);

  void _openExplore() {
    Navigator.of(context).push(MaterialPageRoute<void>(
        builder: (_) => _ExploreScreen(store: widget.store)));
  }

  void _openMessages() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _MessagesScreen(store: widget.store),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _DemoHomeScreen(
        store: widget.store,
        onExplore: _openExplore,
        onMessages: _openMessages,
        onTasks: () =>
            _openDemoFeature(context, DemoTasksScreen(store: widget.store)),
        onTimetable: () =>
            _openDemoFeature(context, DemoTimetableScreen(store: widget.store)),
      ),
      const DemoCommunityScreen(),
      DemoClubsScreen(store: widget.store),
      DemoSrcOfficeScreen(store: widget.store),
      DemoMoreScreen(
        store: widget.store,
        onLogout: widget.onLogout,
        onProfile: () => _openDemoFeature(
            context, DemoStudentProfileScreen(store: widget.store)),
      ),
    ];
    return Scaffold(
      body: IndexedStack(index: _tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: _goTo,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.forum_outlined),
            selectedIcon: Icon(Icons.forum_rounded),
            label: 'Community',
          ),
          NavigationDestination(
            icon: Icon(Icons.groups_outlined),
            selectedIcon: Icon(Icons.groups_rounded),
            label: 'Clubs',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_outlined),
            selectedIcon: Icon(Icons.account_balance_rounded),
            label: 'SRC',
          ),
          NavigationDestination(
            icon: Icon(Icons.menu_rounded),
            selectedIcon: Icon(Icons.menu_rounded),
            label: 'More',
          ),
        ],
      ),
    );
  }
}

class _DemoHomeScreen extends StatelessWidget {
  const _DemoHomeScreen({
    required this.store,
    required this.onExplore,
    required this.onMessages,
    required this.onTasks,
    required this.onTimetable,
  });

  final DemoStore store;
  final VoidCallback onExplore;
  final VoidCallback onMessages;
  final VoidCallback onTasks;
  final VoidCallback onTimetable;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: _DraggableOfficeOverlay(
          onTap: onMessages,
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      _LogoMark(size: 43),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'CampusOne',
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              'GCTU STUDENT LIFE',
                              style: theme.textTheme.labelSmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                                fontWeight: FontWeight.w700,
                                letterSpacing: .8,
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _RoundAction(
                        icon: Icons.search_rounded,
                        label: 'Explore',
                        onTap: onExplore,
                      ),
                      const SizedBox(width: 8),
                      AnimatedBuilder(
                        animation: store,
                        builder: (context, _) => _NotificationButton(
                          count: store.unreadAnnouncements,
                          onTap: () => _showAnnouncements(context, store),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 23, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: AnimatedBuilder(
                    animation: store,
                    builder: (context, _) => Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'GOOD ${_greeting()}, ${_firstName(store.profileName).toUpperCase()}',
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: Theme.of(context).colorScheme.primary,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.2,
                                ),
                              ),
                              const SizedBox(height: 5),
                              Text(
                                'Your campus,\nyour next move.',
                                style: theme.textTheme.headlineMedium?.copyWith(
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w800,
                                  height: 1.02,
                                  letterSpacing: -1,
                                ),
                              ),
                            ],
                          ),
                        ),
                        InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => _openDemoFeature(
                              context, DemoStudentProfileScreen(store: store)),
                          child: Container(
                            padding: const EdgeInsets.all(3),
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white,
                            ),
                            child: _DemoProfileAvatar(
                              photoDataUrl: store.profilePhoto,
                              radius: 23,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _HomeBannerCarousel(onExplore: onExplore),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 23, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Expanded(
                        child: _MetricCard(
                          icon: Icons.event_available_rounded,
                          value: '04',
                          label: 'This week',
                          tint: const Color(0xFFEAF0FF),
                          color: Theme.of(context).colorScheme.primary,
                          onTap: onExplore,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: AnimatedBuilder(
                          animation: store,
                          builder: (context, _) => _MetricCard(
                            icon: Icons.groups_rounded,
                            value: store.joinedClubCount
                                .toString()
                                .padLeft(2, '0'),
                            label: 'Clubs joined',
                            tint: const Color(0xFFE8F6F0),
                            color: const Color(0xFF16816C),
                            onTap: onExplore,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: AnimatedBuilder(
                          animation: store,
                          builder: (context, _) => _MetricCard(
                            icon: Icons.mark_chat_unread_rounded,
                            value: '${store.unreadAnnouncements}',
                            label: 'Updates',
                            tint: const Color(0xFFFFF4D2),
                            color: const Color(0xFF9B6900),
                            onTap: () => _showAnnouncements(context, store),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _TodayOverview(
                    store: store,
                    onTasks: onTasks,
                    onTimetable: onTimetable,
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 26, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _SectionHeading(
                    title: 'Made for your week',
                    subtitle: 'Good things are happening on campus.',
                    action: 'See all',
                    onAction: onExplore,
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 206,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 4),
                    scrollDirection: Axis.horizontal,
                    itemCount: 3,
                    separatorBuilder: (context, index) =>
                        const SizedBox(width: 12),
                    itemBuilder: (context, index) => _EventCard(
                      event: demoEvents[index],
                      store: store,
                      compact: true,
                    ),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                sliver: SliverToBoxAdapter(
                  child: _SectionHeading(
                    title: 'Campus notes',
                    subtitle: 'A little update from around GCTU.',
                    action: 'View all',
                    onAction: () => _showAnnouncements(context, store),
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                sliver: SliverList.separated(
                  itemCount: 2,
                  itemBuilder: (context, index) => _AnnouncementCard(
                    item: demoAnnouncements[index],
                    store: store,
                  ),
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 10),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TodayOverview extends StatelessWidget {
  const _TodayOverview(
      {required this.store, required this.onTasks, required this.onTimetable});
  final DemoStore store;
  final VoidCallback onTasks;
  final VoidCallback onTimetable;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          const days = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
          ];
          final day = days[DateTime.now().weekday - 1];
          final classes =
              store.classes.where((session) => session.day == day).toList();
          final remaining = store.tasks.where((task) => !task.completed).length;
          return Container(
            padding: const EdgeInsets.fromLTRB(15, 14, 15, 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant),
            ),
            child: Column(children: [
              Row(children: [
                Expanded(
                    child: Text('Your day at a glance',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontSize: 15,
                            fontWeight: FontWeight.w800))),
                Text(day,
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700)),
              ]),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                    backgroundColor: Color(0xFFEAF0FF),
                    child: Icon(Icons.menu_book_rounded,
                        color: Theme.of(context).colorScheme.primary,
                        size: 19)),
                title: Text(
                    classes.isEmpty
                        ? 'No classes listed today'
                        : classes.first.course,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13)),
                subtitle: Text(
                    classes.isEmpty
                        ? 'Add your timetable in More'
                        : '${classes.first.time}  |  ${classes.first.venue}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11)),
                trailing: TextButton(
                    onPressed: onTimetable, child: const Text('Week')),
              ),
              const Divider(height: 1),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                    backgroundColor: Color(0xFFFFF4D2),
                    child: Icon(Icons.checklist_rounded,
                        color: Color(0xFF9B6900), size: 19)),
                title: Text('$remaining tasks to do',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 13)),
                subtitle: const Text('Keep your next deadline in view',
                    style: TextStyle(fontSize: 11)),
                trailing:
                    TextButton(onPressed: onTasks, child: const Text('Tasks')),
              ),
            ]),
          );
        },
      );
}

class _DraggableOfficeOverlay extends StatefulWidget {
  const _DraggableOfficeOverlay({required this.child, required this.onTap});
  final Widget child;
  final VoidCallback onTap;

  @override
  State<_DraggableOfficeOverlay> createState() =>
      _DraggableOfficeOverlayState();
}

class _DraggableOfficeOverlayState extends State<_DraggableOfficeOverlay> {
  static const double _buttonWidth = 138;
  static const double _buttonHeight = 54;
  static const double _edge = 12;

  double? _left;
  double? _top;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, constraints) {
          final maxLeft = (constraints.maxWidth - _buttonWidth - _edge)
              .clamp(_edge, double.infinity)
              .toDouble();
          final maxTop = (constraints.maxHeight - _buttonHeight - _edge)
              .clamp(_edge, double.infinity)
              .toDouble();
          _left ??= maxLeft;
          _top ??= maxTop;
          _left = _left!.clamp(_edge, maxLeft).toDouble();
          _top = _top!.clamp(_edge, maxTop).toDouble();

          return Stack(children: [
            widget.child,
            Positioned(
              left: _left,
              top: _top,
              width: _buttonWidth,
              height: _buttonHeight,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: widget.onTap,
                onPanUpdate: (details) => setState(() {
                  _left = (_left! + details.delta.dx)
                      .clamp(_edge, maxLeft)
                      .toDouble();
                  _top = (_top! + details.delta.dy)
                      .clamp(_edge, maxTop)
                      .toDouble();
                }),
                onPanEnd: (_) {
                  final corners = <Offset>[
                    const Offset(_edge, _edge),
                    Offset(maxLeft, _edge),
                    Offset(_edge, maxTop),
                    Offset(maxLeft, maxTop),
                  ];
                  final current = Offset(_left!, _top!);
                  final nearest = corners.reduce((a, b) =>
                      (a - current).distanceSquared <=
                              (b - current).distanceSquared
                          ? a
                          : b);
                  setState(() {
                    _left = nearest.dx;
                    _top = nearest.dy;
                  });
                },
                child: Material(
                  elevation: 8,
                  color: Theme.of(context).colorScheme.primary,
                  borderRadius: BorderRadius.circular(28),
                  shadowColor: const Color(0x550B2545),
                  child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_rounded,
                            color: CampusColors.accent, size: 19),
                        SizedBox(width: 8),
                        Text('Messages',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800)),
                        SizedBox(width: 3),
                        Icon(Icons.drag_indicator_rounded,
                            color: Colors.white70, size: 17),
                      ]),
                ),
              ),
            ),
          ]);
        },
      );
}

class _HomeBannerCarousel extends StatefulWidget {
  const _HomeBannerCarousel({required this.onExplore});
  final VoidCallback onExplore;

  @override
  State<_HomeBannerCarousel> createState() => _HomeBannerCarouselState();
}

class _HomeBannerCarouselState extends State<_HomeBannerCarousel> {
  final PageController _controller = PageController();
  Timer? _timer;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_controller.hasClients) return;
      final next = (_page + 1) % 2;
      _controller.animateToPage(
        next,
        duration: const Duration(milliseconds: 550),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(children: [
        SizedBox(
          height: 176,
          child: PageView(
            controller: _controller,
            onPageChanged: (page) => setState(() => _page = page),
            children: [
              _CampusHero(onExplore: widget.onExplore),
              const _SponsoredPlacement(),
            ],
          ),
        ),
        const SizedBox(height: 9),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
          for (var index = 0; index < 2; index++)
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _page == index ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _page == index
                    ? CampusColors.primary
                    : const Color(0xFFD7DFEC),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
        ]),
      ]);
}

class _SponsoredPlacement extends StatelessWidget {
  const _SponsoredPlacement();

  @override
  Widget build(BuildContext context) => Container(
        height: 112,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              CampusColors.primaryDark,
              CampusColors.primary,
              Color(0xFF5379B5)
            ],
          ),
        ),
        child: Stack(children: [
          Positioned(
              right: -12,
              top: -35,
              child: Container(
                width: 130,
                height: 130,
                decoration: const BoxDecoration(
                  color: Color(0x22FFCC00),
                  shape: BoxShape.circle,
                ),
              )),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: .14),
                    borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.play_circle_fill_rounded,
                    color: CampusColors.accent, size: 34),
              ),
              const SizedBox(width: 13),
              const Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                    Text('SPONSORED / DEMO PREVIEW',
                        style: TextStyle(
                            color: CampusColors.accent,
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            letterSpacing: .8)),
                    SizedBox(height: 5),
                    Text('Your brand on campus',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w800)),
                    SizedBox(height: 3),
                    Text('Short video and partner offers',
                        style: TextStyle(color: Colors.white70, fontSize: 11)),
                  ])),
              const Icon(Icons.chevron_right_rounded, color: Colors.white70),
            ]),
          ),
        ]),
      );
}

class _CampusHero extends StatelessWidget {
  const _CampusHero({required this.onExplore});

  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        height: 176,
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.asset(
              'assets/demo/gctu-students-together.jpg',
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
            ),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Color(0xE6001E5B),
                    Color(0xBF003399),
                    Color(0x18003399)
                  ],
                  stops: [0, .58, 1],
                ),
              ),
            ),
            Positioned(
              right: -22,
              top: -42,
              child: Container(
                width: 128,
                height: 128,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                      color: Colors.white.withValues(alpha: .16), width: 1.5),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const _DemoPillLight(),
                  const Spacer(),
                  const Text(
                    'Make campus\nyour own.',
                    style: TextStyle(
                      color: Colors.white,
                      height: 1.05,
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.45,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Find your people. Find your next thing.',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: .9),
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: onExplore,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: const BoxDecoration(
                            color: CampusColors.accent,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.arrow_forward_rounded,
                            color: Theme.of(context).colorScheme.onSurface,
                            size: 18,
                          ),
                        ),
                      ),
                    ],
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

class _ExploreScreen extends StatefulWidget {
  const _ExploreScreen({required this.store});

  final DemoStore store;

  @override
  State<_ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<_ExploreScreen> {
  String _filter = 'All';
  String _query = '';
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = <Widget>[];
    final query = _query.toLowerCase();
    if (_filter == 'All' || _filter == 'Events') {
      for (final event in demoEvents.where((e) =>
          '${e.title} ${e.category} ${e.venue}'
              .toLowerCase()
              .contains(query))) {
        items.add(_EventCard(event: event, store: widget.store));
      }
    }
    if (_filter == 'All' || _filter == 'Clubs') {
      for (final club in demoClubs.where(
          (c) => '${c.name} ${c.category}'.toLowerCase().contains(query))) {
        items.add(_ClubCard(club: club, store: widget.store));
      }
    }
    if (_filter == 'All' || _filter == 'Updates') {
      for (final notice in demoAnnouncements.where(
          (a) => '${a.title} ${a.category}'.toLowerCase().contains(query))) {
        items.add(_AnnouncementCard(item: notice, store: widget.store));
      }
    }
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _DemoEyebrow('DISCOVER GCTU'),
                    const SizedBox(height: 5),
                    Text(
                      'Find your next thing.',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -.6,
                              ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      'Events, communities and campus updates picked for you.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 19),
                    TextField(
                      controller: _search,
                      onChanged: (value) => setState(() => _query = value),
                      decoration: InputDecoration(
                        hintText: 'Search campus life',
                        prefixIcon: const Icon(Icons.search_rounded),
                        filled: true,
                        fillColor: Theme.of(context)
                            .colorScheme
                            .surfaceContainerLowest,
                        contentPadding:
                            const EdgeInsets.symmetric(vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide:
                              BorderSide(color: Colors.blueGrey.shade50),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide:
                              BorderSide(color: Colors.blueGrey.shade50),
                        ),
                      ),
                    ),
                    const SizedBox(height: 13),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (final label in [
                            'All',
                            'Events',
                            'Clubs',
                            'Updates'
                          ])
                            Padding(
                              padding: const EdgeInsets.only(right: 8),
                              child: ChoiceChip(
                                label: Text(label),
                                selected: _filter == label,
                                onSelected: (_) =>
                                    setState(() => _filter = label),
                                selectedColor:
                                    Theme.of(context).colorScheme.primary,
                                labelStyle: TextStyle(
                                  color: _filter == label
                                      ? Theme.of(context).colorScheme.onPrimary
                                      : Theme.of(context).colorScheme.onSurface,
                                  fontWeight: FontWeight.w700,
                                ),
                                showCheckmark: false,
                                side: BorderSide.none,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (items.isEmpty)
              const SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                    child: Text('No matching demo items. Try another search.')),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
                sliver: SliverList.separated(
                  itemCount: items.length,
                  itemBuilder: (context, index) => items[index],
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MessagesScreen extends StatelessWidget {
  const _MessagesScreen({required this.store});

  final DemoStore store;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _DemoEyebrow('YOUR PEOPLE'),
                    const SizedBox(height: 5),
                    Text(
                      'Messages',
                      style:
                          Theme.of(context).textTheme.headlineSmall?.copyWith(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontWeight: FontWeight.w800,
                              ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'A few conversations from around your campus.',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                    const SizedBox(height: 17),
                    Container(
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: const LinearGradient(
                          colors: [CampusColors.primary, Color(0xFF3163BF)],
                        ),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.chat_bubble_rounded,
                              color: CampusColors.accent),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Demo conversations',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          Text(
                            'LOCAL ONLY',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              letterSpacing: .7,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
              sliver: SliverList.separated(
                itemCount: demoMessages.length,
                itemBuilder: (context, index) => _ConversationTile(
                  message: demoMessages[index],
                  store: store,
                ),
                separatorBuilder: (context, index) => const SizedBox(height: 9),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

void _openDemoFeature(BuildContext context, Widget screen) {
  Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => screen));
}

class DemoMoreScreen extends StatelessWidget {
  const DemoMoreScreen(
      {super.key,
      required this.store,
      required this.onLogout,
      required this.onProfile});
  final DemoStore store;
  final VoidCallback onLogout;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 22, 20, 30),
            children: [
              const _DemoEyebrow('YOUR CAMPUS ACCOUNT'),
              const SizedBox(height: 5),
              Text('More',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 18),
              InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: onProfile,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [CampusColors.primaryDark, CampusColors.primary],
                    ),
                  ),
                  child: AnimatedBuilder(
                    animation: store,
                    builder: (context, _) => Row(children: [
                      _DemoProfileAvatar(
                          photoDataUrl: store.profilePhoto, radius: 30),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(store.profileName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800)),
                            SizedBox(height: 4),
                            Text('${store.profileLevel} · GCTU',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: Colors.white70, fontSize: 13)),
                            SizedBox(height: 8),
                            _DemoPillLight(),
                          ],
                        ),
                      ),
                      const Icon(Icons.edit_outlined, color: Colors.white70),
                    ]),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const _SectionHeading(
                  title: 'Student tools',
                  subtitle: 'Quick links to services outside the main tabs'),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.8,
                children: [
                  _MoreQuickAction(
                      icon: Icons.storefront_rounded,
                      title: 'Marketplace',
                      color: const Color(0xFF008577),
                      onTap: () =>
                          _openDemoFeature(context, const DemoMarketScreen())),
                  _MoreQuickAction(
                      icon: Icons.home_work_rounded,
                      title: 'Hostels',
                      color: const Color(0xFF9B5C20),
                      onTap: () =>
                          _openDemoFeature(context, const DemoHostelsScreen())),
                  _MoreQuickAction(
                      icon: Icons.checklist_rounded,
                      title: 'My tasks',
                      color: const Color(0xFF7A52B3),
                      onTap: () => _openDemoFeature(
                          context, DemoTasksScreen(store: store))),
                  _MoreQuickAction(
                      icon: Icons.calendar_month_rounded,
                      title: 'Timetable',
                      color: const Color(0xFFB26724),
                      onTap: () => _openDemoFeature(
                          context, DemoTimetableScreen(store: store))),
                ],
              ),
              const SizedBox(height: 18),
              const _SectionHeading(
                  title: 'Browse all',
                  subtitle: 'More tools and campus services'),
              const SizedBox(height: 8),
              _MoreCategory(
                  icon: Icons.explore_rounded,
                  title: 'Campus life',
                  subtitle: 'Orientation and first-week help',
                  children: [
                    _MoreRow(
                        icon: Icons.waving_hand_rounded,
                        title: 'Freshers Hub',
                        subtitle: 'Campus orientation and a starter checklist',
                        onTap: () => _openDemoFeature(
                            context, DemoFreshersHubScreen(store: store))),
                  ]),
              _MoreCategory(
                  icon: Icons.school_rounded,
                  title: 'Study tools',
                  subtitle: 'Plan your learning and keep resources close',
                  children: [
                    _MoreRow(
                        icon: Icons.route_rounded,
                        title: 'Presentation tour',
                        subtitle: 'Walk through the student journey',
                        onTap: () => _openDemoFeature(
                            context,
                            DemoPresentationTourScreen(store: store))),
                    _MoreRow(
                        icon: Icons.auto_stories_rounded,
                        title: 'Learning materials',
                        subtitle: 'Browse course notes and revision resources',
                        onTap: () => _openDemoFeature(
                            context, DemoMaterialsScreen(store: store))),
                    _MoreRow(
                        icon: Icons.auto_awesome_rounded,
                        title: 'Study assistant',
                        subtitle: 'Try offline explanations and revision tools',
                        onTap: () => _openDemoFeature(
                            context, const DemoStudyAssistantScreen())),
                  _MoreRow(
                      icon: Icons.school_rounded,
                      title: 'Study hub',
                      subtitle: 'Courses, focus timer and flashcard review',
                      onTap: () => _openDemoFeature(
                          context, const DemoStudyHubScreen())),
                    _MoreRow(
                        icon: Icons.calculate_rounded,
                        title: 'GPA calculator & planner',
                        subtitle: 'Estimate grades and plan a CGPA target',
                        onTap: () => _openDemoFeature(
                            context, const GpaPlannerScreen())),
                    _MoreRow(
                        icon: Icons.calendar_month_rounded,
                        title: 'Calendar',
                        subtitle: 'See tasks and campus events by date',
                        onTap: () => _openDemoFeature(
                            context, DemoCalendarScreen(store: store))),
                    _MoreRow(
                        icon: Icons.qr_code_scanner_rounded,
                        title: 'Attendance & check-in',
                        subtitle: 'Demo campus check-in information',
                        onTap: () => _openDemoFeature(
                            context, DemoAttendanceScreen(store: store))),
                    _MoreRow(
                        icon: Icons.folder_copy_outlined,
                        title: 'Student documents',
                        subtitle: 'Quick access to useful student records',
                        onTap: () => _openDemoFeature(
                            context, DemoStudentDocumentsScreen(store: store))),
                  ]),
              _MoreCategory(
                  icon: Icons.home_work_rounded,
                  title: 'Campus services',
                  subtitle: 'Student support and class tools',
                  children: [
                    _MoreRow(
                        icon: Icons.find_in_page_rounded,
                        title: 'Lost & found',
                        subtitle: 'Browse sample items or add a local report',
                        onTap: () => _openDemoFeature(
                            context, const DemoLostFoundScreen())),
                    _MoreRow(
                        icon: Icons.school_outlined,
                        title: 'Course Rep Portal',
                        subtitle: 'Manage information for your assigned class',
                        onTap: () => _openDemoFeature(
                            context, const DemoClassRepScreen())),
                  ]),
              _MoreCategory(
                  icon: Icons.play_circle_outline_rounded,
                  title: 'Campus stories',
                  subtitle: 'News, interviews, podcasts and event coverage',
                  children: [
                    _MoreRow(
                        icon: Icons.movie_creation_outlined,
                        title: 'School Media',
                        subtitle: 'Explore stories and media from campus',
                        onTap: () => _openDemoFeature(
                            context, DemoSchoolMediaScreen(store: store))),
                  ]),
              _MoreCategory(
                  icon: Icons.person_rounded,
                  title: 'My account',
                  subtitle: 'Saved events and achievements',
                  children: [
                    _MoreRow(
                        icon: Icons.bookmark_border_rounded,
                        title: 'Saved events',
                        subtitle: 'Your shortlist for the week',
                        onTap: () => _openDemoFeature(
                            context, DemoSavedEventsScreen(store: store))),
                    _MoreRow(
                        icon: Icons.verified_outlined,
                        title: 'Achievements',
                        subtitle: 'Celebrate your campus moments',
                        onTap: () => _openDemoFeature(
                            context, DemoAchievementsScreen(store: store))),
                  ]),
              _MoreCategory(
                  icon: Icons.info_outline_rounded,
                  title: 'About & support',
                  subtitle: 'Information about this CampusOne preview',
                  children: [
                    _MoreRow(
                        icon: Icons.info_outline_rounded,
                        title: 'About this demo',
                        subtitle: 'All information is sample data',
                        onTap: () => _showSimpleSheet(
                            context,
                            'About this demo',
                            'CampusOne is a student-life presentation for Ghana Communication Technology University. It runs offline with sample data. Changes are temporary and stored only in memory.')),
                  ]),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                  onPressed: () => _confirmLogout(context, onLogout),
                  icon: const Icon(Icons.logout_rounded),
                  label: const Text('Log out of demo'),
                  style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      foregroundColor: const Color(0xFF9B3434),
                      side: const BorderSide(color: Color(0xFFE9C9C9)))),
              const SizedBox(height: 14),
              Center(
                  child: Text('CampusOne | GCTU demo',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 11))),
            ],
          ),
        ),
      );
}

class _MoreCategory extends StatelessWidget {
  const _MoreCategory(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.children});
  final IconData icon;
  final String title, subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Card(
        margin: const EdgeInsets.only(bottom: 10),
        clipBehavior: Clip.antiAlias,
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
          childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
          leading: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: Theme.of(context).colorScheme.primary)),
          title: Text(title,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w800,
                  fontSize: 15)),
          subtitle: Text(subtitle,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 12)),
          children: children,
        ),
      );
}

class _MoreQuickAction extends StatelessWidget {
  const _MoreQuickAction(
      {required this.icon,
      required this.title,
      required this.color,
      required this.onTap});
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                    color: color.withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 21),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Text(title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: Theme.of(context).colorScheme.onSurface)),
              ),
              const Icon(Icons.chevron_right_rounded,
                  size: 19, color: Color(0xFF8A96A8)),
            ]),
          ),
        ),
      );
}

class _EventCard extends StatelessWidget {
  const _EventCard(
      {required this.event, required this.store, this.compact = false});

  final DemoEvent event;
  final DemoStore store;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final going = store.isGoing(event.id);
        final saved = store.isSaved(event.id);
        return Container(
          width: compact ? 265 : null,
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(21),
            border:
                Border.all(color: Theme.of(context).colorScheme.outlineVariant),
            boxShadow: const [
              BoxShadow(
                  color: Color(0x090B2545),
                  blurRadius: 18,
                  offset: Offset(0, 7)),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: () => _openEvent(context, event, store),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: compact ? 88 : 116,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: event.colors,
                    ),
                  ),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(_eventPhoto(event.id),
                          fit: BoxFit.cover, alignment: Alignment.center),
                      DecoratedBox(
                          decoration: BoxDecoration(
                              gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                            Colors.black.withValues(alpha: .28),
                            ...event.colors
                                .map((color) => color.withValues(alpha: .52))
                          ]))),
                      Positioned(
                        right: 14,
                        top: -16,
                        child: Icon(event.icon,
                            size: 110,
                            color: Colors.white.withValues(alpha: .13)),
                      ),
                      Positioned(
                        left: 14,
                        top: 13,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 9, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .19),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            event.category.toUpperCase(),
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: .6),
                          ),
                        ),
                      ),
                      Positioned(
                        right: 11,
                        top: 9,
                        child: IconButton(
                          visualDensity: VisualDensity.compact,
                          onPressed: () => store.toggleSaved(event.id),
                          icon: Icon(
                              saved
                                  ? Icons.bookmark_rounded
                                  : Icons.bookmark_border_rounded,
                              color: Colors.white),
                          tooltip: saved ? 'Remove saved event' : 'Save event',
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 11, 14, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(event.date,
                                style: TextStyle(
                                    color:
                                        Theme.of(context).colorScheme.primary,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 9,
                                    letterSpacing: .65)),
                            const SizedBox(height: 4),
                            Text(event.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color:
                                        Theme.of(context).colorScheme.onSurface,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('${event.time} | ${event.venue}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    color: Color(0xFF6F7D91), fontSize: 10)),
                          ],
                        ),
                      ),
                      if (!compact) ...[
                        const SizedBox(width: 8),
                        Icon(
                            going
                                ? Icons.check_circle_rounded
                                : Icons.arrow_forward_rounded,
                            color: going
                                ? const Color(0xFF16816C)
                                : CampusColors.primary,
                            size: 20),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ClubCard extends StatelessWidget {
  const _ClubCard({required this.club, required this.store});

  final DemoClub club;
  final DemoStore store;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          final status = store.clubMembership(club.id);
          final joined = status == 'member';
          final pending = status == 'pending';
          final image = switch (club.id) {
            'acs' => 'assets/demo/gctu-students-1.jpg',
            'robotics' => 'assets/demo/gctu-students-2.jpg',
            'film-society' => 'assets/demo/gctu-students-3.jpg',
            _ => 'assets/demo/gctu-students-together.jpg',
          };
          return Card(
            clipBehavior: Clip.antiAlias,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: Stack(fit: StackFit.expand, children: [
                    Image.asset(image,
                        fit: BoxFit.cover, alignment: Alignment.center),
                    DecoratedBox(
                        decoration: BoxDecoration(
                            gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                          club.color.withValues(alpha: .05),
                          club.color.withValues(alpha: .62)
                        ]))),
                    Positioned(
                        left: 14,
                        bottom: 12,
                        child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: .94),
                                borderRadius: BorderRadius.circular(18)),
                            child: Text(club.category.toUpperCase(),
                                style: TextStyle(
                                    color: club.color,
                                    fontSize: 9,
                                    letterSpacing: .6,
                                    fontWeight: FontWeight.w800)))),
                    Positioned(
                        right: 12,
                        top: 12,
                        child: CircleAvatar(
                            backgroundColor:
                                Colors.white.withValues(alpha: .95),
                            child: Icon(club.icon, color: club.color))),
                  ])),
              Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                  child: Row(children: [
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text(club.name,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(
                              '${club.members} students  |  ${club.description}',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: Color(0xFF738096),
                                  fontSize: 10,
                                  height: 1.3)),
                        ])),
                    const SizedBox(width: 6),
                    FilledButton.tonalIcon(
                        onPressed: pending
                            ? null
                            : () {
                                if (joined) {
                                  store.leaveClub(club.id);
                                } else {
                                  final approval = club.id == 'robotics' ||
                                      club.id == 'entrepreneurs';
                                  store.requestClubMembership(club.id,
                                      approvalRequired: approval);
                                }
                              },
                        icon: Icon(
                            joined ? Icons.check_rounded : Icons.add_rounded,
                            size: 16),
                        label: Text(joined
                            ? 'Member'
                            : pending
                                ? 'Pending'
                                : (club.id == 'robotics' ||
                                        club.id == 'entrepreneurs'
                                    ? 'Request'
                                    : 'Join'))),
                  ])),
            ]),
          );
        },
      );
}

String _eventPhoto(String id) => switch (id) {
      'techx' => 'assets/demo/gctu-students-1.jpg',
      'akwaaba' => 'assets/demo/gctu-students-together.jpg',
      'career' => 'assets/demo/gctu-students-2.jpg',
      _ => 'assets/demo/gctu-students-3.jpg',
    };

class _AnnouncementCard extends StatelessWidget {
  const _AnnouncementCard({required this.item, required this.store});

  final DemoAnnouncement item;
  final DemoStore store;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final read = store.isRead(item.title);
        return Material(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () {
              store.markRead(item.title);
              _showAnnouncement(context, item);
            },
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                      color: Theme.of(context).colorScheme.outlineVariant)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 43,
                    height: 43,
                    decoration: BoxDecoration(
                        color: read
                            ? const Color(0xFFF0F3F8)
                            : const Color(0xFFFFF3CF),
                        borderRadius: BorderRadius.circular(14)),
                    child: Icon(item.icon,
                        color: read
                            ? const Color(0xFF77859B)
                            : const Color(0xFF986700),
                        size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                                child: Text(item.category.toUpperCase(),
                                    style: const TextStyle(
                                        color: Color(0xFF967000),
                                        fontSize: 9,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: .65))),
                            if (!read)
                              Container(
                                  width: 7,
                                  height: 7,
                                  decoration: BoxDecoration(
                                      color:
                                          Theme.of(context).colorScheme.primary,
                                      shape: BoxShape.circle)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(item.title,
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontSize: 13,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(item.date,
                            style: TextStyle(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                                fontSize: 10)),
                        const SizedBox(height: 6),
                        Text(item.body,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                                fontSize: 11,
                                height: 1.4)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 5),
                  const Icon(Icons.chevron_right_rounded,
                      color: Color(0xFF9AA5B4), size: 18),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _ConversationTile extends StatelessWidget {
  const _ConversationTile({required this.message, required this.store});

  final DemoMessage message;
  final DemoStore store;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) =>
              _DemoConversationScreen(message: message, store: store),
        )),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                  color: Theme.of(context).colorScheme.outlineVariant)),
          child: Row(
            children: [
              CircleAvatar(
                radius: 25,
                backgroundColor: message.color.withValues(alpha: .13),
                child: Text(message.initials,
                    style: TextStyle(
                        color: message.color, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(message.name,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 14)),
                    const SizedBox(height: 5),
                    Text(message.preview,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(message.time,
                      style: const TextStyle(
                          color: Color(0xFF8995A7), fontSize: 9)),
                  const SizedBox(height: 7),
                  if (message.unread)
                    Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DemoConversationScreen extends StatefulWidget {
  const _DemoConversationScreen({required this.message, required this.store});

  final DemoMessage message;
  final DemoStore store;

  @override
  State<_DemoConversationScreen> createState() =>
      _DemoConversationScreenState();
}

class _DemoConversationScreenState extends State<_DemoConversationScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _send() {
    widget.store.addLocalReply(_controller.text);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
                backgroundColor: widget.message.color.withValues(alpha: .14),
                child: Text(widget.message.initials,
                    style: TextStyle(
                        color: widget.message.color,
                        fontSize: 12,
                        fontWeight: FontWeight.w800))),
            const SizedBox(width: 10),
            Text(widget.message.name,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: AnimatedBuilder(
              animation: widget.store,
              builder: (context, _) => ListView(
                padding: const EdgeInsets.all(18),
                children: [
                  const _LocalNotice(
                      text: 'This conversation is part of the offline demo.'),
                  const SizedBox(height: 18),
                  _ChatBubble(
                      text: 'Hey Ama! Hope your week is going well.',
                      mine: false),
                  _ChatBubble(text: widget.message.preview, mine: false),
                  _ChatBubble(
                      text: 'Yes, I plan to attend. See you on campus!',
                      mine: true),
                  for (final reply in widget.store.localReplies)
                    _ChatBubble(text: reply, mine: true),
                ],
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 12),
              child: Row(
                children: [
                  Expanded(
                      child: TextField(
                          controller: _controller,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(),
                          decoration: InputDecoration(
                              hintText: 'Write a demo reply',
                              filled: true,
                              fillColor: Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHigh,
                              contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 13)))),
                  const SizedBox(width: 8),
                  IconButton.filled(
                      onPressed: _send,
                      icon: const Icon(Icons.send_rounded),
                      tooltip: 'Send locally'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.text, required this.mine});

  final String text;
  final bool mine;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints:
            BoxConstraints(maxWidth: MediaQuery.sizeOf(context).width * .78),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        decoration: BoxDecoration(
          color: mine
              ? Theme.of(context).colorScheme.primary
              : Theme.of(context).colorScheme.surfaceContainerHigh,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(17),
            topRight: const Radius.circular(17),
            bottomLeft: Radius.circular(mine ? 17 : 4),
            bottomRight: Radius.circular(mine ? 4 : 17),
          ),
        ),
        child: Text(text,
            style: TextStyle(
                color: mine
                    ? Theme.of(context).colorScheme.onPrimary
                    : Theme.of(context).colorScheme.onSurface,
                fontSize: 13,
                height: 1.35)),
      ),
    );
  }
}

class _LocalNotice extends StatelessWidget {
  const _LocalNotice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) => Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
              color: const Color(0xFFFFF1C1),
              borderRadius: BorderRadius.circular(18)),
          child: Text(text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Color(0xFF806000),
                  fontSize: 10,
                  fontWeight: FontWeight.w600)),
        ),
      );
}

class _MetricCard extends StatelessWidget {
  const _MetricCard(
      {required this.icon,
      required this.value,
      required this.label,
      required this.tint,
      required this.color,
      required this.onTap});

  final IconData icon;
  final String value;
  final String label;
  final Color tint;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dark = scheme.brightness == Brightness.dark;
    final metricColor = dark ? scheme.primary : color;
    return Material(
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(19),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(19),
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 12, 8, 12),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(19),
              border: Border.all(color: scheme.outlineVariant)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                  width: 29,
                  height: 29,
                  decoration: BoxDecoration(
                      color: dark ? scheme.surfaceContainerHighest : tint,
                      borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, size: 17, color: metricColor)),
              const SizedBox(height: 9),
              Text(value,
                  style: TextStyle(
                      color: metricColor,
                      fontSize: 20,
                      height: 1,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 5),
              Text(label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 9,
                      fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeading extends StatelessWidget {
  const _SectionHeading(
      {required this.title, this.subtitle, this.action, this.onAction});

  final String title;
  final String? subtitle;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -.25)),
              if (subtitle != null) ...[
                const SizedBox(height: 3),
                Text(subtitle!,
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 10)),
              ],
            ],
          ),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: const Size(0, 30),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap),
            child: Text(action!,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w800,
                    fontSize: 11)),
          ),
      ],
    );
  }
}

class _DemoEyebrow extends StatelessWidget {
  const _DemoEyebrow(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Text(text,
      style: TextStyle(
          color: Theme.of(context).colorScheme.primary,
          fontSize: 10,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.2));
}

class _DemoPillLight extends StatelessWidget {
  const _DemoPillLight();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
          color: CampusColors.accent, borderRadius: BorderRadius.circular(18)),
      child: Text('GCTU CAMPUS',
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: .6)),
    );
  }
}

class _LogoMark extends StatelessWidget {
  const _LogoMark({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        padding: const EdgeInsets.all(2),
        decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient:
                LinearGradient(colors: [Color(0xFFFFD84D), Color(0xFFEEA900)])),
        child: ClipOval(
            child: Image.asset('assets/icon/SRCLogo.png', fit: BoxFit.cover)),
      );
}

class _RoundAction extends StatelessWidget {
  const _RoundAction(
      {required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => IconButton(
        onPressed: onTap,
        tooltip: label,
        style: IconButton.styleFrom(
            backgroundColor: Theme.of(context).colorScheme.surfaceContainerHigh,
            foregroundColor: Theme.of(context).colorScheme.onSurface,
            fixedSize: const Size(42, 42)),
        icon: Icon(icon, size: 21),
      );
}

class _NotificationButton extends StatelessWidget {
  const _NotificationButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Stack(
        clipBehavior: Clip.none,
        children: [
          _RoundAction(
              icon: Icons.notifications_none_rounded,
              label: 'Campus notes',
              onTap: onTap),
          if (count > 0)
            Positioned(
              right: -1,
              top: -1,
              child: Container(
                width: 17,
                height: 17,
                decoration: BoxDecoration(
                    color: const Color(0xFFC03939),
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: Theme.of(context).scaffoldBackgroundColor,
                        width: 1.5)),
                child: Center(
                    child: Text('$count',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.w800))),
              ),
            ),
        ],
      );
}

class _MoreRow extends StatelessWidget {
  const _MoreRow(
      {required this.icon,
      required this.title,
      required this.subtitle,
      required this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        margin: const EdgeInsets.only(bottom: 9),
        child: ListTile(
          onTap: onTap,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
          leading: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(13)),
              child: Icon(icon,
                  color: Theme.of(context).colorScheme.primary, size: 21)),
          title: Text(title,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w700,
                  fontSize: 13)),
          subtitle: Text(subtitle,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 10)),
          trailing:
              const Icon(Icons.chevron_right_rounded, color: Color(0xFF95A1B0)),
        ),
      );
}

void _openEvent(BuildContext context, DemoEvent event, DemoStore store) {
  Navigator.of(context).push(MaterialPageRoute<void>(
    builder: (_) => _EventDetailScreen(event: event, store: store),
  ));
}

class _EventDetailScreen extends StatelessWidget {
  const _EventDetailScreen({required this.event, required this.store});

  final DemoEvent event;
  final DemoStore store;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Event details')),
      body: AnimatedBuilder(
        animation: store,
        builder: (context, _) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 6, 20, 28),
          children: [
            Container(
              height: 205,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: event.colors),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  Positioned(
                      right: -5,
                      bottom: -20,
                      child: Icon(event.icon,
                          size: 190,
                          color: Colors.white.withValues(alpha: .15))),
                  Positioned(left: 20, bottom: 20, child: _DemoPillLight()),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _DemoEyebrow(event.category.toUpperCase()),
            const SizedBox(height: 6),
            Text(event.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            _DetailLine(icon: Icons.calendar_month_rounded, label: event.date),
            _DetailLine(icon: Icons.schedule_rounded, label: event.time),
            _DetailLine(icon: Icons.location_on_outlined, label: event.venue),
            const SizedBox(height: 18),
            Text(event.description,
                style: Theme.of(context)
                    .textTheme
                    .bodyLarge
                    ?.copyWith(height: 1.55, color: const Color(0xFF56657B))),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => store.toggleRsvp(event.id),
              icon: Icon(store.isGoing(event.id)
                  ? Icons.check_circle_rounded
                  : Icons.event_available_rounded),
              label: Text(store.isGoing(event.id)
                  ? 'You are going | tap to cancel'
                  : 'Count me in'),
              style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(54)),
            ),
            const SizedBox(height: 9),
            OutlinedButton.icon(
              onPressed: () => store.toggleSaved(event.id),
              icon: Icon(store.isSaved(event.id)
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded),
              label: Text(store.isSaved(event.id)
                  ? 'Saved to your list'
                  : 'Save for later'),
              style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50)),
            ),
            const SizedBox(height: 14),
            const _LocalNotice(
                text:
                    'Sample event details. Demo actions stay on this device.'),
          ],
        ),
      ),
    );
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(children: [
          Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
              child: Text(label,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)))
        ]),
      );
}

void _showAnnouncements(BuildContext context, DemoStore store) {
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Campus notes',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 20,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 5),
            Text('A few updates from around GCTU.',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 12)),
            const SizedBox(height: 14),
            for (final item in demoAnnouncements.take(3)) ...[
              _AnnouncementCard(item: item, store: store),
              const SizedBox(height: 9),
            ],
          ],
        ),
      ),
    ),
  );
}

void _showAnnouncement(BuildContext context, DemoAnnouncement item) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DemoEyebrow(
                '${item.category.toUpperCase()} | ${item.date.toUpperCase()}'),
            const SizedBox(height: 9),
            Text(item.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Text(item.body,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 14,
                    height: 1.55)),
            const SizedBox(height: 16),
            const _LocalNotice(
                text: 'Presentation sample | not a live university notice.'),
          ],
        ),
      ),
    ),
  );
}

void _showSimpleSheet(BuildContext context, String title, String body) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 12),
            Text(body,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 14,
                    height: 1.55)),
          ],
        ),
      ),
    ),
  );
}

Future<void> _confirmLogout(BuildContext context, VoidCallback onLogout) async {
  final confirm = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Leave the demo?'),
      content: const Text(
          'You can come back in with one tap. Your demo changes will reset when you restart the app.'),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Stay here')),
        FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Log out')),
      ],
    ),
  );
  if (confirm == true && context.mounted) onLogout();
}

String _greeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'MORNING';
  if (hour < 17) return 'AFTERNOON';
  return 'EVENING';
}

String _firstName(String fullName) {
  final value = fullName.trim();
  return value.isEmpty ? 'STUDENT' : value.split(RegExp(r'\s+')).first;
}

class _DemoProfileAvatar extends StatelessWidget {
  const _DemoProfileAvatar({
    required this.photoDataUrl,
    required this.radius,
  });

  final String? photoDataUrl;
  final double radius;

  @override
  Widget build(BuildContext context) {
    ImageProvider<Object> image =
        const AssetImage('assets/demo/ama-demo-profile.jpg');
    if (photoDataUrl case final value? when value.startsWith('data:')) {
      final comma = value.indexOf(',');
      if (comma >= 0) {
        try {
          image = MemoryImage(base64Decode(value.substring(comma + 1)));
        } on FormatException {
          // Use the bundled demo portrait if the saved photo is invalid.
        }
      }
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      backgroundImage: image,
      onBackgroundImageError: (_, __) {},
      child: null,
    );
  }
}
