import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_theme.dart';

class GpaPlannerScreen extends StatefulWidget {
  const GpaPlannerScreen({super.key});

  @override
  State<GpaPlannerScreen> createState() => _GpaPlannerScreenState();
}

class _GpaPlannerScreenState extends State<GpaPlannerScreen> {
  static const _bands = <_GctuGradeBand>[
    _GctuGradeBand(80, 100, 'A', 4.00),
    _GctuGradeBand(75, 79, 'A−', 3.75),
    _GctuGradeBand(70, 74, 'B+', 3.50),
    _GctuGradeBand(65, 69, 'B', 3.25),
    _GctuGradeBand(60, 64, 'B−', 3.00),
    _GctuGradeBand(55, 59, 'C+', 2.75),
    _GctuGradeBand(50, 54, 'C', 2.50),
    _GctuGradeBand(45, 49, 'C−', 2.00),
    _GctuGradeBand(40, 44, 'D', 1.50),
    _GctuGradeBand(0, 39, 'F', 0.00),
  ];

  final _course = TextEditingController();
  final _credits = TextEditingController(text: '3');
  final _mark = TextEditingController();
  final _currentCgpa = TextEditingController(text: '');
  final _completedCredits = TextEditingController(text: '');
  final _plannedCredits = TextEditingController(text: '18');
  final _targetCgpa = TextEditingController(text: '3.00');
  final List<_PlannedGrade> _courses = [];
  String? _error;

  @override
  void dispose() {
    _course.dispose();
    _credits.dispose();
    _mark.dispose();
    _currentCgpa.dispose();
    _completedCredits.dispose();
    _plannedCredits.dispose();
    _targetCgpa.dispose();
    super.dispose();
  }

  _GctuGradeBand _gradeFor(double mark) =>
      _bands.firstWhere((band) => mark >= band.min && mark <= band.max);

  int get _termCredits => _courses.fold(0, (sum, row) => sum + row.credits);

  double? get _termGpa {
    if (_termCredits == 0) return null;
    final weighted = _courses.fold<double>(
      0,
      (sum, row) => sum + row.credits * row.grade.points,
    );
    return weighted / _termCredits;
  }

  double? get _requiredTermGpa {
    final cgpa = double.tryParse(_currentCgpa.text.trim());
    final completed = int.tryParse(_completedCredits.text.trim());
    final planned = int.tryParse(_plannedCredits.text.trim());
    final target = double.tryParse(_targetCgpa.text.trim());
    if (cgpa == null ||
        completed == null ||
        planned == null ||
        target == null ||
        !cgpa.isFinite ||
        !target.isFinite ||
        cgpa < 0 ||
        cgpa > 4 ||
        target < 0 ||
        target > 4 ||
        completed < 0 ||
        planned < 1) {
      return null;
    }
    return (target * (completed + planned) - cgpa * completed) / planned;
  }

  void _addCourse() {
    final name = _course.text.trim();
    final credits = int.tryParse(_credits.text.trim());
    final mark = double.tryParse(_mark.text.trim());
    if (name.isEmpty ||
        credits == null ||
        credits < 1 ||
        credits > 40 ||
        mark == null ||
        !mark.isFinite ||
        mark < 0 ||
        mark > 100) {
      setState(() =>
          _error = 'Enter a course, 1–40 credits and a mark from 0 to 100.');
      return;
    }
    setState(() {
      _courses.add(_PlannedGrade(name, credits, mark, _gradeFor(mark)));
      _course.clear();
      _credits.text = '3';
      _mark.clear();
      _error = null;
    });
  }

