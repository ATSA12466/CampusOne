import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../clubs/club_detail_screen.dart';
import '../clubs/club_manage_screen.dart';
import '../clubs/clubs_repository.dart';

/// The exec's clubs at a glance: pending-request counts where they can
/// manage, membership status everywhere else.
class ManageHubScreen extends StatefulWidget {
  const ManageHubScreen({super.key});

  @override
  State<ManageHubScreen> createState() => _ManageHubScreenState();
}

class _ManageHubScreenState extends State<ManageHubScreen> {
  Future<List<MyClub>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<MyClub>> _load() =>
      ClubsRepository(SessionScope.apiOf(context)).mine();

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manage hub')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<MyClub>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<MyClub>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No club memberships',
            emptyMessage: 'Join a club to see it here.',
            emptyIcon: Icons.groups_outlined,
            builder: (context, clubs) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: clubs.length,
              itemBuilder: (context, index) {
                final club = clubs[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    title: Text(club.clubName),
                    subtitle: Text(
                      club.managed
                          ? '${club.pendingRequests} pending requests'
                          : 'Membership ${club.status}',
                    ),
                    trailing: club.managed
                        ? StatusChip(
                            label: '${club.pendingRequests} pending',
                            tone: club.pendingRequests > 0
                                ? ChipTone.warning
                                : ChipTone.success,
                          )
                        : StatusChip(label: club.status),
                    onTap: () => Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (_) => club.managed
                                ? ClubManageScreen(
                                    clubId: club.clubId,
                                    clubName: club.clubName,
                                  )
                                : ClubDetailScreen(clubId: club.clubId),
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
