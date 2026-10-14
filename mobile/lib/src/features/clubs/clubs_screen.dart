import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../catalog/catalog_repository.dart';
import 'club_detail_screen.dart';

class ClubsScreen extends StatefulWidget {
  const ClubsScreen({super.key});

  @override
  State<ClubsScreen> createState() => _ClubsScreenState();
}

class _ClubsScreenState extends State<ClubsScreen> {
  final _search = TextEditingController();
  Future<List<Club>>? _future;
  String _query = '';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<List<Club>> _load() async {
    final api = SessionScope.apiOf(context);
    final page = await CatalogRepository(api).clubs(search: _query);
    return page.items;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Clubs')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Search clubs',
              leading: const Icon(Icons.search),
              trailing: _query.isEmpty
                  ? null
                  : [
                      IconButton(
                        tooltip: 'Clear',
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _search.clear();
                          setState(() => _query = '');
                          _reload();
                        },
                      ),
                    ],
              onSubmitted: (value) {
                setState(() => _query = value.trim());
                _reload();
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<List<Club>>(
                future: _future,
                builder: (context, snapshot) => AsyncView<List<Club>>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: 'No clubs found',
                  emptyMessage: _query.isEmpty
                      ? 'Approved clubs will appear here.'
                      : 'Try a different search.',
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
                          title: Text(club.name),
                          subtitle: Text(
                            '${club.category} · ${club.memberCount} members',
                          ),
                          trailing: club.accepting
                              ? null
                              : const StatusChip(
                                  label: 'Closed',
                                  tone: ChipTone.warning,
                                ),
                          onTap: () => Navigator.of(context)
                              .push(
                                MaterialPageRoute(
                                  builder: (_) =>
                                      ClubDetailScreen(clubId: club.id),
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
          ),
        ],
      ),
    );
  }
}
