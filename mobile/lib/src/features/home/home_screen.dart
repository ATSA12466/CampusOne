import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/links/app_links.dart';
import '../../core/media/media.dart';
import '../../core/util/campus_date.dart';
import '../../core/widgets/states.dart';
import '../attendance/attendance_history_screen.dart';
import '../attendance/attendance_repository.dart';
import '../attendance/scan_screen.dart';
import '../badges/badges_repository.dart';
import '../badges/badges_screen.dart';
import '../catalog/accommodation_screen.dart';
import '../catalog/announcements_screen.dart';
import '../catalog/catalog_repository.dart';
import '../catalog/materials_screen.dart';
import '../clubs/clubs_screen.dart';
import '../community/community_screen.dart';
import '../discover/discover_screen.dart';
import '../events/event_detail_screen.dart';
import '../events/events_screen.dart';
import '../listings/marketplace_screen.dart';
import '../listings/opportunities_screen.dart';
import '../notifications/notifications_repository.dart';
import '../notifications/notifications_screen.dart';
import '../schedule/schedule_repository.dart';
import '../schedule/timetable_screen.dart';
import '../tasks/tasks_repository.dart';
import '../tasks/tasks_screen.dart';
import 'widgets/home_cards.dart';

/// Home mirrors the web composition: photo-first hero, campus radar carousel,
/// today's plan, photo shortcuts, then recommendations — all from the shared
/// API, with public content still visible when signed out.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<_HomeData>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_HomeData> _load() async {
    final api = SessionScope.apiOf(context);
    final session = SessionScope.sessionOf(context);
    final catalog = CatalogRepository(api);
    final schedule = ScheduleRepository(api);

    final events = await catalog.events();
    final announcements = await catalog.announcements();
    final clubs = await catalog.clubs();

    var featured = const <FeaturedItem>[];
    try {
      featured = await catalog.featured();
    } catch (_) {
      // The carousel is optional; the rest of home still renders.
    }

    var sessions = const <ClassSession>[];
    try {
      final catalogSessions = await schedule.catalogSessions();
      final mine = session.signedIn
          ? await schedule.myClasses()
          : const <ClassSession>[];
      final merged = <String, ClassSession>{
        for (final item in catalogSessions) item.id: item,
        for (final item in mine) item.id: item,
      };
      sessions = merged.values.toList();
    } catch (_) {
      // Timetable unavailable: the overview card says so instead of pretending.
    }

    var tasks = const <TaskItem>[];
    var unread = 0;
    var badgeCount = 0;
    var checkins = 0;
    if (session.signedIn) {
      try {
        tasks = await TasksRepository(api).list();
      } catch (_) {
        // Same: private panels stay empty rather than faking data.
      }
      try {
        unread = (await NotificationsRepository(api).feed()).unread;
      } catch (_) {}
      try {
        badgeCount = (await BadgesRepository(api).mine()).length;
        checkins = (await AttendanceRepository(api).myRecords())
            .where((record) => record.status == 'present')
            .length;
      } catch (_) {}
    }

    return _HomeData(
      featured: featured,
      clubs: clubs.items,
      events: events.items,
      announcements: announcements.items,
      sessions: sessions,
      tasks: tasks,
      unread: unread,
      badgeCount: badgeCount,
      checkins: checkins,
      now: campusNow(),
    );
  }

  Future<void> _reload() async {
    final future = _load();
    if (!mounted) return;
    setState(() => _future = future);
    try {
      await future;
    } catch (_) {
      // FutureBuilder surfaces the error; refresh only waits for completion.
    }
  }

  void _open(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  Future<void> _openPortal(InstitutionalLink link) =>
      openExternalLink(context, link.url);

  void _openFeatured(FeaturedItem item) {
    switch (item.destination) {
      case final path when path.startsWith('/clubs'):
        _open(const ClubsScreen());
      case final path when path.startsWith('/events'):
        _open(const EventsScreen());
      case final path when path.startsWith('/opportunities'):
        _open(const OpportunitiesScreen());
      case final path when path.startsWith('/marketplace'):
        _open(const MarketplaceScreen());
      case final path when path.startsWith('/accommodation'):
        _open(const AccommodationScreen());
      case final path when path.startsWith('/announcements'):
        _open(const AnnouncementsScreen());
      case final path when path.startsWith('/academics'):
        _open(const MaterialsScreen());
      default:
        _open(const DiscoverScreen());
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final user = session.user;
    return Scaffold(
      appBar: AppBar(
        title: const Text('CampusOne'),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => _open(const NotificationsScreen()),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_HomeData>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, data) => ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              children: [
                WelcomeHeader(
                  greeting: user == null
                      ? 'Welcome to campus.'
                      : 'Hi, ${user.name.split(' ').first}.',
                  now: data.now,
                  signedIn: session.signedIn,
                ),
                const SizedBox(height: 20),
                if (data.featured.isNotEmpty) ...[
                  FeaturedCarousel(
                    items: data.featured,
                    onOpen: _openFeatured,
                  ),
                  const SizedBox(height: 20),
                ],
                ClubsHeroCard(
                  clubCount: data.clubs.length,
                  onOpen: () => _open(const ClubsScreen()),
                ),
                const SizedBox(height: 16),
                CheckInBanner(onScan: () => _open(const ScanScreen())),
                const SizedBox(height: 16),
                if (session.signedIn) ...[
                  StatsRow(
                    checkins: data.checkins,
                    badgeCount: data.badgeCount,
                    unread: data.unread,
                    onCheckins: () => _open(const AttendanceHistoryScreen()),
                    onBadges: () => _open(const BadgesScreen()),
                    onUnread: () => _open(const NotificationsScreen()),
                  ),
                  const SizedBox(height: 16),
                ],
                TodayOverviewCard(
                  sessions: data.sessions,
                  tasks: data.tasks,
                  now: data.now,
                  signedIn: session.signedIn,
                  onTimetable: () => _open(const TimetableScreen()),
                  onTasks: () => _open(const TasksScreen()),
                ),
                const SizedBox(height: 24),
                SectionHeader(
                  eyebrow: 'Make it your campus',
                  title: 'A different kind of shortcut.',
                ),
                const SizedBox(height: 12),
                QuickActionsRow(
                  actions: [
                    QuickAction(
                      title: 'Events',
                      description: 'Be part of the moment',
                      icon: Icons.celebration_outlined,
                      image: DemoImages.innovationNight,
                      onTap: () => _open(const EventsScreen()),
                    ),
                    QuickAction(
                      title: 'Learn',
                      description: 'A little head start',
                      icon: Icons.menu_book_outlined,
                      image: DemoImages.studyCorner,
                      onTap: () => _open(const MaterialsScreen()),
                    ),
                    QuickAction(
                      title: 'Opportunities',
                      description: 'Your next chapter',
                      icon: Icons.rocket_launch_outlined,
                      image: DemoImages.campusLife,
                      onTap: () => _open(const OpportunitiesScreen()),
                    ),
                    QuickAction(
                      title: 'Find a room',
                      description: 'Make yourself at home',
                      icon: Icons.home_work_outlined,
                      image: DemoImages.campusLiving,
                      onTap: () => _open(const AccommodationScreen()),
                    ),
                    QuickAction(
                      title: 'Marketplace',
                      description: 'Good finds, closer',
                      icon: Icons.storefront_outlined,
                      image: DemoImages.campusMarket,
                      onTap: () => _open(const MarketplaceScreen()),
                    ),
                    QuickAction(
                      title: 'Discover',
                      description: 'Take a different turn',
                      icon: Icons.explore_outlined,
                      image: DemoImages.clubsHero,
                      onTap: () => _open(const DiscoverScreen()),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                InstitutionalLinksCard(onOpen: _openPortal),
                const SizedBox(height: 24),
                if (data.events.isNotEmpty) ...[
                  EventFeatureCard(
                    event: data.events.first,
                    now: data.now,
                    onOpen: () => _open(
                      EventDetailScreen(eventId: data.events.first.id),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                SectionHeader(
                  title: 'Upcoming events',
                  onSeeAll: () => _open(const EventsScreen()),
                ),
                const SizedBox(height: 8),
                if (data.events.isEmpty)
                  const EmptyView(
                    title: 'No events yet',
                    message: 'New campus events will appear here.',
                    icon: Icons.event_outlined,
                  )
                else
                  for (final event in data.events.take(4))
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: EventRow(
                        event: event,
                        onTap: () => _open(EventDetailScreen(eventId: event.id)),
                      ),
                    ),
                const SizedBox(height: 16),
                SectionHeader(
                  title: 'Announcements',
                  onSeeAll: () => _open(const AnnouncementsScreen()),
                ),
                const SizedBox(height: 8),
                for (final item in data.announcements.take(3))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: AnnouncementRow(
                      item: item,
                      onTap: () => _open(const AnnouncementsScreen()),
                    ),
                  ),
                const SizedBox(height: 16),
                SectionHeader(title: 'Explore'),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.forum_outlined, size: 18),
                      label: const Text('Community'),
                      onPressed: () => _open(const CommunityScreen()),
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.schedule_outlined, size: 18),
                      label: const Text('Timetable'),
                      onPressed: () => _open(const TimetableScreen()),
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.check_circle_outlined, size: 18),
                      label: const Text('Tasks'),
                      onPressed: () => _open(const TasksScreen()),
                    ),
                    ActionChip(
                      avatar: const Icon(Icons.how_to_reg_outlined, size: 18),
                      label: const Text('Participation'),
                      onPressed: () => _open(const AttendanceHistoryScreen()),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _HomeData {
  _HomeData({
    required this.featured,
    required this.clubs,
    required this.events,
    required this.announcements,
    required this.sessions,
    required this.tasks,
    required this.unread,
    required this.badgeCount,
    required this.checkins,
    required this.now,
  });

  final List<FeaturedItem> featured;
  final List<Club> clubs;
  final List<EventItem> events;
  final List<Announcement> announcements;
  final List<ClassSession> sessions;
  final List<TaskItem> tasks;
  final int unread;
  final int badgeCount;
  final int checkins;
  final DateTime now;
}
