import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/states.dart';
import '../catalog/accommodation_screen.dart';
import '../catalog/catalog_repository.dart';
import '../catalog/src_office_screen.dart';
import '../clubs/club_detail_screen.dart';
import '../clubs/clubs_screen.dart';
import '../community/community_screen.dart';
import '../events/events_screen.dart';
import '../profile/profile_screen.dart';
import '../schedule/timetable_screen.dart';

/// First-week guide for new students: a settling-in checklist, club groups
/// by interest, and next-step links. Mirrors web `/freshers`.
class FreshersScreen extends StatefulWidget {
  const FreshersScreen({super.key});

  @override
  State<FreshersScreen> createState() => _FreshersScreenState();
}

const _steps = [
  _Step(
    title: 'Complete your profile',
    detail:
        'Add your programme, level and interests so classmates can find you.',
  ),
  _Step(
    title: 'Join one community',
    detail: 'Start with a single club or group — depth beats a dozen sign-ups.',
  ),
  _Step(
    title: 'Attend a welcome event',
    detail: 'Orientation meet-ups are the easiest place to make first friends.',
  ),
  _Step(
    title: 'Plan your first week',
    detail: 'Put your lectures and one social thing on the timetable.',
  ),
];

Widget _stepTarget(int index) => switch (index) {
      0 => const ProfileScreen(),
      1 => const ClubsScreen(),
      2 => const EventsScreen(),
      _ => const TimetableScreen(),
    };

const _interests = [
  'All interests',
  'Technology',
  'Arts & culture',
  'Sports',
  'Faith',
  'Service',
  'Academic',
  'Media',
];

const _interestKeywords = {
  'Technology': ['tech', 'code', 'robot', 'software', 'digital', 'innovation'],
  'Arts & culture': [
    'art',
    'music',
    'dance',
    'drama',
    'culture',
    'creative',
    'choir'
  ],
  'Sports': ['sport', 'football', 'basket', 'athlet', 'fitness', 'game'],
  'Faith': ['faith', 'christian', 'muslim', 'fellowship', 'chapel', 'mosque'],
  'Service': [
    'service',
    'volunteer',
    'community',
    'outreach',
    'rotaract',
    'leo'
  ],
  'Academic': [
    'academic',
    'debate',
    'study',
    'research',
    'science',
    'engineering'
  ],
  'Media': ['media', 'press', 'photo', 'film', 'radio', 'content'],
};

bool _matchesInterest(Club club, String interest) {
  if (interest == 'All interests') return true;
  final haystack =
      '${club.name} ${club.description} ${club.category}'.toLowerCase();
  return (_interestKeywords[interest] ?? const <String>[])
      .any(haystack.contains);
}

class _FreshersScreenState extends State<FreshersScreen> {
  Future<List<Club>>? _future;
  String _interest = _interests.first;
  Set<String> _done = {};
  bool _prefsReady = false;

