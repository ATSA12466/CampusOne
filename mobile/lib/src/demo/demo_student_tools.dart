import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/photos/app_photos.dart';
import '../core/theme/app_theme.dart';
import 'demo_data.dart';
import 'demo_store.dart';

class DemoTasksScreen extends StatelessWidget {
  const DemoTasksScreen({super.key, required this.store});
  final DemoStore store;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          final tasks = [...store.tasks]
            ..sort((a, b) => a.dueDate.compareTo(b.dueDate));
          return Scaffold(
            appBar: AppBar(title: const Text('My tasks')),
            floatingActionButton: FloatingActionButton.extended(
              onPressed: () => showDialog<void>(
                context: context,
                builder: (_) => _TaskComposer(store: store),
              ),
              icon: const Icon(Icons.add_rounded),
              label: const Text('New task'),
            ),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 96),
              children: [
                _FeatureIntro(
                  eyebrow: 'STAY ON TRACK',
                  title: 'Small steps add up.',
                  subtitle:
                      '${store.tasks.where((task) => !task.completed).length} tasks left to complete',
                  icon: Icons.checklist_rounded,
                ),
                const SizedBox(height: 14),
                Row(children: [
                  Expanded(
                      child: _TaskSummary(
                          value:
                              '${store.tasks.where((task) => !task.completed).length}',
                          label: 'To do',
                          icon: Icons.radio_button_unchecked_rounded,
                          color: Theme.of(context).colorScheme.primary)),
                  const SizedBox(width: 9),
                  Expanded(
                      child: _TaskSummary(
                          value:
                              '${store.tasks.where((task) => task.completed).length}',
                          label: 'Done',
                          icon: Icons.check_circle_outline_rounded,
                          color: const Color(0xFF16805D))),
                ]),
                const SizedBox(height: 12),
                Text('YOUR TASKS',
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1)),
                const SizedBox(height: 8),
                for (final task in tasks)
                  Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 8, 6, 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Checkbox(
                              value: task.completed,
                              onChanged: (_) => store.toggleTask(task.id)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(task.title,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      decoration: task.completed
                                          ? TextDecoration.lineThrough
                                          : null,
                                    )),
                                const SizedBox(height: 5),
                                Text(
                                  '${task.course} \u00b7 ${_dateLabel(task.dueDate)}',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 6),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: task.priority == 'High'
                                      ? Theme.of(context)
                                          .colorScheme
                                          .errorContainer
                                      : Theme.of(context)
                                          .colorScheme
                                          .secondaryContainer,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(task.priority,
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: task.priority == 'High'
                                          ? Theme.of(context)
                                              .colorScheme
                                              .onErrorContainer
                                          : Theme.of(context)
                                              .colorScheme
                                              .onSecondaryContainer,
                                    )),
                              ),
                              IconButton(
                                visualDensity: VisualDensity.compact,
                                tooltip: 'Delete task',
                                onPressed: () => store.removeTask(task.id),
                                icon: const Icon(Icons.delete_outline_rounded,
                                    size: 20),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 10),
                const _LocalDataNote(),
              ],
            ),
          );
        },
      );
}

class _TaskSummary extends StatelessWidget {
  const _TaskSummary(
      {required this.value,
      required this.label,
      required this.icon,
      required this.color});
  final String value, label;
  final IconData icon;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(18),
          border:
              Border.all(color: Theme.of(context).colorScheme.outlineVariant)),
      child: Row(children: [
        Icon(icon, color: color),
        const SizedBox(width: 9),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value,
              style:
                  const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          Text(label,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11))
        ])
      ]));
}

class _TaskComposer extends StatefulWidget {
  const _TaskComposer({required this.store});
  final DemoStore store;
  @override
  State<_TaskComposer> createState() => _TaskComposerState();
}

class _TaskComposerState extends State<_TaskComposer> {
  final _formKey = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _course = TextEditingController();
  DateTime _due = DateTime.now().add(const Duration(days: 1));
  String _priority = 'Medium';

  @override
  void dispose() {
    _title.dispose();
    _course.dispose();
    super.dispose();
  }

  Future<void> _chooseDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _due,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 730)),
    );
    if (selected != null && mounted) setState(() => _due = selected);
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Add a task'),
        content: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TextFormField(
                controller: _title,
                autofocus: true,
                decoration: const InputDecoration(labelText: 'Task title'),
                validator: (value) => value == null || value.trim().isEmpty
                    ? 'Enter a task title'
                    : null,
              ),
              TextField(
                  controller: _course,
                  decoration:
                      const InputDecoration(labelText: 'Course or category')),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: _priority,
                decoration: const InputDecoration(labelText: 'Priority'),
                items: const [
                  DropdownMenuItem(value: 'High', child: Text('High')),
                  DropdownMenuItem(value: 'Medium', child: Text('Medium')),
                  DropdownMenuItem(value: 'Low', child: Text('Low')),
                ],
                onChanged: (value) =>
                    setState(() => _priority = value ?? 'Medium'),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _chooseDate,
                  icon: const Icon(Icons.calendar_month_rounded),
                  label: Text('Due ${_dateLabel(_due)}'),
                ),
              ),
            ]),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              if (!_formKey.currentState!.validate()) return;
              widget.store.addTask(
                  title: _title.text,
                  course: _course.text,
                  dueDate: _due,
                  priority: _priority);
              Navigator.pop(context);
            },
            child: const Text('Add task'),
          ),
        ],
      );
}

