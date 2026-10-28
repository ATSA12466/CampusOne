import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Offline-first study tools. User-created data is stored on this device.
class DemoStudyHubScreen extends StatefulWidget {
  const DemoStudyHubScreen({super.key, this.initialSection = 0});

  final int initialSection;

  @override
  State<DemoStudyHubScreen> createState() => _DemoStudyHubScreenState();
}

class _DemoStudyHubScreenState extends State<DemoStudyHubScreen> {
  static const _storageKey = 'campusone.study_hub.v1';
  static const _weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  final _courses = <String>[];
  final _cards = <_StudyCard>[];
  Timer? _timer;
  int _focusSeconds = 25 * 60;
  int _focusTotal = 25 * 60;
  int _focusMinutes = 0;
  int _completedSessions = 0;
  bool _running = false;
  bool _loaded = false;
  int _section = 0;

  @override
  void initState() {
    super.initState();
    _section = widget.initialSection.clamp(0, 2).toInt();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_storageKey);
    if (raw != null) {
      try {
        final data = jsonDecode(raw) as Map<String, dynamic>;
        _courses.addAll((data['courses'] as List? ?? const []).cast<String>());
        _cards.addAll((data['cards'] as List? ?? const []).map(
          (item) => _StudyCard.fromJson(item as Map<String, dynamic>),
        ));
        _focusMinutes = data['focusMinutes'] as int? ?? 0;
        _completedSessions = data['completedSessions'] as int? ?? 0;
      } catch (_) {
        // Ignore an older or corrupt local cache; the screen remains usable.
      }
    }
    if (mounted) setState(() => _loaded = true);
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, jsonEncode({
      'courses': _courses,
      'cards': _cards.map((card) => card.toJson()).toList(),
      'focusMinutes': _focusMinutes,
      'completedSessions': _completedSessions,
    }));
  }

  Future<void> _addCourses() async {
    final controller = TextEditingController();
    final input = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add courses'),
        content: TextField(
          controller: controller,
          autofocus: true,
          minLines: 3,
          maxLines: 7,
          decoration: const InputDecoration(
            labelText: 'Paste a course list or class chat message',
            hintText: 'BIT 264, acf 251 fin. accounting',
            alignLabelWithHint: true,
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, controller.text), child: const Text('Find courses')),
        ],
      ),
    );
    controller.dispose();
    if (input == null) return;
    final found = _extractCourses(input);
    if (found.isEmpty) {
      if (mounted) _message('No course codes found. Try a code such as BIT 264.');
      return;
    }
    final added = found.where((course) => !_courses.contains(course)).toList();
    setState(() => _courses.addAll(added));
    await _save();
    if (mounted) _message('${added.length} course${added.length == 1 ? '' : 's'} added. Review the list below.');
  }

  List<String> _extractCourses(String input) {
    final pattern = RegExp(r'\b([A-Za-z]{2,6})\s*[- ]?\s*(\d{3})\b(?:\s+([^,;\n|]+))?');
    final result = <String>[];
    for (final match in pattern.allMatches(input)) {
      final code = '${match.group(1)!.toUpperCase()} ${match.group(2)}';
      final name = (match.group(3) ?? '').trim().replaceAll(RegExp(r'\s+'), ' ');
      final course = name.isEmpty ? code : '$code · $name';
      if (!result.contains(course)) result.add(course);
    }
    return result;
  }

  Future<void> _removeCourse(String course) async {
    setState(() => _courses.remove(course));
    await _save();
  }

  Future<void> _addCard() async {
    if (_courses.isEmpty) {
      _message('Add a course first so your flashcard is organized.');
      return;
    }
    final form = GlobalKey<FormState>();
    final front = TextEditingController();
    final back = TextEditingController();
    var course = _courses.first;
    final created = await showDialog<_StudyCard>(
      context: context,
      builder: (context) => StatefulBuilder(builder: (context, setDialogState) => AlertDialog(
        title: const Text('New flashcard'),
        content: Form(
          key: form,
          child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<String>(
              initialValue: course,
              decoration: const InputDecoration(labelText: 'Course'),
              items: _courses.map((value) => DropdownMenuItem(value: value, child: Text(value, overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (value) { if (value != null) setDialogState(() => course = value); },
            ),
            TextFormField(controller: front, decoration: const InputDecoration(labelText: 'Prompt / front'), validator: _required),
            TextFormField(controller: back, decoration: const InputDecoration(labelText: 'Answer / back'), minLines: 2, maxLines: 4, validator: _required),
          ])),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          FilledButton(onPressed: () { if (form.currentState!.validate()) Navigator.pop(context, _StudyCard(front: front.text.trim(), back: back.text.trim(), course: course)); }, child: const Text('Save')),
        ],
      )),
    );
    front.dispose();
    back.dispose();
    if (created == null) return;
    setState(() => _cards.add(created));
    await _save();
  }

  Future<void> _reviewCard(_StudyCard card, bool remembered) async {
    final completed = remembered && card.repetitions >= 3;
    final interval = remembered ? (card.repetitions == 0 ? 1 : card.repetitions == 1 ? 3 : 7) : 1;
    setState(() {
      if (completed) {
        _cards.remove(card);
      } else {
        card.due = DateTime.now().add(Duration(days: interval));
        card.repetitions = remembered ? card.repetitions + 1 : 0;
      }
    });
    await _save();
  }

  Future<void> _startReview() async {
    final due = _cards.where((card) => !card.due.isAfter(DateTime.now())).toList();
    if (due.isEmpty) {
      _message('You’re all caught up. Add a card or come back when the next one is due.');
      return;
    }
    var index = 0;
    var showAnswer = false;
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(builder: (context, setDialogState) {
        final card = due[index];
        void next() {
          if (index + 1 == due.length) {
            Navigator.pop(dialogContext);
          } else {
            setDialogState(() { index++; showAnswer = false; });
          }
        }
        return AlertDialog(
          title: Text('${card.course} · ${index + 1}/${due.length}', style: Theme.of(context).textTheme.titleSmall),
          content: InkWell(
            onTap: () => setDialogState(() => showAnswer = !showAnswer),
            child: Container(width: double.maxFinite, constraints: const BoxConstraints(minHeight: 150), alignment: Alignment.center, child: Text(showAnswer ? card.back : card.front, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge)),
          ),
          actions: showAnswer ? [
            TextButton(onPressed: () async { await _reviewCard(card, false); next(); }, child: const Text('Again tomorrow')),
            FilledButton(onPressed: () async { await _reviewCard(card, true); next(); }, child: const Text('Got it')),
          ] : [TextButton(onPressed: () => setDialogState(() => showAnswer = true), child: const Text('Show answer'))],
        );
      }),
    );
    if (mounted) setState(() {});
  }

  void _startFocus([int? minutes]) {
    if (_running) return;
    final sessionMinutes = minutes ?? (_focusTotal ~/ 60);
    setState(() {
      if (minutes != null) {
        _focusTotal = minutes * 60;
        _focusSeconds = minutes * 60;
      }
      _running = true;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_focusSeconds <= 1) {
        timer.cancel();
        setState(() { _focusSeconds = 0; _running = false; _focusMinutes += sessionMinutes; _completedSessions++; });
        _save();
        _message('Focus session complete. Take a short break.');
      } else {
        setState(() => _focusSeconds--);
      }
    });
  }

  void _pauseFocus() {
    _timer?.cancel();
    setState(() => _running = false);
  }

  void _resetFocus() {
    _timer?.cancel();
    setState(() { _running = false; _focusSeconds = _focusTotal; });
  }

  void _spin() {
    if (_courses.isEmpty) {
      _message('Add your courses to spin the study picker.');
      return;
    }
    final random = Random();
    final course = _courses[random.nextInt(_courses.length)];
    showDialog<void>(context: context, builder: (context) => AlertDialog(
      icon: const Icon(Icons.casino_outlined, size: 40),
      title: const Text('Your next study pick'),
      content: Text(course, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
      actions: [FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Let’s study'))],
    ));
  }

  void _message(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  String? _required(String? value) => value == null || value.trim().isEmpty ? 'Please fill this in.' : null;

  @override
  Widget build(BuildContext context) {
    final due = _cards.where((card) => !card.due.isAfter(DateTime.now())).length;
    final minutes = (_focusSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (_focusSeconds % 60).toString().padLeft(2, '0');
    return Scaffold(
      appBar: AppBar(title: const Text('Study hub'), actions: [IconButton(tooltip: 'Pick a course', onPressed: _spin, icon: const Icon(Icons.casino_outlined))]),
      body: !_loaded ? const Center(child: CircularProgressIndicator()) : ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          Card(child: Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Your semester, in one place.', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            const Text('Courses, review cards and focused study time stay saved on this device.'),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [Chip(avatar: const Icon(Icons.school_outlined, size: 18), label: Text('${_courses.length} courses')), Chip(avatar: const Icon(Icons.timer_outlined, size: 18), label: Text('$_focusMinutes focus min')), Chip(avatar: const Icon(Icons.style_outlined, size: 18), label: Text('$due cards due'))]),
          ]))),
          const SizedBox(height: 12),
          SegmentedButton<int>(segments: const [
            ButtonSegment(value: 0, icon: Icon(Icons.menu_book_outlined), label: Text('Courses')),
            ButtonSegment(value: 1, icon: Icon(Icons.timer_outlined), label: Text('Focus')),
            ButtonSegment(value: 2, icon: Icon(Icons.style_outlined), label: Text('Cards')),
          ], selected: {_section}, onSelectionChanged: (value) => setState(() => _section = value.first)),
          const SizedBox(height: 12),
          if (_section == 0) ..._courseSection(context),
          if (_section == 1) ..._focusSection(context, minutes, seconds),
          if (_section == 2) ..._cardSection(context),
          const SizedBox(height: 12),
          Card(color: Theme.of(context).colorScheme.surfaceContainerHighest, child: const Padding(padding: EdgeInsets.all(14), child: Text('Course extraction here finds course codes from pasted text. It does not use AI. Timetable photo reading, slide-to-quiz AI, scheduled SMS and cloud sync need their connected services before they can work.'))),
        ],
      ),
    );
  }

  List<Widget> _courseSection(BuildContext context) {
    final today = _weekdays[DateTime.now().weekday - 1];
    final todayClasses = demoSchedule.where((item) => item.$1 == today).toList();
    return [
      Row(children: [Expanded(child: Text('My courses', style: Theme.of(context).textTheme.titleLarge)), FilledButton.icon(onPressed: _addCourses, icon: const Icon(Icons.add), label: const Text('Add'))]),
      const SizedBox(height: 8),
      if (_courses.isEmpty) const Card(child: ListTile(leading: Icon(Icons.content_paste_search), title: Text('Start with your course list'), subtitle: Text('Paste codes from your registration or class group. Check the results before using them.'))),
      for (final course in _courses) Card(child: ListTile(leading: const Icon(Icons.book_outlined), title: Text(course), trailing: IconButton(tooltip: 'Remove course', onPressed: () => _removeCourse(course), icon: const Icon(Icons.close)))),
      const SizedBox(height: 12),
      Text('Today · $today', style: Theme.of(context).textTheme.titleMedium),
      if (todayClasses.isEmpty) const Card(child: ListTile(leading: Icon(Icons.event_available_outlined), title: Text('No sample classes today'), subtitle: Text('Add or update classes in your timetable.'))),
      for (final item in todayClasses) Card(child: ListTile(leading: const Icon(Icons.schedule_outlined), title: Text(item.$2), subtitle: Text('${item.$3} · ${item.$4}'))),
      const SizedBox(height: 8),
      OutlinedButton.icon(onPressed: _spin, icon: const Icon(Icons.casino_outlined), label: const Text('Pick a course to study')),
    ];
  }

  List<Widget> _focusSection(BuildContext context, String minutes, String seconds) => [
    Card(child: Padding(padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 18), child: Column(children: [
      Text('FOCUS TIMER', style: Theme.of(context).textTheme.labelLarge),
      const SizedBox(height: 8),
      Text('$minutes:$seconds', style: Theme.of(context).textTheme.displayMedium?.copyWith(fontFeatures: const [])),
      const SizedBox(height: 16),
      Wrap(spacing: 8, children: [
        if (!_running) FilledButton.icon(onPressed: () => _startFocus(), icon: const Icon(Icons.play_arrow), label: Text(_focusSeconds == _focusTotal ? 'Start focus' : 'Resume')),
        if (_running) FilledButton.icon(onPressed: _pauseFocus, icon: const Icon(Icons.pause), label: const Text('Pause')),
        OutlinedButton.icon(onPressed: _resetFocus, icon: const Icon(Icons.restart_alt), label: const Text('Reset')),
      ]),
    ]))),
    const SizedBox(height: 8),
    Text('Choose a session length', style: Theme.of(context).textTheme.titleMedium),
    Wrap(spacing: 8, children: [for (final value in [15, 25, 50]) ChoiceChip(label: Text('$value min'), selected: !_running && _focusTotal == value * 60, onSelected: _running ? null : (_) => setState(() { _focusTotal = value * 60; _focusSeconds = value * 60; }))]),
    Card(child: ListTile(leading: const Icon(Icons.local_fire_department_outlined), title: Text('$_completedSessions completed sessions'), subtitle: Text('$_focusMinutes total focused minutes'))),
    const Card(child: ListTile(leading: Icon(Icons.music_note_outlined), title: Text('Quiet focus'), subtitle: Text('Ambient sound playback can be added with the audio module.'))),
  ];

  List<Widget> _cardSection(BuildContext context) => [
    Row(children: [Expanded(child: Text('Flashcard review', style: Theme.of(context).textTheme.titleLarge)), IconButton.filledTonal(tooltip: 'Create card', onPressed: _addCard, icon: const Icon(Icons.add))]),
    const SizedBox(height: 4),
    Card(child: ListTile(leading: const Icon(Icons.repeat), title: Text('${_cards.length} cards in your deck'), subtitle: Text('${_cards.where((card) => !card.due.isAfter(DateTime.now())).length} ready to review'), trailing: const Icon(Icons.chevron_right), onTap: _startReview)),
    FilledButton.icon(onPressed: _startReview, icon: const Icon(Icons.play_arrow), label: const Text('Review due cards')),
    const SizedBox(height: 8),
    if (_cards.isEmpty) const Card(child: ListTile(leading: Icon(Icons.style_outlined), title: Text('Make your first card'), subtitle: Text('Write a question on the front and answer on the back.'))),
    for (final card in _cards) Card(child: ListTile(leading: const Icon(Icons.style_outlined), title: Text(card.front, maxLines: 1, overflow: TextOverflow.ellipsis), subtitle: Text('${card.course} · ${card.due.isAfter(DateTime.now()) ? 'Review ${card.due.month}/${card.due.day}' : 'Ready to review'}'), trailing: IconButton(tooltip: 'Delete card', onPressed: () { setState(() => _cards.remove(card)); _save(); }, icon: const Icon(Icons.delete_outline)))),
  ];
}