  @override
  void initState() {
    super.initState();
    _loadChecks();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<Club>> _load() async =>
      (await CatalogRepository(SessionScope.apiOf(context)).clubs()).items;

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

  Future<void> _loadChecks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted) return;
      setState(() {
        _done = prefs.getStringList('campusone.freshers_done')?.toSet() ?? {};
        _prefsReady = true;
      });
    } catch (_) {
      // Checklist still works for this visit; it just won't persist.
      if (mounted) setState(() => _prefsReady = true);
    }
  }

  Future<void> _toggle(String title, bool value) async {
    final updated = {..._done};
    if (value) {
      updated.add(title);
    } else {
      updated.remove(title);
    }
    setState(() {
      _done = updated;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('campusone.freshers_done', updated.toList());
    } catch (_) {
      // Best effort; the visible state already updated.
    }
  }

  void _go(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    final completed = _steps.where((step) => _done.contains(step.title)).length;
    final progress = _steps.isEmpty ? 0.0 : completed / _steps.length;
    return Scaffold(
      appBar: AppBar(title: const Text('Freshers')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _FreshersWelcomeHero(
              image: DemoImages.studentAma,
              onExplore: () => _go(const ClubsScreen()),
            ),
            const SizedBox(height: 18),
            const _FreshersSectionHeading(
              title: 'Your first steps',
              subtitle: 'Quick access to the things new students need most.',
            ),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.55,
              children: [
                _FreshersQuickLink(
                  icon: Icons.person_outline_rounded,
                  title: 'My profile',
                  subtitle: 'Set up your student card',
                  onTap: () => _go(const ProfileScreen()),
                ),
                _FreshersQuickLink(
                  icon: Icons.groups_rounded,
                  title: 'Find a club',
                  subtitle: 'Meet your people',
                  onTap: () => _go(const ClubsScreen()),
                ),
                _FreshersQuickLink(
                  icon: Icons.event_available_rounded,
                  title: 'Events',
                  subtitle: 'Find welcome activities',
                  onTap: () => _go(const EventsScreen()),
                ),
                _FreshersQuickLink(
                  icon: Icons.calendar_month_rounded,
                  title: 'Timetable',
                  subtitle: 'Keep your week in view',
                  onTap: () => _go(const TimetableScreen()),
                ),
                _FreshersQuickLink(
                  icon: Icons.home_work_outlined,
                  title: 'Accommodation',
                  subtitle: 'Browse student housing',
                  onTap: () => _go(const AccommodationScreen()),
                ),
                _FreshersQuickLink(
                  icon: Icons.forum_outlined,
                  title: 'Community',
                  subtitle: 'Ask and share with students',
                  onTap: () => _go(const CommunityScreen()),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: Text('First-week checklist',
                      style: Theme.of(context).textTheme.titleMedium),
                ),
                Text('$completed/${_steps.length}',
                    style: const TextStyle(
                        color: CampusColors.primary,
                        fontWeight: FontWeight.w800)),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                backgroundColor: const Color(0xFFE8EDF5),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your first week, one useful step at a time.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 8),
            for (var i = 0; i < _steps.length; i++)
              Card(
                child: CheckboxListTile(
                  value: _done.contains(_steps[i].title),
                  onChanged: !_prefsReady
                      ? null
                      : (value) => _toggle(_steps[i].title, value ?? false),
                  title: Text(_steps[i].title),
                  subtitle: Text(_steps[i].detail),
                  secondary: IconButton(
                    tooltip: 'Open ${_steps[i].title}',
                    icon: const Icon(Icons.arrow_outward),
                    onPressed: () => _go(_stepTarget(i)),
                  ),
                ),
              ),
            const SizedBox(height: 16),
            Text('Interest groups',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              'Filter by interest, then open a club to see how to join.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final interest in _interests)
                  FilterChip(
                    label: Text(interest),
                    selected: _interest == interest,
                    onSelected: (_) => setState(() => _interest = interest),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            FutureBuilder<List<Club>>(
              future: _future,
              builder: (context, snapshot) => AsyncView<List<Club>>(
                snapshot: snapshot,
                onRetry: _reload,
                builder: (context, clubs) {
                  final matches = clubs
                      .where((club) => _matchesInterest(club, _interest))
                      .take(6)
                      .toList();
                  if (matches.isEmpty) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          'No groups match that interest yet',
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Try another interest, or browse the full club directory.',
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        OutlinedButton(
                          onPressed: () => _go(const ClubsScreen()),
                          child: const Text('Browse all clubs'),
                        ),
                      ],
                    );
                  }
                  return Column(
                    children: [
                      for (final club in matches)
                        Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(10),
                            leading: SizedBox(
                              width: 64,
                              height: 64,
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: CampusImage(
                                  image: club.cover,
                                  alt: club.name,
                                  aspect: CampusAspect.square,
                                ),
                              ),
                            ),
                            title: Text(club.name),
                            subtitle: Text(
                              '${club.category} · ${club.memberCount} members',
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => _go(ClubDetailScreen(clubId: club.id)),
                          ),
                        ),
                    ],
                  );
                },
              ),
            ),
            const SizedBox(height: 20),
            const _FreshersSectionHeading(
              title: 'A few campus essentials',
              subtitle: 'A starting point for common first-week questions.',
            ),
            const SizedBox(height: 8),
            const _FreshersGuideTile(
              icon: Icons.app_registration_rounded,
              title: 'Registration and course information',
              detail:
                  'Use official university updates for registration steps, course requirements and deadlines. Your Course Rep Portal will show class updates when your class information is available.',
            ),
            const _FreshersGuideTile(
              icon: Icons.directions_bus_filled_outlined,
              title: 'Getting around and daily essentials',
              detail:
                  'Plan your commute before class, save lecture venues in your timetable, and compare student housing in Accommodation.',
            ),
            const _FreshersGuideTile(
              icon: Icons.wifi_rounded,
              title: 'Wi-Fi and student services',
              detail:
                  'Ask the relevant university office for current login instructions and service hours. Keep passwords and student credentials out of public posts.',
            ),
            _NextCard(
              icon: Icons.support_agent_rounded,
              title: 'Need help finding the right office?',
              detail:
                  'See SRC contacts, student representatives and support information.',
              cta: 'Open SRC office',
              onTap: () => _go(const SrcOfficeScreen()),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Text(
                'Campus details and schedules can change. Confirm time-sensitive information through official GCTU channels.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF7B8799), fontSize: 12),
              ),
            ),
            const SizedBox(height: 16),
            Text('Keep settling in',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _NextCard(
              icon: Icons.forum_outlined,
              title: 'Say hello to campus',
              detail:
                  'Introduce yourself in the community feed and see what others are up to.',
              cta: 'Open community',
              onTap: () => _go(const CommunityScreen()),
            ),
            _NextCard(
              icon: Icons.event_outlined,
              title: 'Never miss orientation',
              detail:
                  'RSVP to welcome events and keep your ticket in one place.',
              cta: 'Browse events',
              onTap: () => _go(const EventsScreen()),
            ),
            _NextCard(
              icon: Icons.bed_outlined,
              title: 'Find your way around',
              detail:
                  'Hostels, lecture halls, food spots — start with where you will live.',
              cta: 'Explore housing',
              onTap: () => _go(const AccommodationScreen()),
            ),
          ],
        ),
      ),
    );
  }
}