class DemoTimetableScreen extends StatefulWidget {
  const DemoTimetableScreen({super.key, required this.store});
  final DemoStore store;
  @override
  State<DemoTimetableScreen> createState() => _DemoTimetableScreenState();
}

class _DemoTimetableScreenState extends State<DemoTimetableScreen> {
  String? _schedulePhoto;
  bool _assistPreview = false;
  Future<void> _uploadSchedule() async {
    try {
      final photo = await AppPhotos.pickDataUrl(source: ImageSource.gallery);
      if (photo != null && mounted) setState(() => _schedulePhoto = photo);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text(
                'Could not load this timetable image. Try a smaller photo.')));
      }
    }
  }

  void _showAssistPreview() {
    setState(() => _assistPreview = true);
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text(
            'Smart timetable preview: review the sample schedule below and edit it before relying on it.')));
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) => Scaffold(
          appBar: AppBar(title: const Text('Timetable')),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => showDialog<void>(
                context: context,
                builder: (_) => _ClassComposer(store: widget.store)),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Add class'),
          ),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 96),
            children: [
              const _FeatureIntro(
                  eyebrow: 'YOUR WEEK',
                  title: 'A clear week ahead.',
                  subtitle:
                      'Sample classes you can manage for this presentation.',
                  icon: Icons.calendar_view_week_rounded),
              const SizedBox(height: 16),
              ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(children: [
                    AspectRatio(
                        aspectRatio: 2.15,
                        child: Image.asset(
                            'assets/demo/study-library-pexels.jpg',
                            fit: BoxFit.cover)),
                    Positioned.fill(
                        child: DecoratedBox(
                            decoration: BoxDecoration(
                                gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: .75)
                        ])))),
                    const Positioned(
                        left: 16,
                        right: 16,
                        bottom: 13,
                        child: Text('Plan your week with confidence',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.w800)))
                  ])),
              const SizedBox(height: 12),
              Card(
                  child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Build from your timetable',
                                style: TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text(
                                'Upload a timetable image, then review and enter recognized classes. Smart extraction is a preview in this demo.',
                                style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontSize: 12,
                                    height: 1.35)),
                            const SizedBox(height: 12),
                            if (_schedulePhoto != null)
                              ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: Image.memory(
                                      base64Decode(
                                          _schedulePhoto!.split(',').last),
                                      height: 140,
                                      width: double.infinity,
                                      fit: BoxFit.cover)),
                            Wrap(spacing: 8, runSpacing: 8, children: [
                              OutlinedButton.icon(
                                  onPressed: _uploadSchedule,
                                  icon: const Icon(Icons.upload_file_rounded),
                                  label: Text(_schedulePhoto == null
                                      ? 'Upload image'
                                      : 'Replace image')),
                              FilledButton.tonalIcon(
                                  onPressed: _schedulePhoto == null
                                      ? null
                                      : _showAssistPreview,
                                  icon: const Icon(Icons.auto_awesome_rounded),
                                  label: const Text('Smart assist'))
                            ]),
                            if (_assistPreview)
                              Text(
                                  'Preview suggestion: compare the uploaded timetable with the class list below and correct every day, time and room.',
                                  style: TextStyle(
                                      fontSize: 11,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary))
                          ]))),
              const SizedBox(height: 8),
              for (final day in const [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday'
              ])
                if (widget.store.classes
                    .any((session) => session.day == day)) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 12, 4, 7),
                    child: Text(day,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontSize: 16,
                            fontWeight: FontWeight.w800)),
                  ),
                  for (final session
                      in widget.store.classes.where((item) => item.day == day))
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                            backgroundColor: Color(0xFFEAF0FF),
                            child: Icon(Icons.menu_book_rounded,
                                color: Theme.of(context).colorScheme.primary)),
                        title: Text(session.course,
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(
                            '${session.time}\n${session.venue}${session.lecturer.isEmpty ? '' : '  |  ${session.lecturer}'}'),
                        isThreeLine: true,
                        trailing: IconButton(
                            tooltip: 'Remove sample class',
                            onPressed: () =>
                                widget.store.removeClass(session.id),
                            icon: const Icon(Icons.close_rounded)),
                      ),
                    ),
                ],
              if (widget.store.classes.isEmpty)
                const Card(
                    child: ListTile(
                        leading: Icon(Icons.event_busy_outlined),
                        title: Text('No classes added yet'),
                        subtitle: Text(
                            'Add a class or upload a timetable image to begin.'))),
              const _LocalDataNote(),
            ],
          ),
        ),
      );
}

