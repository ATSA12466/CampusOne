import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'attendance_repository.dart';
import 'scan_screen.dart';

class AttendanceHistoryScreen extends StatefulWidget {
  const AttendanceHistoryScreen({super.key});

  @override
  State<AttendanceHistoryScreen> createState() => _AttendanceHistoryScreenState();
}

class _AttendanceHistoryScreenState extends State<AttendanceHistoryScreen> {
  Future<List<AttendanceRecord>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= AttendanceRepository(
      SessionScope.apiOf(context),
    ).myRecords();
  }

  void _reload() => setState(
    () => _future = AttendanceRepository(
      SessionScope.apiOf(context),
    ).myRecords(),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My attendance')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(
          context,
        ).push(MaterialPageRoute(builder: (_) => const ScanScreen())).then(
          (_) => _reload(),
        ),
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<AttendanceRecord>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<AttendanceRecord>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No check-ins yet',
            emptyMessage: 'Scan a session QR at your next event.',
            emptyIcon: Icons.how_to_reg_outlined,
            builder: (context, records) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: records.length,
              itemBuilder: (context, index) {
                final record = records[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(record.eventTitle),
                    subtitle: Text(
                      '${prettyDateTime(record.checkedInAt)}${record.clubName.isEmpty ? '' : ' · ${record.clubName}'}',
                    ),
                    trailing: StatusChip(
                      label: record.status,
                      tone: record.status == 'present'
                          ? ChipTone.success
                          : record.status == 'excused'
                          ? ChipTone.warning
                          : ChipTone.info,
                    ),
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
