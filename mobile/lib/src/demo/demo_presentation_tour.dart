import 'package:flutter/material.dart';

import '../features/academics/gpa_planner_screen.dart';
import 'demo_school_media.dart';
import 'demo_store.dart';
import 'demo_student_tools.dart';
import 'demo_study_hub.dart';

class DemoPresentationTourScreen extends StatefulWidget {
  const DemoPresentationTourScreen({super.key, required this.store});

  final DemoStore store;

  @override
  State<DemoPresentationTourScreen> createState() =>
      _DemoPresentationTourScreenState();
}

class _DemoPresentationTourScreenState extends State<DemoPresentationTourScreen> {
  final Set<int> _completed = {};

  late final List<_TourStop> _stops = [
    _TourStop(
      title: 'Set up your courses',
      subtitle: 'Paste a class-group message and review the course codes.',
      icon: Icons.content_paste_search_rounded,
      action: 'Add courses',
      screen: (_) => const DemoStudyHubScreen(initialSection: 0),
    ),
    _TourStop(
      title: 'See the week at a glance',
      subtitle: 'Check classes, times and rooms in the timetable.',
      icon: Icons.calendar_view_week_rounded,
      action: 'Open timetable',
      screen: (store) => DemoTimetableScreen(store: store),
    ),
    _TourStop(
      title: 'Make time to focus',
      subtitle: 'Start a timer and see focus minutes add to your total.',
      icon: Icons.timer_rounded,
      action: 'Start a focus session',
      screen: (_) => const DemoStudyHubScreen(initialSection: 1),
    ),
    _TourStop(
      title: 'Review what you know',
      subtitle: 'Create a flashcard and practise with spaced review.',
      icon: Icons.style_rounded,
      action: 'Open flashcards',
      screen: (_) => const DemoStudyHubScreen(initialSection: 2),
    ),
    _TourStop(
      title: 'Plan for a stronger semester',
      subtitle: 'Estimate grades and explore a target GPA.',
      icon: Icons.insights_rounded,
      action: 'Open GPA planner',
      screen: (_) => const GpaPlannerScreen(),
    ),
    _TourStop(
      title: 'Stay close to campus',
      subtitle: 'Browse campus stories, useful guides and student updates.',
      icon: Icons.campaign_rounded,
      action: 'Explore campus updates',
      screen: (store) => DemoSchoolMediaScreen(store: store),
    ),
  ];

  Future<void> _openStop(int index) async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute<void>(
        builder: (_) => _stops[index].screen(widget.store),
      ),
    );
    if (mounted) setState(() => _completed.add(index));
  }

  void _reset() => setState(_completed.clear);

  @override
  Widget build(BuildContext context) {
    final done = _completed.length;
    final finished = done == _stops.length;
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Presentation tour')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [colors.primary, colors.tertiary],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.route_rounded, color: Colors.white, size: 30),
                const SizedBox(height: 12),
                Text(
                  finished ? 'That’s the student journey.' : 'A student day with CampusOne.',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  finished
                      ? 'You have visited every stop. Restart the tour or keep exploring.'
                      : 'Follow six quick stops to see how students can plan classes, study and keep up with campus.',
                  style: const TextStyle(color: Colors.white, height: 1.4),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: done / _stops.length,
                    minHeight: 8,
                    backgroundColor: Colors.white24,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$done of ${_stops.length} stops explored',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          for (var index = 0; index < _stops.length; index++)
            _StopCard(
              number: index + 1,
              stop: _stops[index],
              completed: _completed.contains(index),
              onOpen: () => _openStop(index),
            ),
          const SizedBox(height: 8),
          if (finished)
            OutlinedButton.icon(
              onPressed: _reset,
              icon: const Icon(Icons.replay_rounded),
              label: const Text('Restart presentation tour'),
            ),
          const SizedBox(height: 10),
          const Card(
            child: Padding(
              padding: EdgeInsets.all(14),
              child: Text(
                'This walkthrough uses local demo data. AI scanning, scheduled SMS and cloud services need their connected backends before a live rollout.',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TourStop {
  const _TourStop({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.action,
    required this.screen,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String action;
  final Widget Function(DemoStore store) screen;
}

class _StopCard extends StatelessWidget {
  const _StopCard({
    required this.number,
    required this.stop,
    required this.completed,
    required this.onOpen,
  });

  final int number;
  final _TourStop stop;
  final bool completed;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: completed
                      ? colors.primaryContainer
                      : colors.surfaceContainerHighest,
                  child: completed
                      ? Icon(Icons.check_rounded, color: colors.primary)
                      : Text('$number'),
                ),
                const SizedBox(width: 12),
                Icon(stop.icon, color: colors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    stop.title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(52, 8, 0, 12),
              child: Text(stop.subtitle),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onOpen,
                icon: Icon(completed ? Icons.replay_rounded : Icons.arrow_forward_rounded),
                label: Text(completed ? 'Visit again' : stop.action),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
