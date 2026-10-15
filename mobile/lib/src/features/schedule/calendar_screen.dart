import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_repository.dart';
import 'schedule_repository.dart';

/// Month calendar over catalog classes, public events and personal plans.
class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  Future<_Agenda>? _future;
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  String? _selected;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_Agenda> _load() async {
    final api = SessionScope.apiOf(context);
    final schedule = ScheduleRepository(api);
    final catalog = await schedule.catalogSessions();
    final events = (await CatalogRepository(api).events()).items;
    var plans = <PersonalPlan>[];
    var mine = <ClassSession>[];
    if (SessionScope.sessionOf(context).signedIn) {
      try {
        plans = await schedule.myPlans();
        mine = await schedule.myClasses();
      } on ApiException {
        // Public agenda still renders for signed-in users offline.
      }
    }
    return _Agenda(
      catalog: catalog,
      mine: mine,
      events: events,
      plans: plans,
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

  Future<void> _editPlan([PersonalPlan? plan, String? date]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => PlanEditorSheet(plan: plan, initialDate: date),
      ),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return PhotoScaffold(
      image: DemoImages.eventSocial,
      eyebrow: 'Calendar',
      title: 'Make space for the good things.',
      description: 'Classes, public events and your own plans — one calm place to see the week.',
      appBar: AppBar(title: const Text('Calendar')),
      floatingActionButton: signedIn
          ? FloatingActionButton.extended(
              onPressed: () => _editPlan(null, _selected),
              icon: const Icon(Icons.add),
              label: const Text('My plan'),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<_Agenda>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_Agenda>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, agenda) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _MonthGrid(
                  month: _month,
                  selected: _selected,
                  hasPlans: (date) => agenda.forDate(date).isNotEmpty,
                  onShift: (delta) => setState(
                    () => _month = DateTime(
                      _month.year,
                      _month.month + delta,
                    ),
                  ),
                  onSelect: (date) => setState(() => _selected = date),
                ),
                const SizedBox(height: 16),
                if (_selected == null)
                  const EmptyView(
                    title: 'Pick a day',
                    message: 'Tap a date to see its agenda.',
                    icon: Icons.calendar_month_outlined,
                  )
                else
                  _DayAgenda(
                    date: _selected!,
                    rows: agenda.forDate(_selected!),
                    onEditPlan: signedIn
                        ? (plan) => _editPlan(plan)
                        : null,
                    onDeletePlan: signedIn
                        ? (plan) async {
                            try {
                              await ScheduleRepository(
                                SessionScope.apiOf(context),
                              ).removePlan(plan.id);
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
            ),
          ),
        ),
      ),
    );
  }
}

class _AgendaRow {
  _AgendaRow({
    required this.time,
    required this.title,
    required this.detail,
    required this.kind,
    this.plan,
  });

  final String time;
  final String title;
  final String detail;
  final String kind; // class, mine, event, plan
  final PersonalPlan? plan;
}

class _Agenda {
  _Agenda({
    required this.catalog,
    required this.mine,
    required this.events,
    required this.plans,
  });

  final List<ClassSession> catalog;
  final List<ClassSession> mine;
  final List<EventItem> events;
  final List<PersonalPlan> plans;

  static const _days = [
    '',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  List<_AgendaRow> forDate(String date) {
    final rows = <_AgendaRow>[];
    DateTime? day;
    try {
      day = DateTime.parse(date);
    } catch (_) {
      return rows;
    }
    final weekday = _days[day.weekday];
    for (final session in [...catalog, ...mine]) {
      if (session.day == weekday) {
        rows.add(
          _AgendaRow(
            time: session.start,
            title: session.course,
            detail: '${session.start} – ${session.end} · ${session.venue}',
            kind: session.mine ? 'mine' : 'class',
          ),
        );
      }
    }
    for (final event in events) {
      if (event.date == date || event.startsAt.startsWith(date)) {
        rows.add(
          _AgendaRow(
            time: 'all-day',
            title: event.title,
            detail: '${event.venue} · public event, not an RSVP',
            kind: 'event',
          ),
        );
      }
    }
    for (final plan in plans) {
      if (plan.date == date) {
        rows.add(
          _AgendaRow(
            time: plan.start,
            title: plan.title,
            detail: '${plan.start} – ${plan.end} · ${plan.venue}',
            kind: 'plan',
            plan: plan,
          ),
        );
      }
    }
    rows.sort((a, b) => a.time.compareTo(b.time));
    return rows;
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.selected,
    required this.hasPlans,
    required this.onShift,
    required this.onSelect,
  });

