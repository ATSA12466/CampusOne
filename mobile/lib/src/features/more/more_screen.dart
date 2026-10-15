import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/theme/theme_prefs.dart';
import '../academics/gpa_screen.dart';
import '../onboarding/welcome_prefs.dart';
import '../onboarding/welcome_screen.dart';
import '../academics/study_notes_screen.dart';
import '../admin/admin_reports_screen.dart';
import '../attendance/attendance_history_screen.dart';
import '../badges/badges_screen.dart';
import '../catalog/accommodation_screen.dart';
import '../catalog/announcements_screen.dart';
import '../catalog/materials_screen.dart';
import '../events/events_screen.dart';
import '../catalog/src_office_screen.dart';
import '../clubs/clubs_screen.dart';
import '../community/community_screen.dart';
import '../discover/discover_screen.dart';
import '../enquiries/enquiries_screen.dart';
import '../executives/executives_screen.dart';
import '../freshers/freshers_screen.dart';
import '../impact/my_impact_screen.dart';
import '../listings/campaigns_screen.dart';
import '../listings/courses_screen.dart';
import '../listings/lostfound_screen.dart';
import '../listings/marketplace_screen.dart';
import '../listings/media_screen.dart';
import '../listings/opportunities_screen.dart';
import '../notifications/notifications_screen.dart';
import '../profile/profile_screen.dart';
import '../saved/saved_screen.dart';
import '../schedule/calendar_screen.dart';
import '../schedule/timetable_screen.dart';
import '../settings/server_settings_screen.dart';
import '../study/study_assistant_screen.dart';
import '../tasks/tasks_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final themePrefs = ThemeScope.of(context);
    final signedIn = session.signedIn;
    final elevated = session.user?.isExecutive == true;
    final admin = session.user?.isAdminRole == true;
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          HeroBanner(
            image: DemoImages.campusLife,
            compact: true,
            eyebrow: 'Everything else',
            title: session.user == null
                ? 'Your campus, pictured.'
                : 'Hello, ${session.user!.name.split(' ').first}.',
            description:
                'Campus picture shortcuts, plus every tool that lives outside '
                'the main tabs.',
            children: [
              FilledButton(
                onPressed: () => _go(context, const ClubsScreen()),
                child: const Text('Clubs & societies'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 208,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                for (final action in <(String, String, IconData, CampusMedia, Widget)>[
                  (
                    'Events',
                    'Be part of the moment',
                    Icons.celebration_outlined,
                    DemoImages.innovationNight,
                    const EventsScreen(),
                  ),
                  (
                    'Marketplace',
                    'Good finds, closer',
                    Icons.storefront_outlined,
                    DemoImages.marketDesk,
                    const MarketplaceScreen(),
                  ),
                  (
                    'Find a room',
                    'Make yourself at home',
                    Icons.home_work_outlined,
                    DemoImages.housingRoom,
                    const AccommodationScreen(),
                  ),
                  (
                    'Library',
                    'A little head start',
                    Icons.menu_book_outlined,
                    DemoImages.studyCorner,
                    const MaterialsScreen(),
                  ),
                ])
                  Padding(
                    padding: const EdgeInsets.only(right: 12),
                    child: SizedBox(
                      width: 172,
                      child: PhotoTile(
                        image: action.$4,
                        title: action.$1,
                        description: action.$2,
                        icon: action.$3,
                        onTap: () => _go(context, action.$5),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          if (signedIn) ...[
            const _Heading('My campus'),
            _Row(
              icon: Icons.notifications_outlined,
              title: 'Notifications',
              onTap: () => _go(context, const NotificationsScreen()),
            ),
            _Row(
              icon: Icons.how_to_reg_outlined,
              title: 'My attendance',
              onTap: () => _go(context, const AttendanceHistoryScreen()),
            ),
            _Row(
              icon: Icons.verified_outlined,
              title: 'My badges',
              onTap: () => _go(context, const BadgesScreen()),
            ),
            _Row(
              icon: Icons.bookmark_border_outlined,
              title: 'Saved',
              onTap: () => _go(context, const SavedScreen()),
            ),
            _Row(
              icon: Icons.insights_outlined,
              title: 'My impact',
              onTap: () => _go(context, const MyImpactScreen()),
            ),
            _Row(
              icon: Icons.outgoing_mail,
              title: 'My enquiries',
              onTap: () => _go(context, const EnquiriesScreen()),
            ),
            _Row(
              icon: Icons.account_balance_outlined,
              title: 'SRC requests',
              onTap: () => _go(context, const SrcRequestScreen()),
            ),
            const _Heading('Planner'),
            _Row(
              icon: Icons.view_week_outlined,
              title: 'Timetable',
              onTap: () => _go(context, const TimetableScreen()),
            ),
            _Row(
              icon: Icons.calendar_month_outlined,
              title: 'Calendar',
              onTap: () => _go(context, const CalendarScreen()),
            ),
            _Row(
              icon: Icons.check_circle_outlined,
              title: 'Tasks',
              onTap: () => _go(context, const TasksScreen()),
            ),
            const _Heading('Study'),
            _Row(
              icon: Icons.note_alt_outlined,
              title: 'Study notes',
              onTap: () => _go(context, const StudyNotesScreen()),
            ),
            _Row(
              icon: Icons.calculate_outlined,
              title: 'GPA calculator',
              onTap: () => _go(context, const GpaScreen()),
            ),
            if (elevated)
              _Row(
                icon: Icons.admin_panel_settings_outlined,
                title: 'Executive tools',
                onTap: () => _go(context, const ExecutivesScreen()),
              ),
            if (admin)
              _Row(
                icon: Icons.shield_outlined,
                title: 'Reports & admin',
                onTap: () => _go(context, const AdminReportsScreen()),
              ),
          ],
          const _Heading('Discover'),
          _Row(
            icon: Icons.explore_outlined,
            title: 'Discover',
            onTap: () => _go(context, const DiscoverScreen()),
          ),
          // Signed-in tabs swap Clubs for Scan/Messages, so clubs stay
          // reachable from here for everyone.
          _Row(
            icon: Icons.groups_outlined,
            title: 'Clubs',
            onTap: () => _go(context, const ClubsScreen()),
          ),
          _Row(
            icon: Icons.school_outlined,
            title: 'Freshers',
            subtitle: 'First-week checklist and groups',
            onTap: () => _go(context, const FreshersScreen()),
          ),
          _Row(
            icon: Icons.forum_outlined,
            title: 'Community',
            onTap: () => _go(context, const CommunityScreen()),
          ),
          _Row(
            icon: Icons.campaign_outlined,
            title: 'Announcements',
            onTap: () => _go(context, const AnnouncementsScreen()),
          ),
          _Row(
            icon: Icons.storefront_outlined,
            title: 'Marketplace',
            onTap: () => _go(context, const MarketplaceScreen()),
          ),
          _Row(
            icon: Icons.rocket_launch_outlined,
            title: 'Opportunities',
            onTap: () => _go(context, const OpportunitiesScreen()),
          ),
          _Row(
            icon: Icons.find_in_page_outlined,
            title: 'Lost & found',
            onTap: () => _go(context, const LostFoundScreen()),
          ),
          _Row(
            icon: Icons.play_circle_outline,
            title: 'Media',
            onTap: () => _go(context, const MediaScreen()),
          ),
          _Row(
            icon: Icons.ads_click_outlined,
            title: 'Advertising',
            onTap: () => _go(context, const CampaignsScreen()),
          ),
          _Row(
            icon: Icons.book_outlined,
            title: 'Courses',
            onTap: () => _go(context, const CoursesScreen()),
          ),
          _Row(
            icon: Icons.bed_outlined,
            title: 'Accommodation',
            onTap: () => _go(context, const AccommodationScreen()),
          ),
          _Row(
            icon: Icons.menu_book_outlined,
            title: 'Study materials',
            onTap: () => _go(context, const MaterialsScreen()),
          ),
          _Row(
            icon: Icons.psychology_outlined,
            title: 'Study assistant',
            onTap: () => _go(context, const StudyAssistantScreen()),
          ),
          _Row(
            icon: Icons.account_balance_outlined,
            title: 'SRC office',
            onTap: () => _go(context, const SrcOfficeScreen()),
          ),
          const _Heading('Account'),
          _Row(
            icon: Icons.person_outline,
            title: 'Profile',
            onTap: () => _go(context, const ProfileScreen()),
          ),
          _Row(
            icon: Icons.brightness_6_outlined,
            title: 'Appearance',
            subtitle: _themeLabel(themePrefs.mode),
            onTap: () => themePrefs.setMode(_nextTheme(themePrefs.mode)),
          ),
          _Row(
            icon: Icons.replay_outlined,
            title: 'Replay welcome tour',
            onTap: () async {
              await WelcomePrefs.reset();
              if (context.mounted) _go(context, const WelcomeScreen());
            },
          ),
          _Row(
            icon: Icons.dns_outlined,
            title: 'Server',
            subtitle: SessionScope.apiOf(context).baseUrl,
            onTap: () => _go(context, const ServerSettingsScreen()),
          ),
        ],
      ),
    );
  }

  void _go(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }
}

String _themeLabel(ThemeMode mode) => switch (mode) {
  ThemeMode.light => 'Light',
  ThemeMode.dark => 'Dark',
  ThemeMode.system => 'System default',
};

ThemeMode _nextTheme(ThemeMode mode) => switch (mode) {
  ThemeMode.system => ThemeMode.light,
  ThemeMode.light => ThemeMode.dark,
  ThemeMode.dark => ThemeMode.system,
};

class _Heading extends StatelessWidget {
  const _Heading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 12, 4, 4),
      child: Text(text, style: Theme.of(context).textTheme.titleSmall),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, this.subtitle, this.onTap});

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: subtitle == null ? null : Text(subtitle!),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