  Future<void> _openPolicy() async {
    final uri = Uri.parse(
      'https://site.gctu.edu.gh/approved_gctu-academic-policy-2023_final',
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) &&
        mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Could not open the GCTU academic policy.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final required = _requiredTermGpa;
    return Scaffold(
      appBar: AppBar(title: const Text('GPA planner')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(22),
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [CampusColors.primaryDark, CampusColors.primary],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('PLAN YOUR NEXT SEMESTER',
                    style: TextStyle(
                        color: CampusColors.accent,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1)),
                const SizedBox(height: 8),
                const Text('Turn a target into a plan.',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        height: 1.15,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 7),
                Text(
                    'Estimate semester GPA from course marks, then see what average you need for your CGPA goal.',
                    style: TextStyle(
                        color: Colors.white.withValues(alpha: .88),
                        height: 1.4)),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _SectionLabel(
              title: 'Semester estimate',
              subtitle: 'Add planned courses and expected marks'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(
                      controller: _course,
                      textCapitalization: TextCapitalization.words,
                      decoration: const InputDecoration(
                          labelText: 'Course name',
                          prefixIcon: Icon(Icons.menu_book_outlined))),
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(
                        child: TextField(
                            controller: _credits,
                            keyboardType: TextInputType.number,
                            decoration:
                                const InputDecoration(labelText: 'Credits'))),
                    const SizedBox(width: 10),
                    Expanded(
                        child: TextField(
                            controller: _mark,
                            keyboardType: const TextInputType.numberWithOptions(
                                decimal: true),
                            decoration: const InputDecoration(
                                labelText: 'Expected mark %'))),
                  ]),
                  const SizedBox(height: 12),
                  SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                          onPressed: _addCourse,
                          icon: const Icon(Icons.add_rounded),
                          label: const Text('Add course'))),
                  if (_error != null)
                    Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(_error!,
                            style: TextStyle(color: colors.error))),
                ],
              ),
            ),
          ),
          if (_courses.isNotEmpty) ...[
            Card(
              color: colors.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(children: [
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('ESTIMATED SEMESTER GPA',
                            style: TextStyle(
                                color: colors.onPrimaryContainer,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: .8)),
                        const SizedBox(height: 5),
                        Text(_termGpa!.toStringAsFixed(2),
                            style: TextStyle(
                                color: colors.onPrimaryContainer,
                                fontSize: 32,
                                fontWeight: FontWeight.w800)),
                        Text(
                            '$_termCredits credits · weighted by course credit',
                            style: TextStyle(color: colors.onPrimaryContainer))
                      ])),
                  Icon(Icons.auto_graph_rounded,
                      size: 36, color: colors.primary),
                ]),
              ),
            ),
            for (var i = 0; i < _courses.length; i++)
              Card(
                  child: ListTile(
                      title: Text(_courses[i].course,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                          '${_courses[i].mark.toStringAsFixed(0)}% → ${_courses[i].grade.grade} · ${_courses[i].credits} credits × ${_courses[i].grade.points.toStringAsFixed(2)} points'),
                      trailing: IconButton(
                          tooltip: 'Remove course',
                          onPressed: () => setState(() => _courses.removeAt(i)),
                          icon: const Icon(Icons.close_rounded)))),
          ],
          const SizedBox(height: 12),
          _SectionLabel(
              title: 'CGPA target planner',
              subtitle: 'Use your current CGPA and credit totals'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(
                          child: _PlannerField(
                              controller: _currentCgpa,
                              label: 'Current CGPA',
                              hint: 'e.g. 2.85',
                              onChanged: (_) => setState(() {}))),
                      const SizedBox(width: 10),
                      Expanded(
                          child: _PlannerField(
                              controller: _completedCredits,
                              label: 'Credits completed',
                              hint: 'e.g. 48',
                              integer: true,
                              onChanged: (_) => setState(() {})))
                    ]),
                    const SizedBox(height: 10),
                    Row(children: [
                      Expanded(
                          child: _PlannerField(
                              controller: _plannedCredits,
                              label: 'Next credits',
                              hint: 'e.g. 18',
                              integer: true,
                              onChanged: (_) => setState(() {}))),
                      const SizedBox(width: 10),
                      Expanded(
                          child: _PlannerField(
                              controller: _targetCgpa,
                              label: 'Target CGPA',
                              hint: 'e.g. 3.20',
                              onChanged: (_) => setState(() {})))
                    ]),
                    const SizedBox(height: 14),
                    if (required == null)
                      Text(
                          'Enter valid values to calculate the semester average needed.',
                          style: TextStyle(color: colors.onSurfaceVariant))
                    else if (required > 4)
                      Text(
                          'That target cannot be reached in one semester with these credit totals. Try a lower CGPA target or plan across more credits.',
                          style: TextStyle(color: colors.error, height: 1.4))
                    else
                      Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                              color: colors.surfaceContainer,
                              borderRadius: BorderRadius.circular(15)),
                          child: Text(
                              required <= 0
                                  ? 'You have already reached that target based on the values entered.'
                                  : 'You need about ${required.toStringAsFixed(2)} semester GPA to reach your target.',
                              style: TextStyle(
                                  color: colors.onSurface,
                                  fontWeight: FontWeight.w700,
                                  height: 1.4))),
                  ]),
            ),
          ),
          const SizedBox(height: 12),
          ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 16),
            childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
            title: const Text('GCTU grade and quality point guide',
                style: TextStyle(fontWeight: FontWeight.w800)),
            subtitle: const Text('Academic Policy 2023 · Section 12.6'),
            children: [
              for (final band in _bands)
                Padding(
                    padding: const EdgeInsets.symmetric(vertical: 5),
                    child: Row(children: [
                      Expanded(child: Text('${band.min}–${band.max}%')),
                      Expanded(
                          child: Text(band.grade,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w700))),
                      Text(band.points.toStringAsFixed(2),
                          style: const TextStyle(fontWeight: FontWeight.w700))
                    ])),
              const SizedBox(height: 8),
              Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                      onPressed: _openPolicy,
                      icon: const Icon(Icons.open_in_new_rounded),
                      label: const Text('Open official GCTU academic policy'))),
            ],
          ),
          const SizedBox(height: 10),
          Text(
              'Planning estimate only. GCTU computes GPA from course credits multiplied by their quality points. Confirm your programme requirements and official results with the university.',
              textAlign: TextAlign.center,
              style: Theme.of(context)
                  .textTheme
                  .bodySmall
                  ?.copyWith(color: colors.onSurfaceVariant, height: 1.4)),
        ],
      ),
    );
  }
}

class _GctuGradeBand {
  const _GctuGradeBand(this.min, this.max, this.grade, this.points);
  final int min, max;
  final String grade;
  final double points;
}

class _PlannedGrade {
  const _PlannedGrade(this.course, this.credits, this.mark, this.grade);
  final String course;
  final int credits;
  final double mark;
  final _GctuGradeBand grade;
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.title, required this.subtitle});
  final String title, subtitle;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w800)),
        Text(subtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant))
      ]));
}

class _PlannerField extends StatelessWidget {
  const _PlannerField(
      {required this.controller,
      required this.label,
      required this.hint,
      required this.onChanged,
      this.integer = false});
  final TextEditingController controller;
  final String label, hint;
  final ValueChanged<String> onChanged;
  final bool integer;
  @override
  Widget build(BuildContext context) => TextField(
      controller: controller,
      keyboardType: integer
          ? TextInputType.number
          : const TextInputType.numberWithOptions(decimal: true),
      onChanged: onChanged,
      decoration: InputDecoration(labelText: label, hintText: hint));
}