class _FreshersWelcomeHero extends StatelessWidget {
  const _FreshersWelcomeHero({required this.image, required this.onExplore});

  final CampusMedia image;
  final VoidCallback onExplore;

  @override
  Widget build(BuildContext context) => Container(
        height: 408,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(26),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [CampusColors.primaryDark, CampusColors.primary],
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 16,
              left: 0,
              right: 0,
              child: Center(
                child: SizedBox(
                  width: 174,
                  height: 210,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: CampusImage(
                      image: image,
                      alt: 'A new student arriving on campus',
                      aspect: CampusAspect.portrait,
                      showProvenance: false,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              left: 20,
              right: 20,
              bottom: 18,
              child: Column(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: CampusColors.accent,
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: const Text(
                      'AKWAABA TO GCTU',
                      style: TextStyle(
                        color: CampusColors.primaryDark,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(height: 9),
                  const Text(
                    'Your campus life starts here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 5),
                  const Text(
                    'Meet people, find your way, and get ready for your first week.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white70, height: 1.35),
                  ),
                  const SizedBox(height: 10),
                  FilledButton.tonalIcon(
                    onPressed: onExplore,
                    icon: const Icon(Icons.groups_rounded),
                    label: const Text('Explore clubs'),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
}

class _FreshersSectionHeading extends StatelessWidget {
  const _FreshersSectionHeading({required this.title, required this.subtitle});
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                  )),
          const SizedBox(height: 3),
          Text(subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  )),
        ],
      );
}

class _FreshersQuickLink extends StatelessWidget {
  const _FreshersQuickLink({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon,
                    color: Theme.of(context).colorScheme.primary, size: 20),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 13)),
                    const SizedBox(height: 3),
                    Text(subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            )),
                  ],
                ),
              ),
            ]),
          ),
        ),
      );
}

class _FreshersGuideTile extends StatelessWidget {
  const _FreshersGuideTile({
    required this.icon,
    required this.title,
    required this.detail,
  });

  final IconData icon;
  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) => Card(
        child: ExpansionTile(
          leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
          title:
              Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            Text(detail,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      height: 1.45,
                    )),
          ],
        ),
      );
}

class _Step {
  const _Step({required this.title, required this.detail});

  final String title;
  final String detail;
}

class _NextCard extends StatelessWidget {
  const _NextCard({
    required this.icon,
    required this.title,
    required this.detail,
    required this.cta,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String cta;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 8),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              detail,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 8),
            OutlinedButton(onPressed: onTap, child: Text(cta)),
          ],
        ),
      ),
    );
  }
}