class _StudyCard {
  _StudyCard({required this.front, required this.back, required this.course, DateTime? due, this.repetitions = 0}) : due = due ?? DateTime.now();
  final String front;
  final String back;
  final String course;
  DateTime due;
  int repetitions;

  Map<String, dynamic> toJson() => {'front': front, 'back': back, 'course': course, 'due': due.toIso8601String(), 'repetitions': repetitions};
  factory _StudyCard.fromJson(Map<String, dynamic> json) => _StudyCard(front: json['front'] as String? ?? '', back: json['back'] as String? ?? '', course: json['course'] as String? ?? '', due: DateTime.tryParse(json['due'] as String? ?? '') ?? DateTime.now(), repetitions: json['repetitions'] as int? ?? 0);
}

const demoSchedule = <(String, String, String, String)>[
  ('Monday', 'Data Communications', '9:00–11:00', 'Block B, Room 204'),
  ('Monday', 'Web Application Development', '1:00–3:00', 'ICT Lab 2'),
  ('Tuesday', 'Database Systems', '10:00–12:00', 'Block C, Room 105'),
  ('Wednesday', 'Research Methods', '1:00–3:00', 'Main Lecture Theatre'),
  ('Thursday', 'Computer Networks', '10:00–12:00', 'Networking Lab'),
  ('Friday', 'Human Computer Interaction', '8:00–10:00', 'Block A, Room 302'),
];
