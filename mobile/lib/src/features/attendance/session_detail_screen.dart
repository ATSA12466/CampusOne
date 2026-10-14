import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'attendance_repository.dart';
import 'live_qr_screen.dart';

/// Executive session detail: live QR entry, check-in list, revoke, corrections.
class SessionDetailScreen extends StatefulWidget {
  const SessionDetailScreen({super.key, required this.sessionId});

  final String sessionId;

  @override
  State<SessionDetailScreen> createState() => _SessionDetailScreenState();
}

class _SessionDetailScreenState extends State<SessionDetailScreen> {
  Future<_Detail>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_Detail> _load() async {
    final repo = AttendanceRepository(SessionScope.apiOf(context));
    final json = await SessionScope.apiOf(
      context,
    ).get('/api/attendance/sessions/${widget.sessionId}');
    final root = asMap(json);
    final session = AttendanceSession.fromJson(
      asMap(root['item']),
    );
    final raw = root['checkins'];
    final checkins = raw is List
        ? raw
              .whereType<Map<String, dynamic>>()
              .map(AttendanceRecord.fromJson)
              .toList()
        : <AttendanceRecord>[];
    return _Detail(session: session, checkins: checkins);
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

  Future<void> _close(String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(status == 'revoked' ? 'Revoke session?' : 'Close session?'),
        content: Text(
          status == 'revoked'
              ? 'Live QR codes stop working immediately.'
              : 'Students can no longer check in.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await AttendanceRepository(
        SessionScope.apiOf(context),
      ).setStatus(widget.sessionId, status);
      if (mounted) showAppMessage(context, 'Session $status.');
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _correct(AttendanceRecord record) async {
    final picked = await showDialog<_Correction>(
      context: context,
      builder: (context) => _CorrectionDialog(name: record.attendee),
    );
    if (picked == null) return;
    try {
      await AttendanceRepository(SessionScope.apiOf(context)).correctRecord(
        record.id,
        status: picked.status,
        reason: picked.reason,
      );
      if (mounted) showAppMessage(context, 'Record updated.');
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Session')),
      body: FutureBuilder<_Detail>(
        future: _future,
        builder: (context, snapshot) => AsyncView<_Detail>(
          snapshot: snapshot,
          onRetry: _reload,
          builder: (context, data) {
            final session = data.session;
            final present = data.checkins
                .where((c) => c.status == 'present')
                .length;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session.eventTitle,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          Text(
                            '$present checked in · ${session.status}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    if (session.status == 'active')
                      FilledButton.icon(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => LiveQrScreen(
                              sessionId: session.id,
                              title: session.eventTitle,
                            ),
                          ),
                        ),
                        icon: const Icon(Icons.qr_code_2_outlined),
                        label: const Text('Show QR'),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                if (session.status == 'active')
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _close('closed'),
                          child: const Text('Close'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _close('revoked'),
                          child: const Text('Revoke'),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 12),
                Text(
                  'Check-ins (${data.checkins.length})',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                if (data.checkins.isEmpty)
                  const EmptyView(
                    title: 'No check-ins yet',
                    message: 'Show the QR to start taking attendance.',
                    icon: Icons.how_to_reg_outlined,
                  ),
                ...data.checkins.map(
                  (record) => Card(
                    child: ListTile(
                      title: Text(record.attendee),
                      subtitle: Text(prettyDateTime(record.checkedInAt)),
                      trailing: StatusChip(label: record.status),
                      onTap: () => _correct(record),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _Detail {
  _Detail({required this.session, required this.checkins});

  final AttendanceSession session;
  final List<AttendanceRecord> checkins;
}

class _Correction {
  _Correction(this.status, this.reason);

  final String status;
  final String reason;
}

class _CorrectionDialog extends StatefulWidget {
  const _CorrectionDialog({required this.name});

  final String name;

  @override
  State<_CorrectionDialog> createState() => _CorrectionDialogState();
}

class _CorrectionDialogState extends State<_CorrectionDialog> {
  final _reason = TextEditingController();
  String _status = 'excused';

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Correct ${widget.name}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _status,
            items: const [
              DropdownMenuItem(value: 'present', child: Text('Present')),
              DropdownMenuItem(value: 'excused', child: Text('Excused')),
              DropdownMenuItem(value: 'voided', child: Text('Voided')),
            ],
            onChanged: (value) =>
                setState(() => _status = value ?? 'excused'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reason,
            decoration: const InputDecoration(
              labelText: 'Reason (kept on record)',
            ),
            minLines: 2,
            maxLines: 3,
            onChanged: (_) => setState(() {}),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _reason.text.trim().length >= 3
              ? () => Navigator.of(
                  context,
                ).pop(_Correction(_status, _reason.text.trim()))
              : null,
          child: const Text('Save'),
        ),
      ],
    );
  }
}