  final DateTime month;
  final String? selected;
  final bool Function(String date) hasPlans;
  final void Function(int delta) onShift;
  final void Function(String date) onSelect;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final first = DateTime(month.year, month.month, 1);
    final startOffset = (first.weekday - 1) % 7;
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Previous month',
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => onShift(-1),
                ),
                Expanded(
                  child: Text(
                    '${_monthName(month.month)} ${month.year}',
                    style: theme.textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                IconButton(
                  tooltip: 'Next month',
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => onShift(1),
                ),
              ],
            ),
            GridView.count(
              crossAxisCount: 7,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                for (final label in labels)
                  Center(
                    child: Text(
                      label,
                      style: theme.textTheme.labelSmall,
                    ),
                  ),
                for (var i = 0; i < startOffset; i++)
                  const SizedBox.shrink(),
                for (var day = 1; day <= daysInMonth; day++)
                  _DayCell(
                    date: DateTime(month.year, month.month, day),
                    selected: selected,
                    marked: hasPlans,
                    onSelect: onSelect,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _monthName(int month) => const [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ][month];
}

class _DayCell extends StatelessWidget {
  const _DayCell({
    required this.date,
    required this.selected,
    required this.marked,
    required this.onSelect,
  });

  final DateTime date;
  final String? selected;
  final bool Function(String date) marked;
  final void Function(String date) onSelect;

  @override
  Widget build(BuildContext context) {
    final key =
        '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    final isSelected = selected == key;
    final theme = Theme.of(context);
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () => onSelect(key),
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primaryContainer : null,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              '${date.day}',
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: isSelected ? FontWeight.bold : null,
              ),
            ),
            if (marked(key))
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primary,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _DayAgenda extends StatelessWidget {
  const _DayAgenda({
    required this.date,
    required this.rows,
    this.onEditPlan,
    this.onDeletePlan,
  });

  final String date;
  final List<_AgendaRow> rows;
  final Future<void> Function(PersonalPlan plan)? onEditPlan;
  final Future<void> Function(PersonalPlan plan)? onDeletePlan;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(date, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (rows.isEmpty)
          const Card(
            child: ListTile(title: Text('Nothing scheduled.')),
          ),
        for (final row in rows)
          Card(
            child: ListTile(
              leading: Icon(switch (row.kind) {
                'event' => Icons.event_outlined,
                'plan' => Icons.star_outline,
                'mine' => Icons.school_outlined,
                _ => Icons.schedule_outlined,
              }),
              title: Text(row.title),
              subtitle: Text(row.detail),
              trailing: row.plan != null && onEditPlan != null
                  ? PopupMenuButton<String>(
                      onSelected: (value) {
                        if (value == 'edit') {
                          onEditPlan!(row.plan!);
                        } else {
                          onDeletePlan!(row.plan!);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'edit', child: Text('Edit')),
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    )
                  : StatusChip(
                      label: switch (row.kind) {
                        'event' => 'Event',
                        'plan' => 'My plan',
                        'mine' => 'My class',
                        _ => 'Class',
                      },
                    ),
            ),
          ),
      ],
    );
  }
}

class PlanEditorSheet extends StatefulWidget {
  const PlanEditorSheet({super.key, this.plan, this.initialDate});

  final PersonalPlan? plan;
  final String? initialDate;

  @override
  State<PlanEditorSheet> createState() => _PlanEditorSheetState();
}

class _PlanEditorSheetState extends State<PlanEditorSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _venue;
  String _date = '';
  TimeOfDay _start = const TimeOfDay(hour: 14, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 15, minute: 0);
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.plan?.title ?? '');
    _venue = TextEditingController(text: widget.plan?.venue ?? '');
    _date =
        widget.plan?.date ??
        widget.initialDate ??
        DateTime.now().toIso8601String().substring(0, 10);
    final start = widget.plan?.start;
    if (start != null && start.length >= 5) {
      _start = TimeOfDay(
        hour: int.tryParse(start.substring(0, 2)) ?? 14,
        minute: int.tryParse(start.substring(3, 5)) ?? 0,
      );
    }
    final end = widget.plan?.end;
    if (end != null && end.length >= 5) {
      _end = TimeOfDay(
        hour: int.tryParse(end.substring(0, 2)) ?? 15,
        minute: int.tryParse(end.substring(3, 5)) ?? 0,
      );
    }
  }

  @override
  void dispose() {
    _title.dispose();
    _venue.dispose();
    super.dispose();
  }

  String _fmt(TimeOfDay time) =>
      '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    if (_fmt(_end).compareTo(_fmt(_start)) <= 0) {
      showAppMessage(context, 'Finish after the start time.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await ScheduleRepository(SessionScope.apiOf(context)).savePlan(
        PersonalPlan(
          id: widget.plan?.id ?? newRecordId('plan'),
          title: _title.text.trim(),
          date: _date,
          start: _fmt(_start),
          end: _fmt(_end),
          venue: _venue.text.trim(),
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
      appBar: AppBar(title: const Text('My plan')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (value) => (value ?? '').trim().length >= 3
                  ? null
                  : 'Add a title.',
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Date'),
              subtitle: Text(_date),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime.tryParse(_date) ?? DateTime.now(),
                  firstDate: DateTime.now().subtract(
                    const Duration(days: 30),
                  ),
                  lastDate: DateTime.now().add(const Duration(days: 730)),
                );
                if (picked != null) {
                  setState(
                    () => _date = picked.toIso8601String().substring(0, 10),
                  );
                }
              },
            ),
            Row(
              children: [
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Starts'),
                    subtitle: Text(_fmt(_start)),
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: _start,
                      );
                      if (picked != null) setState(() => _start = picked);
                    },
                  ),
                ),
                Expanded(
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Ends'),
                    subtitle: Text(_fmt(_end)),
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: _end,
                      );
                      if (picked != null) setState(() => _end = picked);
                    },
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
              child: const Text('Save plan'),
            ),
          ],
        ),
      ),
    );
  }
}
