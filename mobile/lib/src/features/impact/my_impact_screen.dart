import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../clubs/clubs_repository.dart';
import '../events/events_repository.dart';
import '../schedule/schedule_repository.dart';
import '../tasks/tasks_repository.dart';

/// Counts of the student's own activity. Each tile opens the real list.
class MyImpactScreen extends StatefulWidget {
  const MyImpactScreen({super.key});

  @override
  State<MyImpactScreen> createState() => _MyImpactScreenState();
}

class _MyImpactScreenState extends State<MyImpactScreen> {
  Future<_Counts>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_Counts> _load() async {
    final api = SessionScope.apiOf(context);
    final results = await Future.wait([
      ClubsRepository(api).myClubs().then((v) => v.length).catchError((_) => 0),
      EventsRepository(
        api,
      ).myRegistrations().then((v) => v.length).catchError((_) => 0),
      TasksRepository(api).list().then((v) => v.length).catchError((_) => 0),
      ScheduleRepository(api).sessions().then((v) {
        return v.where((s) => s.mine).length;
      }).catchError((_) => 0),
      ScheduleRepository(api).plans().then((v) => v.length).catchError((_) => 0),
    ]);
    return _Counts(
      clubs: results[0],
      events: results[1],
      tasks: results[2],
      classes: results[3],
      plans: results[4],
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

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return Scaffold(
      appBar: AppBar(title: const Text('My impact')),
      body: signedIn
          ? RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<_Counts>(
                future: _future,
                builder: (context, snapshot) => AsyncView<_Counts>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  builder: (context, counts) => GridView.count(
                    padding: const EdgeInsets.all(16),
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: [
                      _Tile(
                        icon: Icons.groups_outlined,
                        value: counts.clubs,
                        label: 'Clubs joined',
                      ),
                      _Tile(
                        icon: Icons.event_available_outlined,
                        value: counts.events,
                        label: 'Event registrations',
                      ),
                      _Tile(
                        icon: Icons.check_circle_outlined,
                        value: counts.tasks,
                        label: 'Workspace tasks',
                      ),
                      _Tile(
                        icon: Icons.school_outlined,
                        value: counts.classes,
                        label: 'My classes',
                      ),
                      _Tile(
                        icon: Icons.calendar_month_outlined,
                        value: counts.plans,
                        label: 'Personal plans',
                      ),
                    ],
                  ),
                ),
              ),
            )
          : const Center(
              child: EmptyView(
                title: 'Sign in to see your impact',
                message: 'Your activity counts appear here.',
                icon: Icons.insights_outlined,
              ),
            ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({required this.icon, required this.value, required this.label});

  final IconData icon;
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(label, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _Counts {
  _Counts({
    required this.clubs,
    required this.events,
    required this.tasks,
    required this.classes,
    required this.plans,
  });

  final int clubs;
  final int events;
  final int tasks;
  final int classes;
  final int plans;
}
