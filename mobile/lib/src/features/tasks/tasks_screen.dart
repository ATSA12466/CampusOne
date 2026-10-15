import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'tasks_repository.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  Future<List<TaskItem>>? _future;
  String _filter = 'open';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<TaskItem>> _load() =>
      TasksRepository(SessionScope.apiOf(context)).list();

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

  Future<void> _toggle(TaskItem task) async {
    try {
      await TasksRepository(SessionScope.apiOf(context)).save(
        TaskItem(
          id: task.id,
          title: task.title,
          priority: task.priority,
          category: task.category,
          completed: !task.completed,
          description: task.description,
          dueDate: task.dueDate,
        ),
      );
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _remove(TaskItem task) async {
    try {
      await TasksRepository(SessionScope.apiOf(context)).remove(task.id);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _edit([TaskItem? task]) async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => TaskEditorSheet(task: task)),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return PhotoScaffold(
      image: DemoImages.studyCorner,
      eyebrow: 'A LITTLE FOCUS GOES A LONG WAY',
      title: 'Make room for what matters.',
      description: 'The big assignment. The little errand. Your next good idea. Give your day a plan that feels like yours.',
      appBar: AppBar(title: const Text('Tasks')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _edit(),
        icon: const Icon(Icons.add),
        label: const Text('New task'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'open', label: Text('Open')),
                ButtonSegment(value: 'done', label: Text('Done')),
                ButtonSegment(value: 'all', label: Text('All')),
              ],
              selected: {_filter},
              onSelectionChanged: (values) =>
                  setState(() => _filter = values.first),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<List<TaskItem>>(
                future: _future,
                builder: (context, snapshot) => AsyncView<List<TaskItem>>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: 'No tasks here',
                  emptyMessage: _filter == 'done'
                      ? 'Completed tasks appear here.'
                      : 'Add your first task to plan the day.',
                  emptyIcon: Icons.checklist_outlined,
                  builder: (context, tasks) {
                    final visible = tasks
                        .where(
                          (t) => _filter == 'all'
                              ? true
                              : _filter == 'done'
                              ? t.completed
                              : !t.completed,
                        )
                        .toList();
                    if (visible.isEmpty) {
                      return const EmptyView(
                        title: 'Nothing in this view',
                        message: 'Try another filter.',
                        icon: Icons.checklist_outlined,
                      );
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: visible.length,
                      itemBuilder: (context, index) {
                        final task = visible[index];
                        return Card(
                          child: ListTile(
                            leading: Checkbox(
                              value: task.completed,
                              onChanged: (_) => _toggle(task),
                            ),
                            title: Text(
                              task.title,
                              style: TextStyle(
                                decoration: task.completed
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ),
                            subtitle: Text(
                              '${task.category} · ${task.priority} priority'
                              '${task.dueDate.isEmpty ? '' : ' · due ${task.dueDate}'}',
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'edit') {
                                  _edit(task);
                                } else {
                                  _remove(task);
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
                            onTap: () => _edit(task),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class TaskEditorSheet extends StatefulWidget {
  const TaskEditorSheet({super.key, this.task});

  final TaskItem? task;

  @override
  State<TaskEditorSheet> createState() => _TaskEditorSheetState();
}

class _TaskEditorSheetState extends State<TaskEditorSheet> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  String _priority = 'medium';
  String _category = 'personal';
  String _dueDate = '';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.task?.title ?? '');
    _description = TextEditingController(
      text: widget.task?.description ?? '',
    );
    _priority = widget.task?.priority ?? 'medium';
    _category = widget.task?.category ?? 'personal';
    _dueDate = widget.task?.dueDate ?? '';
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    setState(() => _busy = true);
    try {
      await TasksRepository(SessionScope.apiOf(context)).save(
        TaskItem(
          id: widget.task?.id ?? newRecordId('task'),
          title: _title.text.trim(),
          priority: _priority,
          category: _category,
          completed: widget.task?.completed ?? false,
          description: _description.text.trim(),
          dueDate: _dueDate,
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
        title: Text(widget.task == null ? 'New task' : 'Edit task'),
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              maxLength: 120,
              validator: (value) =>
                  (value ?? '').trim().length >= 2 ? null : 'Add a title.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(
                labelText: 'Details (optional)',
              ),
              maxLines: 3,
              maxLength: 2000,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _priority,
              decoration: const InputDecoration(labelText: 'Priority'),
              items: const [
                DropdownMenuItem(value: 'low', child: Text('Low')),
                DropdownMenuItem(value: 'medium', child: Text('Medium')),
                DropdownMenuItem(value: 'high', child: Text('High')),
              ],
              onChanged: (value) => setState(() => _priority = value!),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: const [
                DropdownMenuItem(value: 'academic', child: Text('Academic')),
                DropdownMenuItem(value: 'personal', child: Text('Personal')),
                DropdownMenuItem(value: 'club', child: Text('Club')),
              ],
              onChanged: (value) => setState(() => _category = value!),
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Due date'),
              subtitle: Text(
                _dueDate.isEmpty ? 'No due date' : _dueDate,
              ),
              trailing: _dueDate.isEmpty
                  ? const Icon(Icons.calendar_today_outlined)
                  : IconButton(
                      tooltip: 'Clear',
                      icon: const Icon(Icons.clear),
                      onPressed: () => setState(() => _dueDate = ''),
                    ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(
                    const Duration(days: 730),
                  ),
                );
                if (picked != null) {
                  setState(
                    () => _dueDate = picked.toIso8601String().substring(0, 10),
                  );
                }
              },
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: Text(widget.task == null ? 'Add task' : 'Save changes'),
            ),
          ],
        ),
      ),
    );
  }
}