class _ClassComposer extends StatefulWidget {
  const _ClassComposer({required this.store});
  final DemoStore store;
  @override
  State<_ClassComposer> createState() => _ClassComposerState();
}

class _ClassComposerState extends State<_ClassComposer> {
  final _course = TextEditingController();
  final _time = TextEditingController();
  final _venue = TextEditingController();
  String _day = 'Monday';
  @override
  void dispose() {
    _course.dispose();
    _time.dispose();
    _venue.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AlertDialog(
        title: const Text('Add a class'),
        content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
          TextField(
              controller: _course,
              decoration: const InputDecoration(labelText: 'Course name')),
          DropdownButtonFormField<String>(
              initialValue: _day,
              decoration: const InputDecoration(labelText: 'Day'),
              items: [
                for (final day in const [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                ])
                  DropdownMenuItem(value: day, child: Text(day))
              ],
              onChanged: (value) => setState(() => _day = value ?? 'Monday')),
          TextField(
              controller: _time,
              decoration: const InputDecoration(
                  labelText: 'Time, e.g. 9:00 AM - 11:00 AM')),
          TextField(
              controller: _venue,
              decoration: const InputDecoration(labelText: 'Venue')),
        ])),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () {
                if (_course.text.trim().isEmpty) return;
                widget.store.addClass(DemoClassSession(
                    id: DateTime.now().microsecondsSinceEpoch.toString(),
                    day: _day,
                    course: _course.text.trim(),
                    time: _time.text.trim().isEmpty
                        ? 'Time not set'
                        : _time.text.trim(),
                    venue: _venue.text.trim().isEmpty
                        ? 'Venue not set'
                        : _venue.text.trim()));
                Navigator.pop(context);
              },
              child: const Text('Save class')),
        ],
      );
}

class DemoCalendarScreen extends StatefulWidget {
  const DemoCalendarScreen({super.key, required this.store});
  final DemoStore store;
  @override
  State<DemoCalendarScreen> createState() => _DemoCalendarScreenState();
}

class _DemoCalendarScreenState extends State<DemoCalendarScreen> {
  DateTime _selected = DateTime.now();
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) {
          final dayTasks = widget.store.tasks
              .where((task) => _sameDay(task.dueDate, _selected))
              .toList();
          final eventIndexDates = [
            DateTime(2026, 10, 22),
            DateTime(2026, 10, 26),
            DateTime(2026, 10, 28),
            DateTime(2026, 10, 30)
          ];
          final dayEvents = [
            for (var i = 0; i < demoEvents.length; i++)
              if (_sameDay(eventIndexDates[i], _selected)) demoEvents[i]
          ];
          return Scaffold(
            appBar: AppBar(title: const Text('Calendar')),
            body: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                children: [
                  ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Stack(children: [
                        AspectRatio(
                            aspectRatio: 2.35,
                            child: Image.asset(
                                'assets/demo/study-library-pexels.jpg',
                                fit: BoxFit.cover)),
                        Positioned.fill(
                            child: DecoratedBox(
                                decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                        begin: Alignment.topCenter,
                                        end: Alignment.bottomCenter,
                                        colors: [
                              Colors.transparent,
                              Colors.black.withValues(alpha: .76)
                            ])))),
                        const Positioned(
                            left: 16,
                            right: 16,
                            bottom: 14,
                            child: Text('Keep your campus week in view',
                                style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800)))
                      ])),
                  const SizedBox(height: 12),
                  Card(
                      child: CalendarDatePicker(
                          initialDate: _selected,
                          firstDate: DateTime(2025),
                          lastDate: DateTime(2030),
                          onDateChanged: (date) =>
                              setState(() => _selected = date))),
                  const SizedBox(height: 12),
                  Text(_dateLabel(_selected),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (dayTasks.isEmpty && dayEvents.isEmpty)
                    const Card(
                        child: ListTile(
                            leading: Icon(Icons.wb_sunny_outlined),
                            title: Text('Nothing planned yet'),
                            subtitle:
                                Text('Add a task or explore campus events.'))),
                  for (final task in dayTasks)
                    Card(
                        child: ListTile(
                            leading: Icon(
                                task.completed
                                    ? Icons.check_circle
                                    : Icons.task_alt_rounded,
                                color: Theme.of(context).colorScheme.primary),
                            title: Text(task.title),
                            subtitle: Text('Task | ${task.course}'),
                            trailing: Checkbox(
                                value: task.completed,
                                onChanged: (_) =>
                                    widget.store.toggleTask(task.id)))),
                  for (final event in dayEvents)
                    Card(
                        child: ListTile(
                            leading: Icon(event.icon,
                                color: Theme.of(context).colorScheme.primary),
                            title: Text(event.title),
                            subtitle: Text(
                                'Event | ${event.time} | ${event.venue}'))),
                  const SizedBox(height: 12),
                  const _LocalDataNote(),
                ]),
          );
        },
      );
}

