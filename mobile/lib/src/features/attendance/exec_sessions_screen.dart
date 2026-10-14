import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'attendance_repository.dart';
import 'live_qr_screen.dart';
import 'session_detail_screen.dart';

/// Executive view: list + create check-in sessions for one event.
class ExecSessionsScreen extends StatefulWidget {
  const ExecSessionsScreen({super.key, required this.eventId});

  final String eventId;

  @override
  State<ExecSessionsScreen> createState() => _ExecSessionsScreenState();
}

class _ExecSessionsScreenState extends State<ExecSessionsScreen> {
  Future<List<AttendanceSession>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<AttendanceSession>> _load() => AttendanceRepository(
    SessionScope.apiOf(context),
  ).sessionsForEvent(widget.eventId);

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

  Future<void> _create() async {
    final created = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(
      builder: (_) => CreateSessionSheet(eventId: widget.eventId),
    ));
    if (created == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Check-in sessions')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _create,
        icon: const Icon(Icons.add),
        label: const Text('New session'),
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<AttendanceSession>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<AttendanceSession>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No sessions yet',
            emptyMessage: 'Create a session to start taking attendance.',
            emptyIcon: Icons.qr_code_2_outlined,
            builder: (context, sessions) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: sessions.length,
              itemBuilder: (context, index) {
                final session = sessions[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(session.eventTitle),
                    subtitle: Text(
                      '${prettyDateTime(session.startsAt)}\nto ${prettyDateTime(session.endsAt)}',
                    ),
                    isThreeLine: true,
                    trailing: StatusChip(
                      label: session.status,
                      tone: session.status == 'active'
                          ? ChipTone.success
                          : ChipTone.info,
                    ),
                    onTap: () => Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (_) => SessionDetailScreen(
                              sessionId: session.id,
                            ),
                          ),
                        )
                        .then((_) => _reload()),
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

class CreateSessionSheet extends StatefulWidget {
  const CreateSessionSheet({super.key, required this.eventId});

  final String eventId;

  @override
  State<CreateSessionSheet> createState() => _CreateSessionSheetState();
}

class _CreateSessionSheetState extends State<CreateSessionSheet> {
  Duration _opensIn = Duration.zero;
  int _lengthHours = 2;
  bool _membersOnly = false;
  final _capacity = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _capacity.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final startsAt = DateTime.now().add(_opensIn);
      final endsAt = startsAt.add(Duration(hours: _lengthHours));
      await AttendanceRepository(SessionScope.apiOf(context)).createSession(
        eventId: widget.eventId,
        startsAt: startsAt,
        endsAt: endsAt,
        requireMembership: _membersOnly,
        maxCheckins: int.tryParse(_capacity.text.trim()) ?? 0,
      );
      if (mounted) {
        showAppMessage(context, 'Session created.');
        Navigator.of(context).pop(true);
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New session')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Opens in', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              _Choice(
                label: 'Now',
                selected: _opensIn == Duration.zero,
                onTap: () => setState(() => _opensIn = Duration.zero),
              ),
              _Choice(
                label: '30 min',
                selected: _opensIn == const Duration(minutes: 30),
                onTap: () => setState(
                  () => _opensIn = const Duration(minutes: 30),
                ),
              ),
              _Choice(
                label: '1 hour',
                selected: _opensIn == const Duration(hours: 1),
                onTap: () =>
                    setState(() => _opensIn = const Duration(hours: 1)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Open for', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [1, 2, 4, 8].map((hours) {
              return _Choice(
                label: '$hours h',
                selected: _lengthHours == hours,
                onTap: () => setState(() => _lengthHours = hours),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Approved members only'),
            subtitle: const Text('Club sessions can require membership.'),
            value: _membersOnly,
            onChanged: (value) => setState(() => _membersOnly = value),
          ),
          TextField(
            controller: _capacity,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Capacity (optional)',
              helperText: 'Leave empty for no limit.',
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Create session'),
          ),
        ],
      ),
    );
  }
}

class _Choice extends StatelessWidget {
  const _Choice({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap());
  }
}
