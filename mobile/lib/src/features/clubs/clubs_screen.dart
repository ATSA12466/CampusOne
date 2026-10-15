import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
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
  String _category = 'all';

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
                  builder: (context, clubs) {
                    final categories = <String>{
                      for (final club in clubs)
                        if (club.category.isNotEmpty) club.category,
                    }.toList()..sort();
                    final visible = [
                      for (final club in clubs)
                        if (_category == 'all' || club.category == _category)
                          club,
                    ];
                    return ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (categories.isNotEmpty) ...[
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              FilterChip(
                                label: const Text('All'),
                                selected: _category == 'all',
                                onSelected: (_) =>
                                    setState(() => _category = 'all'),
                              ),
                              for (final category in categories)
                                FilterChip(
                                  label: Text(category),
                                  selected: _category == category,
                                  onSelected: (_) =>
                                      setState(() => _category = category),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                        ],
                        if (visible.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 32),
                            child: Text(
                              'No clubs match these filters.',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        for (final club in visible)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: MediaCard(
                              image:
                                  club.cover ??
                                  DemoImages.forCategory(club.category) ??
                                  DemoImages.clubsHero,
                              eyebrow: club.category,
                              title: club.name,
                              description: club.description,
                              facts: [
                                MediaFact('Members', '${club.memberCount}'),
                                if (club.meeting.isNotEmpty)
                                  MediaFact('Meets', club.meeting),
                                if (club.venue.isNotEmpty)
                                  MediaFact('Venue', club.venue),
                              ],
                              footer: club.accepting
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
                          ),
                      ],
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
