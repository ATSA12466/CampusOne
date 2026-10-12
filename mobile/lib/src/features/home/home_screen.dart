import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../attendance/attendance_history_screen.dart';
import '../catalog/announcements_screen.dart';
import '../events/events_screen.dart';
import '../attendance/attendance_repository.dart';
import '../attendance/scan_screen.dart';
import '../badges/badges_repository.dart';
import '../badges/badges_screen.dart';
import '../catalog/catalog_repository.dart';
import '../notifications/notifications_repository.dart';
import '../notifications/notifications_screen.dart';
import 'widgets/home_cards.dart';

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
    final catalog = CatalogRepository(api);
    final events = await catalog.events();
    final announcements = await catalog.announcements();
    int unread = 0;
    int badgeCount = 0;
    int checkins = 0;
    try {
      final feed = await NotificationsRepository(api).feed();
      unread = feed.unread;
    } catch (_) {
      // Signed-out or offline: dashboard still shows public content.
    }
    try {
      badgeCount = (await BadgesRepository(api).mine()).length;
      checkins = (await AttendanceRepository(api).myRecords())
          .where((record) => record.status == 'present')
          .length;
    } catch (_) {
      // Same: public content first, personal stats when signed in.
    }
    return _HomeData(
      events: events.items.take(5).toList(),
      announcements: announcements.items.take(3).toList(),
      unread: unread,
      badgeCount: badgeCount,
      checkins: checkins,
    );
  }

  void _reload() => setState(() => _future = _load());

  void _open(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final user = SessionScope.sessionOf(context).user;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('CampusOne'),
            if (user != null)
              Text(
                'Hi, ${user.name.split(' ').first}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            onPressed: () => _open(const NotificationsScreen()),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<_HomeData>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_HomeData>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, data) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                CheckInBanner(onScan: () => _open(const ScanScreen())),
                const SizedBox(height: 16),
                StatsRow(
                  checkins: data.checkins,
                  badgeCount: data.badgeCount,
                  unread: data.unread,
                  onCheckins: () => _open(const AttendanceHistoryScreen()),
                  onBadges: () => _open(const BadgesScreen()),
                  onUnread: () => _open(const NotificationsScreen()),
                ),
                const SizedBox(height: 16),
                SectionHeader(
                  title: 'Upcoming events',
                  onSeeAll: () => _open(const EventsScreen()),
                ),
                ...data.events.map((event) => EventRow(event: event)),
                const SizedBox(height: 8),
                SectionHeader(
                  title: 'Announcements',
                  onSeeAll: () => _open(const AnnouncementsScreen()),
                ),
                ...data.announcements.map(
                  (item) => AnnouncementRow(item: item),
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
    required this.events,
    required this.announcements,
    required this.unread,
    required this.badgeCount,
    required this.checkins,
  });

  final List<EventItem> events;
  final List<Announcement> announcements;
  final int unread;
  final int badgeCount;
  final int checkins;
}
