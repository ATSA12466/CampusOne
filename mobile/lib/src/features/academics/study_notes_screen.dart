import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'academic_tools_repository.dart';

class StudyNotesScreen extends StatefulWidget {
  const StudyNotesScreen({super.key});

  @override
  State<StudyNotesScreen> createState() => _StudyNotesScreenState();
}

class _StudyNotesScreenState extends State<StudyNotesScreen> {
  Future<List<StudyNote>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<StudyNote>> _load() =>
      AcademicToolsRepository(SessionScope.apiOf(context)).notes();

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

  Future<void> _edit([StudyNote? note]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => NoteEditorSheet(note: note)),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Study notes')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(),
        icon: const Icon(Icons.add),
        label: const Text('Note'),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<StudyNote>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<StudyNote>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No notes yet',
            emptyMessage: 'Capture revision notes per course.',
            emptyIcon: Icons.note_alt_outlined,
            builder: (context, notes) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notes.length,
              itemBuilder: (context, index) {
                final note = notes[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(note.title),
                    subtitle: Text(
                      '${note.course} · ${prettyDate(note.createdAt)}\n${note.body}',
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    isThreeLine: true,
                    trailing: PopupMenuButton<String>(
                      onSelected: (value) async {
                        if (value == 'edit') {
                          _edit(note);
                        } else {
                          try {
                            await AcademicToolsRepository(
                              SessionScope.apiOf(context),
                            ).removeNote(note.id);
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
                        PopupMenuItem(value: 'delete', child: Text('Delete')),
                      ],
                    ),
                    onTap: () => _edit(note),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class NoteEditorSheet extends StatefulWidget {
  const NoteEditorSheet({super.key, this.note});

  final StudyNote? note;

  @override
  State<NoteEditorSheet> createState() => _NoteEditorSheetState();
}

class _NoteEditorSheetState extends State<NoteEditorSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _course;
  late final TextEditingController _title;
  late final TextEditingController _body;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _course = TextEditingController(text: widget.note?.course ?? '');
    _title = TextEditingController(text: widget.note?.title ?? '');
    _body = TextEditingController(text: widget.note?.body ?? '');
  }

  @override
  void dispose() {
    _course.dispose();
    _title.dispose();
    _body.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await AcademicToolsRepository(
        SessionScope.apiOf(context),
      ).saveNote(
        StudyNote(
          id: widget.note?.id ?? newRecordId('note'),
          course: _course.text.trim(),
          title: _title.text.trim(),
          body: _body.text.trim(),
          createdAt:
              widget.note?.createdAt ??
              DateTime.now().toUtc().toIso8601String(),
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
      appBar: AppBar(title: const Text('Note')),
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
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (value) => (value ?? '').trim().length >= 3
                  ? null
                  : 'Add a title.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _body,
              decoration: const InputDecoration(labelText: 'Notes'),
              minLines: 6,
              maxLines: 12,
              validator: (value) => (value ?? '').trim().length >= 10
                  ? null
                  : 'Write at least 10 characters.',
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: const Text('Save note'),
            ),
          ],
        ),
      ),
    );
  }
}
