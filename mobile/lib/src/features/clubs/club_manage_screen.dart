import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'clubs_repository.dart';

/// Executive roster + membership review for one club.
class ClubManageScreen extends StatefulWidget {
  const ClubManageScreen({super.key, required this.clubId, this.clubName = ''});

  final String clubId;
  final String clubName;

  @override
  State<ClubManageScreen> createState() => _ClubManageScreenState();
}

class _ClubManageScreenState extends State<ClubManageScreen> {
  Future<List<Membership>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<Membership>> _load() =>
      ClubsRepository(SessionScope.apiOf(context)).members(widget.clubId);

  void _reload() => setState(() => _future = _load());

  Future<void> _review(Membership membership, String status) async {
    try {
      await ClubsRepository(
        SessionScope.apiOf(context),
      ).review(membership.id, status);
      if (mounted) {
        showAppMessage(
          context,
          status == 'approved' ? 'Member approved.' : 'Request rejected.',
        );
      }
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(clubName.isEmpty ? 'Manage members' : clubName)),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<Membership>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<Membership>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No members yet',
            emptyMessage: 'Membership requests will appear here.',
            emptyIcon: Icons.group_outlined,
            builder: (context, members) {
              final pending = members
                  .where((m) => m.status == 'pending')
                  .toList();
              final decided = members
                  .where((m) => m.status != 'pending')
                  .toList();
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (pending.isNotEmpty) ...[
                    Text(
                      'Pending requests (${pending.length})',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    ...pending.map(
                      (m) => Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.applicantName,
                                style: Theme.of(context).textTheme.titleSmall,
                              ),
                              if (m.note.isNotEmpty)
                                Text(
                                  m.note,
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  Expanded(
                                    child: FilledButton(
                                      onPressed: () => _review(m, 'approved'),
                                      child: const Text('Approve'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: OutlinedButton(
                                      onPressed: () => _review(m, 'rejected'),
                                      child: const Text('Reject'),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Text(
                    'Members (${decided.where((m) => m.status == 'approved').length})',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  ...decided.map(
                    (m) => Card(
                      child: ListTile(
                        title: Text(m.applicantName),
                        subtitle: Text('Requested ${m.requestedAt}'),
                        trailing: StatusChip(
                          label: m.status,
                          tone: m.status == 'approved'
                              ? ChipTone.success
                              : ChipTone.info,
                        ),
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