class DemoClassRepScreen extends StatefulWidget {
  const DemoClassRepScreen({super.key});
  @override
  State<DemoClassRepScreen> createState() => _DemoClassRepScreenState();
}

class _DemoClassRepScreenState extends State<DemoClassRepScreen> {
  final List<String> _notices = [
    'Confirm course registration before Friday.',
    'Study group meets in Block C after the afternoon lecture.',
  ];
  final List<String> _issues = [];
  final List<(String, String)> _materials = [
    ('Data Communications - Week 4 slides', 'Data Communications'),
    ('Database normalization revision notes', 'Database Systems'),
    ('Web development syllabus', 'Web Application Development'),
  ];
  static const _courses = [
    'Data Communications',
    'Web Application Development',
    'Database Systems',
    'Research Methods',
    'Human Computer Interaction',
  ];
  static const _classmates = [
    'Ama Serwaa',
    'Nana Boateng',
    'Abena Owusu',
    'Kojo Mensah',
    'Esi Arthur',
  ];

  Future<void> _addEntry({required bool issue, bool report = false}) async {
    final controller = TextEditingController();
    var channel = 'Lecturer';
    final text = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(issue
            ? report
                ? 'Prepare class report'
                : 'Report a class concern'
            : 'Publish class notice'),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            if (issue)
              StatefulBuilder(
                  builder: (context, setDialogState) =>
                      DropdownButtonFormField<String>(
                        initialValue: channel,
                        decoration: const InputDecoration(labelText: 'Send to'),
                        items: const ['Lecturer', 'Department', 'SRC']
                            .map((value) => DropdownMenuItem(
                                value: value, child: Text(value)))
                            .toList(),
                        onChanged: (value) {
                          if (value != null) {
                            setDialogState(() => channel = value);
                          }
                        },
                      )),
            TextField(
              controller: controller,
              autofocus: !issue,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: issue
                    ? report
                        ? 'Summarize the class update or unresolved issue'
                        : 'Describe the concern'
                    : 'Write a clear class update',
              ),
            ),
            const SizedBox(height: 8),
            Text('This entry is saved locally in the demo.',
                style: TextStyle(
                    fontSize: 12,
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ]),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, controller.text.trim()),
              child: Text(issue ? 'Submit' : 'Publish')),
        ],
      ),
    );
    controller.dispose();
    if (text == null || !mounted) return;
    if (text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Add a message before submitting.')));
      return;
    }
    setState(() =>
        issue ? _issues.insert(0, '$channel|$text') : _notices.insert(0, text));
  }

  Future<void> _addMaterial() async {
    final title = TextEditingController();
    var course = _courses.first;
    final entry = await showDialog<(String, String)>(
      context: context,
      builder: (context) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
                title: const Text('Add class resource'),
                content: SingleChildScrollView(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    TextField(
                        controller: title,
                        autofocus: true,
                        decoration:
                            const InputDecoration(labelText: 'Resource title')),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: course,
                      decoration: const InputDecoration(labelText: 'Course'),
                      items: _courses
                          .map((value) => DropdownMenuItem(
                              value: value,
                              child:
                                  Text(value, overflow: TextOverflow.ellipsis)))
                          .toList(),
                      onChanged: (value) {
                        if (value != null) setDialogState(() => course = value);
                      },
                    ),
                    const SizedBox(height: 8),
                    Text('Publication may require lecturer approval.',
                        style: TextStyle(
                            fontSize: 12,
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant)),
                  ]),
                ),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel')),
                  FilledButton(
                      onPressed: () =>
                          Navigator.pop(context, (title.text.trim(), course)),
                      child: const Text('Add')),
                ],
              )),
    );
    title.dispose();
    if (entry != null && entry.$1.isNotEmpty && mounted) {
      setState(() => _materials.insert(0, entry));
    } else if (entry != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Add a resource title first.')));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Course Rep Portal')),
        body: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: SizedBox(
                  height: 188,
                  child: Stack(fit: StackFit.expand, children: [
                    Image.asset(
                      'assets/demo/gctu-students-1.jpg',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => ColoredBox(
                          color: Theme.of(context).colorScheme.primary),
                    ),
                    const DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Color(0xE600173F)],
                        ),
                      ),
                    ),
                    Positioned(
                      left: 18,
                      right: 18,
                      bottom: 18,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('YOUR CLASS, IN SYNC',
                              style: TextStyle(
                                  color: Color(0xFFFFD34D),
                                  fontSize: 10,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.w800)),
                          const SizedBox(height: 5),
                          Text('Keep everyone moving forward.',
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineSmall
                                  ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800)),
                          const Text(
                              'Updates, learning resources and class support in one place.',
                              style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: 14),
              Card(
                child: ListTile(
                  leading: CircleAvatar(
                      backgroundColor:
                          Theme.of(context).colorScheme.primaryContainer,
                      child: Icon(Icons.verified_user_outlined,
                          color: Theme.of(context).colorScheme.primary)),
                  title: const Text('Course Rep - IT Level 300',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                  subtitle:
                      const Text('Verified demo role · one assigned class'),
                  trailing: const Icon(Icons.lock_outline_rounded, size: 18),
                ),
              ),
              const SizedBox(height: 10),
              const _RepSectionTitle(
                  title: 'Class dashboard',
                  subtitle: 'Assigned class overview'),
              Row(children: [
                const Expanded(
                    child: _RepStat(value: '32', label: 'Classmates')),
                const SizedBox(width: 8),
                Expanded(
                    child: _RepStat(
                        value: '${_courses.length}', label: 'Courses')),
                const SizedBox(width: 8),
                Expanded(
                    child: _RepStat(
                        value: '${_issues.length}', label: 'Open reports')),
              ]),
              const SizedBox(height: 16),
              const _RepSectionTitle(
                  title: 'Quick actions',
                  subtitle: 'Share an update or route a concern'),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(children: [
                  ActionChip(
                    avatar: const Icon(Icons.campaign_outlined),
                    label: const Text('Post announcement'),
                    onPressed: () => _addEntry(issue: false),
                  ),
                  const SizedBox(width: 8),
                  ActionChip(
                    avatar: const Icon(Icons.upload_file_outlined),
                    label: const Text('Add material'),
                    onPressed: _addMaterial,
                  ),
                  const SizedBox(width: 8),
                  ActionChip(
                    avatar: const Icon(Icons.outlined_flag_rounded),
                    label: const Text('Raise concern'),
                    onPressed: () => _addEntry(issue: true),
                  ),
                ]),
              ),
              const SizedBox(height: 20),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Expanded(
                    child: _RepSectionTitle(
                        title: 'Class announcements',
                        subtitle: 'Notices, reminders and schedule changes')),
                TextButton.icon(
                    onPressed: () => _addEntry(issue: false),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('New')),
              ]),
              for (final notice in _notices)
                Card(
                    child: ListTile(
                        leading: Icon(Icons.campaign_outlined,
                            color: Theme.of(context).colorScheme.primary),
                        title: Text(notice),
                        subtitle: const Text('Class update · Local demo'),
                        isThreeLine: true)),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Expanded(
                    child: _RepSectionTitle(
                        title: 'Academic materials',
                        subtitle: 'Organized by assigned course')),
                TextButton.icon(
                    onPressed: _addMaterial,
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Add')),
              ]),
              for (final material in _materials)
                Card(
                    child: ListTile(
                  leading: Icon(Icons.description_outlined,
                      color: Theme.of(context).colorScheme.primary),
                  title: Text(material.$1,
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  subtitle: Text(material.$2),
                  isThreeLine: true,
                  trailing: const Icon(Icons.download_for_offline_outlined),
                  onTap: () => _showRepInfo(context, material.$1,
                      'Sample class resource. Materials are shared only with this assigned class and may require lecturer approval.'),
                )),
              const SizedBox(height: 8),
              const _RepSectionTitle(
                  title: 'Course management',
                  subtitle: 'Five courses assigned to IT Level 300'),
              for (final course in _courses)
                Card(
                    child: ExpansionTile(
                  leading: Icon(Icons.menu_book_outlined,
                      color: Theme.of(context).colorScheme.primary),
                  title: Text(course),
                  subtitle: Text(
                      '${_materials.where((item) => item.$2 == course).length} shared resources'),
                  children: [
                    for (final resource
                        in _materials.where((item) => item.$2 == course))
                      ListTile(
                          dense: true,
                          leading: const Icon(Icons.insert_drive_file_outlined,
                              size: 18),
                          title: Text(resource.$1)),
                    if (!_materials.any((item) => item.$2 == course))
                      const ListTile(
                          dense: true, title: Text('No shared resources yet.')),
                  ],
                )),
              const SizedBox(height: 8),
              const _RepSectionTitle(
                  title: 'Class directory',
                  subtitle: 'Privacy-aware sample class list'),
              Card(
                  child: Column(children: [
                for (final name in _classmates)
                  ListTile(
                      dense: true,
                      leading: const CircleAvatar(
                          radius: 17,
                          child: Icon(Icons.person_outline_rounded, size: 18)),
                      title: Text(name)),
                Padding(
                    padding: EdgeInsets.fromLTRB(14, 0, 14, 14),
                    child: Text(
                        'Private contact details and student records are not shown in this preview.',
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 11))),
              ])),
              const SizedBox(height: 8),
              const _RepSectionTitle(
                  title: 'Timetable & deadlines',
                  subtitle: 'Upcoming dates for your class'),
              for (final deadline in const [
                (
                  'MON, 26 OCT',
                  'Data Communications test',
                  'Block C · 9:00 AM'
                ),
                (
                  'WED, 28 OCT',
                  'Database assignment due',
                  'Upload before 5:00 PM'
                ),
                ('FRI, 30 OCT', 'Web development lab', 'ICT Lab 2 · 1:00 PM'),
              ])
                Card(
                    child: ListTile(
                        leading: Icon(Icons.event_note_rounded,
                            color: Theme.of(context).colorScheme.primary),
                        title: Text(deadline.$2),
                        subtitle: Text('${deadline.$1} · ${deadline.$3}'))),
              const SizedBox(height: 8),
              const _RepSectionTitle(
                  title: 'Attendance & class activities',
                  subtitle: 'Approved class tracking only'),
              Card(
                  child: ListTile(
                leading: Icon(Icons.fact_check_outlined,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('Data Communications tutorial'),
                subtitle:
                    const Text('Sample attendance summary · 27 of 32 present'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => _showRepInfo(context, 'Class attendance',
                    'Attendance tracking must be approved for the class. This sample record is read-only.'),
              )),
              const SizedBox(height: 8),
              const _RepSectionTitle(
                  title: 'Class communication',
                  subtitle: 'Keep updates in the right class space'),
              Card(
                  child: ListTile(
                leading: Icon(Icons.forum_outlined,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('IT Level 300 class group'),
                subtitle: const Text('Approved class communication · Demo'),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => _showRepInfo(context, 'Class group',
                    'This link would open the approved communication space for IT Level 300. Messaging is not connected in the demo.'),
              )),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Expanded(
                    child: _RepSectionTitle(
                        title: 'Student concerns & reports',
                        subtitle:
                            'Route concerns to the right academic channel')),
                TextButton.icon(
                    onPressed: () => _addEntry(issue: true),
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('Report')),
              ]),
              if (_issues.isEmpty)
                const Card(
                    child: ListTile(
                        leading: Icon(Icons.inbox_outlined),
                        title: Text('No local reports yet'),
                        subtitle: Text(
                            'Add a sample concern to preview the class workflow.'))),
              for (final issue in _issues)
                Card(
                    child: ListTile(
                        leading: const Icon(Icons.pending_actions_rounded,
                            color: Color(0xFF9B6900)),
                        title: Text(issue.split('|').last,
                            maxLines: 3, overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                            'Sent to ${issue.split('|').first} · Awaiting review - Demo'))),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _addEntry(issue: true, report: true),
                icon: const Icon(Icons.summarize_outlined),
                label: const Text('Prepare class report'),
              ),
              const SizedBox(height: 10),
              const _LocalDataNote(),
              Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                      'This is a student-side demo for one assigned class. Rep verification, publishing approvals and submissions are sample flows; the admin dashboard and backend enforce real permissions.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 11,
                          height: 1.4))),
            ]),
      );
}

