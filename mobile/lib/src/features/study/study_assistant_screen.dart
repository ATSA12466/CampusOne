import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';
import '../../core/study/study_planner.dart';
import '../../core/widgets/states.dart';
import '../listings/listing_detail_screen.dart';
import '../listings/listings_repository.dart';

/// Study planner (rule-based week plans saved to the account) plus a
/// materials search. No AI service is involved on either client.
class StudyAssistantScreen extends StatefulWidget {
  const StudyAssistantScreen({super.key});

  @override
  State<StudyAssistantScreen> createState() => _StudyAssistantScreenState();
}

const _weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

class _StudyAssistantScreenState extends State<StudyAssistantScreen> {
  final _form = GlobalKey<FormState>();
  final _subject = TextEditingController();
  final _constraints = TextEditingController();
  final _search = TextEditingController();
  final _days = <String>{'Monday', 'Wednesday', 'Friday'};
  TimeOfDay _start = const TimeOfDay(hour: 18, minute: 0);
  String _duration = '60';
  String _breakMinutes = '10';
  String _goal = 'Mixed';
  String _weekStart = '';
  List<StudySessionPlan>? _preview;
  Future<List<Map<String, dynamic>>>? _plans;
  Future<List<ListingItem>>? _results;
  String _topic = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _weekStart = nextStudyWeek();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _plans ??= _loadPlans();
  }

  @override
  void dispose() {
    _subject.dispose();
    _constraints.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _loadPlans() async {
    if (!SessionScope.sessionOf(context).signedIn) return [];
    try {
      return await PersonalStoreRepository(
        SessionScope.apiOf(context),
      ).list('studyPlans');
    } on ApiException {
      return [];
    }
  }

  Future<void> _reloadPlans() async {
    final future = _loadPlans();
    if (!mounted) return;
    setState(() => _plans = future);
    try {
      await future;
    } catch (_) {
      // FutureBuilder surfaces the error.
    }
  }

  String get _startText =>
      '${_start.hour.toString().padLeft(2, '0')}:${_start.minute.toString().padLeft(2, '0')}';

  StudyPlannerInput? _input() {
    if (!_form.currentState!.validate()) return null;
    if (_days.isEmpty) {
      showAppMessage(context, 'Choose at least one available day.', error: true);
      return null;
    }
    return StudyPlannerInput(
      course: _subject.text.trim(),
      weekStart: _weekStart,
      days: _days.toList(),
      start: _startText,
      duration: int.parse(_duration),
      breakMinutes: int.parse(_breakMinutes),
      goal: _goal,
    );
  }

  void _generate() {
    final input = _input();
    if (input == null) return;
    if (_start.hour * 60 + _start.minute + input.duration + input.breakMinutes >=
        1440) {
      showAppMessage(
        context,
        'Choose a start that leaves room for the session and break before midnight.',
        error: true,
      );
      return;
    }
    setState(() => _preview = buildStudySessions(input));
  }

  Future<void> _savePlan() async {
    final preview = _preview;
    if (preview == null || preview.isEmpty || _busy) return;
    if (!SessionScope.sessionOf(context).signedIn) {
      showAppMessage(context, 'Please sign in to save plans.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await PersonalStoreRepository(SessionScope.apiOf(context)).put(
        'studyPlans',
        {
          'subject': _subject.text.trim(),
          'weekStart': _weekStart,
          'days': _days.toList(),
          'start': _startText,
          'duration': _duration,
          'breakMinutes': _breakMinutes,
          'goal': _goal,
          'constraints': _constraints.text.trim(),
          'id': newRecordId('plan'),
          'createdAt': DateTime.now().toUtc().toIso8601String(),
          'sessions': [for (final s in preview) s.toJson()],
        },
      );
      if (mounted) {
        showAppMessage(context, 'Study plan saved to your account.');
        setState(() => _preview = null);
      }
      _reloadPlans();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _removePlan(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this plan?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await PersonalStoreRepository(
        SessionScope.apiOf(context),
      ).remove('studyPlans', id);
      _reloadPlans();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _pickWeek() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && mounted) {
      setState(
        () => _weekStart = picked.toIso8601String().substring(0, 10),
      );
    }
  }

  Future<void> _pickStart() async {
    final picked = await showTimePicker(context: context, initialTime: _start);
    if (picked != null && mounted) setState(() => _start = picked);
  }

  void _search() {
    setState(() {
      _topic = _search.text.trim();
      _results = ListingsRepository(
        SessionScope.apiOf(context),
      ).list('resources', search: _topic);
    });
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return Scaffold(
      appBar: AppBar(title: const Text('Study assistant')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Study planner', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text(
            'Rule-based week plans from your availability. Plans save to your account.',
          ),
          const SizedBox(height: 12),
          if (!signedIn)
            const Card(
              child: ListTile(
                leading: Icon(Icons.lock_outline),
                title: Text('Sign in to build and save study plans.'),
              ),
            )
          else
            Form(
              key: _form,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _subject,
                    decoration: const InputDecoration(labelText: 'Subject'),
                    maxLength: 100,
                    validator: (value) =>
                        (value == null || value.trim().length < 2)
                        ? 'Name a subject.'
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _pickWeek,
                          icon: const Icon(Icons.calendar_month_outlined),
                          label: Text('Week of $_weekStart'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _pickStart,
                          icon: const Icon(Icons.schedule_outlined),
                          label: Text('Start $_startText'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Available days',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Wrap(
                    spacing: 8,
                    children: [
                      for (final day in _weekDays)
                        FilterChip(
                          label: Text(day.substring(0, 3)),
                          selected: _days.contains(day),
                          onSelected: (value) => setState(() {
                            if (value) {
                              _days.add(day);
                            } else {
                              _days.remove(day);
                            }
                          }),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _duration,
                          decoration: const InputDecoration(
                            labelText: 'Session',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: '45',
                              child: Text('45 min'),
                            ),
                            DropdownMenuItem(
                              value: '60',
                              child: Text('60 min'),
                            ),
                            DropdownMenuItem(
                              value: '90',
                              child: Text('90 min'),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _duration = value ?? '60'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _breakMinutes,
                          decoration: const InputDecoration(labelText: 'Break'),
                          items: const [
                            DropdownMenuItem(value: '5', child: Text('5 min')),
                            DropdownMenuItem(
                              value: '10',
                              child: Text('10 min'),
                            ),
                            DropdownMenuItem(
                              value: '15',
                              child: Text('15 min'),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _breakMinutes = value ?? '10'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _goal,
                          decoration: const InputDecoration(labelText: 'Goal'),
                          items: const [
                            DropdownMenuItem(
                              value: 'Revision',
                              child: Text('Revision'),
                            ),
                            DropdownMenuItem(
                              value: 'Practice',
                              child: Text('Practice'),
                            ),
                            DropdownMenuItem(value: 'Mixed', child: Text('Mixed')),
                          ],
                          onChanged: (value) =>
                              setState(() => _goal = value ?? 'Mixed'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _constraints,
                    decoration: const InputDecoration(
                      labelText: 'Constraints (optional)',
                      hintText: 'No evenings after 8pm…',
                    ),
                    maxLength: 1000,
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: _generate,
                    icon: const Icon(Icons.auto_awesome_outlined),
                    label: const Text('Generate plan'),
                  ),
                ],
              ),
            ),
          if (_preview != null) ...[
            const SizedBox(height: 16),
            Text(
              'Your prepared week (${_preview!.length} sessions)',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            for (final session in _preview!)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.schedule_outlined),
                  title: Text('${session.date} · ${session.start}–${session.end}'),
                  subtitle: Text(
                    '${session.focus} · break until ${session.breakUntil}',
                  ),
                ),
              ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: _busy ? null : _savePlan,
              icon: const Icon(Icons.save_outlined),
              label: const Text('Save plan'),
            ),
          ],
          if (signedIn) ...[
            const SizedBox(height: 16),
            Text(
              'Saved plans',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            FutureBuilder<List<Map<String, dynamic>>>(
              future: _plans,
              builder: (context, snapshot) =>
                  AsyncView<List<Map<String, dynamic>>>(
                    snapshot: snapshot,
                    onRetry: _reloadPlans,
                    emptyTitle: 'No saved plans',
                    emptyMessage: 'Generate a week above to get started.',
                    emptyIcon: Icons.event_note_outlined,
                    builder: (context, plans) => Column(
                      children: [
                        for (final plan in plans)
                          Card(
                            child: ListTile(
                              title: Text(asString(plan['subject'])),
                              subtitle: Text(
                                'Week of ${asString(plan['weekStart'])} · ${(plan['sessions'] as List?)?.length ?? 0} sessions',
                              ),
                              trailing: IconButton(
                                tooltip: 'Delete plan',
                                icon: const Icon(Icons.delete_outline),
                                onPressed: () =>
                                    _removePlan(asString(plan['id'])),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
            ),
          ],
          const SizedBox(height: 24),
          Text('Materials search', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 4),
          const Text('Find study materials by module or topic keyword.'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final topic in ['Calculus', 'Linear algebra', 'HTTP', 'Recursion'])
                ActionChip(
                  label: Text(topic),
                  onPressed: () {
                    _search.text = topic;
                    _search();
                  },
                ),
            ],
          ),
          const SizedBox(height: 12),
          SearchBar(
            controller: _search,
            hintText: 'Search materials…',
            leading: const Icon(Icons.search),
            onSubmitted: (_) => _search(),
          ),
          const SizedBox(height: 8),
          if (_results != null)
            FutureBuilder<List<ListingItem>>(
              future: _results,
              builder: (context, snapshot) => AsyncView<List<ListingItem>>(
                snapshot: snapshot,
                onRetry: _search,
                emptyTitle: 'No materials for “$_topic”',
                emptyMessage: 'Try a module title or topic keyword instead.',
                emptyIcon: Icons.school_outlined,
                builder: (context, items) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Matching materials (${items.length})',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    for (final item in items)
                      Card(
                        child: ListTile(
                          title: Text(item.title),
                          subtitle: Text(item.subtitle),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ListingDetailScreen(
                                domain: 'resources',
                                id: item.id,
                                title: item.title,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
