import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import '../catalog/accommodation_screen.dart';
import '../catalog/catalog_repository.dart';
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
    detail: 'Add your programme, level and interests so classmates can find you.',
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
  'Arts & culture': ['art', 'music', 'dance', 'drama', 'culture', 'creative', 'choir'],
  'Sports': ['sport', 'football', 'basket', 'athlet', 'fitness', 'game'],
  'Faith': ['faith', 'christian', 'muslim', 'fellowship', 'chapel', 'mosque'],
  'Service': ['service', 'volunteer', 'community', 'outreach', 'rotaract', 'leo'],
  'Academic': ['academic', 'debate', 'study', 'research', 'science', 'engineering'],
  'Media': ['media', 'press', 'photo', 'film', 'radio', 'content'],
};

bool _matchesInterest(Club club, String interest) {
  if (interest == 'All interests') return true;
  final haystack = '${club.name} ${club.description} ${club.category}'.toLowerCase();
  return (_interestKeywords[interest] ?? const <String>[])
      .any(haystack.contains);
}

class _FreshersScreenState extends State<FreshersScreen> {
  Future<List<Club>>? _future;
  String _interest = _interests.first;
  Set<String> _done = {};
  bool _prefsReady = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
    _loadChecks();
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
    setState(() {
      if (value) {
        _done = {..._done, title};
      } else {
        _done = {..._done}..remove(title);
      }
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList('campusone.freshers_done', _done.toList());
    } catch (_) {
      // Best effort; the visible state already updated.
    }
  }

  void _go(Widget screen) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));

  @override
  Widget build(BuildContext context) {
    return PhotoScaffold(
      image: DemoImages.studentAma,
      eyebrow: 'FRESHERS HUB',
      title: 'Find your people from day one.',
      description: 'Akwaaba to GCTU. Meet students who share your interests, join a group that feels like home, and settle into campus life one small step at a time.',
      appBar: AppBar(title: const Text('Freshers')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Find your people from day one.',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 4),
            Text(
              'Your first week, in order.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            Text('First-week checklist', style: Theme.of(context).textTheme.titleMedium),
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
            Text('Interest groups', style: Theme.of(context).textTheme.titleMedium),
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
            const SizedBox(height: 16),
            Text('Keep settling in', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _NextCard(
              icon: Icons.forum_outlined,
              title: 'Say hello to campus',
              detail: 'Introduce yourself in the community feed and see what others are up to.',
              cta: 'Open community',
              onTap: () => _go(const CommunityScreen()),
            ),
            _NextCard(
              icon: Icons.event_outlined,
              title: 'Never miss orientation',
              detail: 'RSVP to welcome events and keep your ticket in one place.',
              cta: 'Browse events',
              onTap: () => _go(const EventsScreen()),
            ),
            _NextCard(
              icon: Icons.bed_outlined,
              title: 'Find your way around',
              detail: 'Hostels, lecture halls, food spots — start with where you will live.',
              cta: 'Explore housing',
              onTap: () => _go(const AccommodationScreen()),
            ),
          ],
        ),
      ),
    );
  }
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