void _showRepInfo(BuildContext context, String title, String detail) =>
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(detail),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close')),
        ],
      ),
    );

class _RepSectionTitle extends StatelessWidget {
  const _RepSectionTitle({required this.title, required this.subtitle});
  final String title, subtitle;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontSize: 15,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11)),
        ]),
      );
}

class _RepStat extends StatelessWidget {
  const _RepStat({required this.value, required this.label});
  final String value;
  final String label;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerLow,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: Theme.of(context).colorScheme.outlineVariant)),
        child: Column(children: [
          Text(value,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 3),
          Text(label,
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 10))
        ]),
      );
}

class DemoStudyAssistantScreen extends StatefulWidget {
  const DemoStudyAssistantScreen({super.key});
  @override
  State<DemoStudyAssistantScreen> createState() =>
      _DemoStudyAssistantScreenState();
}

class _DemoStudyAssistantScreenState extends State<DemoStudyAssistantScreen> {
  final _topic = TextEditingController();
  String _tool = 'Explain';
  String? _response;
  static const _tools = [
    'Explain',
    'Practice questions',
    'Flashcards',
    'Study plan'
  ];

  @override
  void dispose() {
    _topic.dispose();
    super.dispose();
  }

  void _generate() {
    final topic =
        _topic.text.trim().isEmpty ? 'your selected topic' : _topic.text.trim();
    final output = switch (_tool) {
      'Practice questions' =>
        'Try these questions about $topic:\n\n1. Define the central idea in your own words.\n2. Give one practical example.\n3. What common mistake should a student avoid?\n\nUse your lecturer-approved notes to check your answers.',
      'Flashcards' =>
        'Flashcard 1\nFront: What is the key idea behind $topic?\nBack: Write a short definition from your course notes.\n\nFlashcard 2\nFront: Give an example of $topic.\nBack: Add a worked example from your lecture material.',
      'Study plan' =>
        'A 30-minute starter plan for $topic:\n\n10 min: Review your class notes.\n10 min: Write a short summary without looking.\n5 min: Attempt one practice question.\n5 min: Check the answer and note what to revisit.',
      _ =>
        'Start with a plain-language definition of $topic. Break it into its main parts, connect each part to a practical example, then test yourself by explaining it without your notes.\n\nUse your approved course materials to confirm details.',
    };
    setState(() => _response = output);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Study assistant')),
        body: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
            children: [
              const _FeatureIntro(
                  eyebrow: 'STUDY TOOLS',
                  title: 'Make a good study session.',
                  subtitle: 'Choose a tool and a course topic to get started.',
                  icon: Icons.auto_awesome_rounded),
              const SizedBox(height: 14),
              ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(children: [
                    AspectRatio(
                        aspectRatio: 1.9,
                        child: Image.asset(
                            'assets/demo/study-library-pexels.jpg',
                            fit: BoxFit.cover)),
                    Positioned.fill(
                        child: DecoratedBox(
                            decoration: BoxDecoration(
                                gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: .78)
                        ])))),
                    const Positioned(
                        left: 16,
                        right: 16,
                        bottom: 14,
                        child: Text('Study with focus. Learn at your pace.',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800)))
                  ])),
              const SizedBox(height: 10),
              Text(
                  'Try a topic: Database normalization · OSI model · Research design',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 12)),
              const SizedBox(height: 18),
              TextField(
                  controller: _topic,
                  decoration: const InputDecoration(
                      labelText: 'Course or topic',
                      hintText: 'e.g. Database normalization',
                      prefixIcon: Icon(Icons.menu_book_outlined))),
              const SizedBox(height: 14),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final tool in _tools)
                  ChoiceChip(
                      label: Text(tool),
                      selected: _tool == tool,
                      onSelected: (_) => setState(() {
                            _tool = tool;
                            _response = null;
                          }))
              ]),
              const SizedBox(height: 16),
              FilledButton.icon(
                  onPressed: _generate,
                  icon: const Icon(Icons.auto_awesome_rounded),
                  label: Text('Create $_tool')),
              if (_response != null) ...[
                const SizedBox(height: 16),
                Card(
                    color: const Color(0xFFEAF0FF),
                    child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('OFFLINE STUDY PREVIEW',
                                  style: TextStyle(
                                      color:
                                          Theme.of(context).colorScheme.primary,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: .8)),
                              const SizedBox(height: 10),
                              Text(_response!,
                                  style: TextStyle(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .onSurface,
                                      height: 1.5)),
                            ]))),
              ],
              const SizedBox(height: 14),
              const _LocalDataNote(),
              Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text(
                      'This presentation uses built-in study prompts. It does not connect to an AI model and does not verify answers against uploaded course files.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 11,
                          height: 1.4))),
            ]),
      );
}

