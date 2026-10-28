import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'schedule_repository.dart';

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({super.key});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  Future<_Week>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_Week> _load() async {
    final repo = ScheduleRepository(SessionScope.apiOf(context));
    final signedIn = SessionScope.sessionOf(context).signedIn;
    final catalog = await repo.catalogSessions();
    var mine = <ClassSession>[];
    if (signedIn) {
      try {
        mine = await repo.myClasses();
      } on ApiException {
        mine = [];
      }
    }
    return _Week(catalog: catalog, mine: mine);
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

  Future<void> _edit([ClassSession? session]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => ClassEditorSheet(session: session)),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return PhotoScaffold(
      image: DemoImages.studyCorner,
      eyebrow: 'Timetable',
      title: 'Your week, with room to breathe.',
      description:
          'A clear view of your classes. Keep the official timetable close, too.',
      appBar: AppBar(title: const Text('Timetable')),
      floatingActionButton: signedIn
          ? FloatingActionButton.extended(
              onPressed: () => _edit(),
              icon: const Icon(Icons.add),
              label: const Text('My class'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<_Week>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_Week>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, week) {
              final all = [...week.catalog, ...week.mine];
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text(
                    'Catalog classes are illustrative — always verify against the official schedule.',
                  ),
                  const SizedBox(height: 12),
                  for (final day in weekDays)
                    _DaySection(
                      day: day,
                      sessions: all.where((s) => s.day == day).toList()
                        ..sort((a, b) => a.start.compareTo(b.start)),
                      onEdit: signedIn ? _edit : null,
                      onDelete: signedIn
                          ? (session) async {
                              try {
                                await ScheduleRepository(
                                  SessionScope.apiOf(context),
                                ).removeClass(session.id);
                                _reload();
                              } on ApiException catch (error) {
                                if (context.mounted) {
                                  showAppMessage(
                                    context,
                                    error.message,
                                    error: true,
                                  );
                                }
                              }
                            }
                          : null,
                    ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}

class _DaySection extends StatelessWidget {
  const _DaySection({
    required this.day,
    required this.sessions,
    this.onEdit,
    this.onDelete,
  });

  final String day;
  final List<ClassSession> sessions;
  final Future<void> Function(ClassSession session)? onEdit;
  final Future<void> Function(ClassSession session)? onDelete;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(day, style: Theme.of(context).textTheme.titleMedium),
        ),
        if (sessions.isEmpty)
          const Card(
            child: ListTile(
              dense: true,
              title: Text('No classes'),
            ),
          ),
        for (final session in sessions)
          Card(
            child: ListTile(
              title: Text(session.course),
              subtitle: Text(
                '${session.start} – ${session.end} · ${session.venue}',
              ),
              trailing: session.mine
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const StatusChip(label: 'Mine'),
                        if (onEdit != null)
                          PopupMenuButton<String>(
                            onSelected: (value) {
                              if (value == 'edit') {
                                onEdit!(session);
                              } else {
                                onDelete!(session);
                              }
                            },
                            itemBuilder: (_) => const [
                              PopupMenuItem(
                                value: 'edit',
                                child: Text('Edit'),
                              ),
                              PopupMenuItem(
                                value: 'delete',
                                child: Text('Delete'),
                              ),
                            ],
                          ),
                      ],
                    )
                  : null,
            ),
          ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class ClassEditorSheet extends StatefulWidget {
  const ClassEditorSheet({super.key, this.session});

  final ClassSession? session;

  @override
  State<ClassEditorSheet> createState() => _ClassEditorSheetState();
}

class _ClassEditorSheetState extends State<ClassEditorSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _course;
  late final TextEditingController _venue;
  String _day = 'Monday';
  TimeOfDay _start = const TimeOfDay(hour: 9, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 10, minute: 0);
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _course = TextEditingController(text: widget.session?.course ?? '');
    _venue = TextEditingController(text: widget.session?.venue ?? '');
    _day = widget.session?.day ?? 'Monday';
    _start = _parse(widget.session?.start) ?? _start;
    _end = _parse(widget.session?.end) ?? _end;
  }

  TimeOfDay? _parse(String? value) {
    if (value == null || value.length < 5) return null;
    return TimeOfDay(
      hour: int.tryParse(value.substring(0, 2)) ?? 9,
      minute: int.tryParse(value.substring(3, 5)) ?? 0,
    );
  }

  String _fmt(TimeOfDay time) =>
      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

  @override
  void dispose() {
    _course.dispose();
    _venue.dispose();
    super.dispose();
  }

  Future<void> _pick(bool isStart) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _start : _end,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _start = picked;
        } else {
          _end = picked;
        }
      });
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    if (_fmt(_end).compareTo(_fmt(_start)) <= 0) {
      showAppMessage(context, 'Finish after the start time.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await ScheduleRepository(SessionScope.apiOf(context)).saveClass(
        ClassSession(
          id: widget.session?.id ?? newRecordId('class'),
          day: _day,
          course: _course.text.trim(),
          start: _fmt(_start),
          end: _fmt(_end),
          venue: _venue.text.trim(),
          mine: true,
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.session == null ? 'New class' : 'Edit class'),
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              initialValue: weekDays.contains(_day) ? _day : 'Monday',
              decoration: const InputDecoration(labelText: 'Day'),
              items: [
                for (final day in weekDays)
                  DropdownMenuItem(value: day, child: Text(day)),
              ],
              onChanged: (value) => setState(() => _day = value ?? 'Monday'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _course,
              decoration: const InputDecoration(labelText: 'Course'),
              validator: (value) =>
                  (value ?? '').trim().length >= 2 ? null : 'Add the course.',
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Starts'),
                    subtitle: Text(_fmt(_start)),
                    onTap: () => _pick(true),
                  ),
                ),
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Ends'),
                    subtitle: Text(_fmt(_end)),
                    onTap: () => _pick(false),
                  ),
                ),
              ],
            ),
            TextFormField(
              controller: _venue,
              decoration: const InputDecoration(labelText: 'Venue'),
              validator: (value) =>
                  (value ?? '').trim().length >= 2 ? null : 'Add the venue.',
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: const Text('Save class'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Week {
  _Week({required this.catalog, required this.mine});

  final List<ClassSession> catalog;
  final List<ClassSession> mine;
}
