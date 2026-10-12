import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_repository.dart';
import 'club_manage_screen.dart';
import 'clubs_repository.dart';

class ClubDetailScreen extends StatefulWidget {
  const ClubDetailScreen({super.key, required this.clubId});

  final String clubId;

  @override
  State<ClubDetailScreen> createState() => _ClubDetailScreenState();
}

class _ClubDetailScreenState extends State<ClubDetailScreen> {
  Future<_ClubDetail>? _future;
  bool _busy = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_ClubDetail> _load() async {
    final api = SessionScope.apiOf(context);
    final club = await CatalogRepository(api).club(widget.clubId);
    bool saved = false;
    if (SessionScope.sessionOf(context).signedIn) {
      try {
        saved = await ClubsRepository(api).saved(widget.clubId);
      } on ApiException {
        saved = false;
      }
    }
    return _ClubDetail(club: club, saved: saved);
  }

  void _reload() => setState(() => _future = _load());

  Future<void> _toggleSaved(bool value) async {
    final api = SessionScope.apiOf(context);
    try {
      await ClubsRepository(api).setSaved(widget.clubId, value);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _request({required bool leave}) async {
    if (_busy) return;
    final session = SessionScope.sessionOf(context);
    if (!session.signedIn) {
      showAppMessage(context, 'Please sign in to join clubs.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final repo = ClubsRepository(SessionScope.apiOf(context));
      if (leave) {
        await repo.leave(widget.clubId);
        if (mounted) showAppMessage(context, 'You left the club.');
      } else {
        final membership = await repo.requestMembership(widget.clubId);
        if (mounted) {
          showAppMessage(
            context,
            membership.status == 'approved'
                ? 'Membership confirmed.'
                : 'Request sent. The executives will review it.',
          );
        }
      }
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Club'),
        actions: [
          if (session.user?.isExecutive == true)
            IconButton(
              tooltip: 'Manage',
              icon: const Icon(Icons.admin_panel_settings_outlined),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) =>
                      ClubManageScreen(clubId: widget.clubId),
                ),
              ),
            ),
        ],
      ),
      body: FutureBuilder<_ClubDetail>(
        future: _future,
        builder: (context, snapshot) => AsyncView<_ClubDetail>(
          snapshot: snapshot,
          onRetry: _reload,
          builder: (context, data) {
            final club = data.club;
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            club.name,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${club.category} · ${club.memberCount} members',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      tooltip: data.saved ? 'Unsave' : 'Save',
                      onPressed: session.signedIn
                          ? () => _toggleSaved(!data.saved)
                          : null,
                      icon: Icon(
                        data.saved
                            ? Icons.bookmark
                            : Icons.bookmark_border_outlined,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(club.description),
                const SizedBox(height: 16),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        InfoRow(
                          title: 'Meetings',
                          subtitle: club.meeting.isEmpty
                              ? 'Announced to members'
                              : club.meeting,
                          leading: const Icon(Icons.calendar_month_outlined),
                        ),
                        InfoRow(
                          title: 'Venue',
                          subtitle: club.venue.isEmpty
                              ? 'See club announcements'
                              : club.venue,
                          leading: const Icon(Icons.place_outlined),
                        ),
                        InfoRow(
                          title: 'Membership',
                          subtitle: club.accepting
                              ? 'Open for requests'
                              : 'Currently closed',
                          leading: const Icon(Icons.group_add_outlined),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                if (club.accepting)
                  FilledButton.icon(
                    onPressed: _busy ? null : () => _request(leave: false),
                    icon: const Icon(Icons.group_add_outlined),
                    label: const Text('Request membership'),
                  ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: _busy ? null : () => _request(leave: true),
                  child: const Text('Leave club'),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _ClubDetail {
  _ClubDetail({required this.club, required this.saved});

  final Club club;
  final bool saved;
}