class DemoMaterialsScreen extends StatelessWidget {
  const DemoMaterialsScreen({super.key, required this.store});
  final DemoStore store;

  static const materials = <_DemoMaterial>[
    _DemoMaterial(
      id: 'mat-db',
      title: 'Database Systems: Normalization',
      course: 'Database Systems',
      kind: 'Lecture notes',
      icon: Icons.storage_rounded,
      description:
          'A concise revision guide to relational design, functional dependencies and normal forms.',
    ),
    _DemoMaterial(
      id: 'mat-net',
      title: 'Computer Networks: Core Concepts',
      course: 'Computer Networks',
      kind: 'Study guide',
      icon: Icons.router_rounded,
      description:
          'OSI layers, addressing, routing and common network protocols.',
    ),
    _DemoMaterial(
      id: 'mat-web',
      title: 'Web Application Development',
      course: 'Web Application Development',
      kind: 'Past questions',
      icon: Icons.language_rounded,
      description:
          'Practice questions covering HTTP, APIs, client-side development and web security.',
    ),
    _DemoMaterial(
      id: 'mat-research',
      title: 'Research Methods',
      course: 'Research Methods',
      kind: 'Syllabus',
      icon: Icons.science_outlined,
      description:
          'A sample syllabus covering research design, methodology and academic writing.',
    ),
  ];

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) => Scaffold(
          appBar: AppBar(title: const Text('Learning materials')),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
            children: [
              const _FeatureIntro(
                eyebrow: 'LEARN',
                title: 'Keep learning moving.',
                subtitle: 'Browse sample resources by course.',
                icon: Icons.auto_stories_rounded,
              ),
              const SizedBox(height: 14),
              ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(children: [
                    AspectRatio(
                        aspectRatio: 2.15,
                        child: Image.asset(
                            'assets/demo/study-library-pexels.jpg',
                            fit: BoxFit.cover)),
                    Positioned.fill(
                        child: DecoratedBox(
                            decoration: BoxDecoration(
                                gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: .78)
                        ])))),
                    const Positioned(
                        left: 16,
                        right: 16,
                        bottom: 14,
                        child: Text('A resource for every study session',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800)))
                  ])),
              const SizedBox(height: 14),
              Text('COURSE LIBRARY',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 10,
                      letterSpacing: 1,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: materials.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: .82),
                  itemBuilder: (context, index) {
                    final material = materials[index];
                    return InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap: () => _showMaterial(context, material),
                        child: Card(
                            clipBehavior: Clip.antiAlias,
                            margin: EdgeInsets.zero,
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                      child: Container(
                                          width: double.infinity,
                                          decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                  begin: Alignment.topLeft,
                                                  end: Alignment.bottomRight,
                                                  colors: index.isEven
                                                      ? const [
                                                          Color(0xFF0F2F70),
                                                          Color(0xFF4278BD)
                                                        ]
                                                      : const [
                                                          Color(0xFF08746B),
                                                          Color(0xFF51B39C)
                                                        ]),
                                              image: const DecorationImage(
                                                  image: AssetImage(
                                                      'assets/demo/study-library-pexels.jpg'),
                                                  fit: BoxFit.cover,
                                                  opacity: .38)),
                                          child: Stack(children: [
                                            Positioned(
                                                left: 10,
                                                top: 10,
                                                child: Icon(material.icon,
                                                    color: Colors.white,
                                                    size: 30)),
                                            Positioned(
                                                right: 4,
                                                top: 2,
                                                child: IconButton(
                                                    tooltip:
                                                        store.isMaterialSaved(
                                                                material.id)
                                                            ? 'Unsave'
                                                            : 'Save',
                                                    onPressed: () => store
                                                        .toggleSavedMaterial(
                                                            material.id),
                                                    icon: Icon(
                                                        store.isMaterialSaved(
                                                                material.id)
                                                            ? Icons
                                                                .bookmark_rounded
                                                            : Icons
                                                                .bookmark_border_rounded,
                                                        color: Colors.white)))
                                          ]))),
                                  Padding(
                                      padding: const EdgeInsets.all(11),
                                      child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(material.kind.toUpperCase(),
                                                style: TextStyle(
                                                    fontSize: 9,
                                                    color: Theme.of(context)
                                                        .colorScheme
                                                        .primary,
                                                    fontWeight: FontWeight.w800,
                                                    letterSpacing: .7)),
                                            const SizedBox(height: 4),
                                            Text(material.title,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 13)),
                                            const SizedBox(height: 4),
                                            Text(material.course,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: TextStyle(
                                                    color: Theme.of(context)
                                                        .colorScheme
                                                        .onSurfaceVariant,
                                                    fontSize: 10))
                                          ]))
                                ])));
                  }),
              const _LocalDataNote(),
            ],
          ),
        ),
      );

  void _showMaterial(BuildContext context, _DemoMaterial material) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(material.title),
        content: Text(
          '${material.description}\n\nSample resource for this offline presentation.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          FilledButton.icon(
            onPressed: () {
              store.toggleSavedMaterial(material.id);
              Navigator.pop(context);
            },
            icon: const Icon(Icons.bookmark_add_outlined),
            label: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _DemoMaterial {
  const _DemoMaterial(
      {required this.id,
      required this.title,
      required this.course,
      required this.kind,
      required this.icon,
      required this.description});
  final String id;
  final String title;
  final String course;
  final String kind;
  final IconData icon;
  final String description;
}

class _FeatureIntro extends StatelessWidget {
  const _FeatureIntro(
      {required this.eyebrow,
      required this.title,
      required this.subtitle,
      required this.icon});
  final String eyebrow;
  final String title;
  final String subtitle;
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  CampusColors.primaryDark,
                  CampusColors.primary,
                  Color(0xFF4776B9)
                ])),
        child: Row(children: [
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(eyebrow,
                    style: const TextStyle(
                        color: CampusColors.accent,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: .8)),
                const SizedBox(height: 8),
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 5),
                Text(subtitle,
                    style: const TextStyle(color: Colors.white70, fontSize: 12))
              ])),
          const SizedBox(width: 10),
          Icon(icon, size: 36, color: CampusColors.accent),
        ]),
      );
}

class _LocalDataNote extends StatelessWidget {
  const _LocalDataNote();
  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Text(
            'DEMO DATA · Changes stay on this device session and are not sent to a server.',
            textAlign: TextAlign.center,
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 10,
                fontWeight: FontWeight.w600)),
      );
}

String _dateLabel(DateTime date) =>
    '${_month(date.month)} ${date.day}, ${date.year}';
String _month(int month) => const [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ][month - 1];
bool _sameDay(DateTime a, DateTime b) =>
    a.year == b.year && a.month == b.month && a.day == b.day;
