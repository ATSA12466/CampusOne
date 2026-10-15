import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'academic_tools_repository.dart';

class GpaScreen extends StatefulWidget {
  const GpaScreen({super.key});

  @override
  State<GpaScreen> createState() => _GpaScreenState();
}

class _GpaScreenState extends State<GpaScreen> {
  Future<List<GradeEntry>>? _future;
  String _term = 'all';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<GradeEntry>> _load() =>
      AcademicToolsRepository(SessionScope.apiOf(context)).grades();

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

  Future<void> _edit([GradeEntry? entry]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => GradeEditorSheet(entry: entry)),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return PhotoScaffold(
      image: DemoImages.studyCorner,
      eyebrow: 'ACADEMICS',
      title: 'A little more understanding.',
      description: 'Resources for your next bright idea.',
      appBar: AppBar(title: const Text('GPA calculator')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(),
        icon: const Icon(Icons.add),
        label: const Text('Grade'),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<GradeEntry>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<GradeEntry>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No grades yet',
            emptyMessage: 'Add your courses to estimate your GPA.',
            emptyIcon: Icons.calculate_outlined,
            builder: (context, grades) {
              final terms = {
                'all',
                ...grades.map((g) => g.term),
              }.toList();
              final rows = _term == 'all'
                  ? grades
                  : grades.where((g) => g.term == _term).toList();
              final result = weightedGpa(rows);
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text(
                    'Personal planning estimate on a 0–4 scale — not an official transcript.',
                  ),
                  const SizedBox(height: 12),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final term in terms)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(
                                term == 'all' ? 'All terms' : term,
                              ),
                              selected: _term == term,
                              onSelected: (_) =>
                                  setState(() => _term = term),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Text(
                            result.gpa == null
                                ? '—'
                                : result.gpa!.toStringAsFixed(2),
                            style: Theme.of(context).textTheme.displaySmall,
                          ),
                          Text(
                            'Estimated GPA · ${result.credits} credits',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  for (final grade in rows)
                    Card(
                      child: ListTile(
                        title: Text(grade.course),
                        subtitle: Text(
                          '${grade.term} · ${grade.credits} credits · ${grade.points.toStringAsFixed(1)} pts',
                        ),
                        trailing: PopupMenuButton<String>(
                          onSelected: (value) async {
                            if (value == 'edit') {
                              _edit(grade);
                            } else {
                              try {
                                await AcademicToolsRepository(
                                  SessionScope.apiOf(context),
                                ).removeGrade(grade.id);
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
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'edit', child: Text('Edit')),
                            PopupMenuItem(
                              value: 'delete',
                              child: Text('Delete'),
                            ),
                          ],
                        ),
                      ),
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

class GradeEditorSheet extends StatefulWidget {
  const GradeEditorSheet({super.key, this.entry});

  final GradeEntry? entry;

  @override
  State<GradeEditorSheet> createState() => _GradeEditorSheetState();
}

class _GradeEditorSheetState extends State<GradeEditorSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _course;
  late final TextEditingController _term;
  late final TextEditingController _credits;
  late final TextEditingController _points;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _course = TextEditingController(text: widget.entry?.course ?? '');
    _term = TextEditingController(text: widget.entry?.term ?? '');
    _credits = TextEditingController(
      text: widget.entry == null ? '3' : '${widget.entry!.credits}',
    );
    _points = TextEditingController(
      text: widget.entry == null ? '' : '${widget.entry!.points}',
    );
  }

  @override
  void dispose() {
    _course.dispose();
    _term.dispose();
    _credits.dispose();
    _points.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await AcademicToolsRepository(
        SessionScope.apiOf(context),
      ).saveGrade(
        GradeEntry(
          id: widget.entry?.id ?? newRecordId('grade'),
          course: _course.text.trim(),
          term: _term.text.trim(),
          credits: int.parse(_credits.text.trim()),
          points: double.parse(_points.text.trim()),
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
      appBar: AppBar(title: const Text('Grade')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _course,
              decoration: const InputDecoration(labelText: 'Course'),
              validator: (value) => (value ?? '').trim().length >= 2
                  ? null
                  : 'Add the course.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _term,
              decoration: const InputDecoration(
                labelText: 'Term (e.g. Fall 2026)',
              ),
              validator: (value) => (value ?? '').trim().length >= 2
                  ? null
                  : 'Add the term.',
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _credits,
                    decoration: const InputDecoration(labelText: 'Credits'),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      final parsed = int.tryParse((value ?? '').trim());
                      return parsed != null && parsed >= 1 && parsed <= 40
                          ? null
                          : '1–40';
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _points,
                    decoration: const InputDecoration(
                      labelText: 'Grade points (0–4)',
                    ),
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    validator: (value) {
                      final parsed = double.tryParse((value ?? '').trim());
                      return parsed != null && parsed >= 0 && parsed <= 4
                          ? null
                          : '0–4';
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: const Text('Save grade'),
            ),
          ],
        ),
      ),
    );
  }
}
