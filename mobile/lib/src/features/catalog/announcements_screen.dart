import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/store/saves_repository.dart';
import '../../core/widgets/states.dart';
import '../listings/listing_detail_screen.dart';
import 'catalog_repository.dart';

/// Announcement feed with search and a saved-only view (mirrors web).
class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  final _search = TextEditingController();
  Future<_Feed>? _future;
  String _query = '';
  bool _savedOnly = false;

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

  Future<_Feed> _load() async {
    final api = SessionScope.apiOf(context);
    final page = await CatalogRepository(api).announcements(search: _query);
    var savedIds = <String>{};
    if (SessionScope.sessionOf(context).signedIn) {
      try {
        savedIds = (await SavesRepository(
          api,
        ).list('announcement')).map((item) => item.entityId).toSet();
      } catch (_) {
        savedIds = {};
      }
    }
    return _Feed(items: page.items, savedIds: savedIds);
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
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return Scaffold(
      appBar: AppBar(title: const Text('Announcements')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Search announcements',
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
          if (signedIn)
            SwitchListTile(
              title: const Text('Saved only'),
              value: _savedOnly,
              onChanged: (value) => setState(() => _savedOnly = value),
            ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<_Feed>(
                future: _future,
                builder: (context, snapshot) => AsyncView<_Feed>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: 'No announcements',
                  emptyMessage:
                      'Official updates from clubs and the SRC appear here.',
                  emptyIcon: Icons.campaign_outlined,
                  builder: (context, feed) {
                    final items = [
                      for (final item in feed.items)
                        if (!_savedOnly || feed.savedIds.contains(item.id))
                          item,
                    ];
                    if (items.isEmpty) {
                      return ListView(
                        padding: const EdgeInsets.all(32),
                        children: [
                          Text(
                            _savedOnly
                                ? 'No saved announcements yet. Open one and tap Save.'
                                : 'No announcements match.',
                            textAlign: TextAlign.center,
                          ),
                        ],
                      );
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return Card(
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            title: Text(item.title),
                            subtitle: Text(
                              '${item.content}\n${item.category} · ${prettyDate(item.publishedAt)}',
                            ),
                            isThreeLine: true,
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () => Navigator.of(context)
                                .push(
                                  MaterialPageRoute(
                                    builder: (_) => ListingDetailScreen(
                                      domain: 'announcements',
                                      id: item.id,
                                      title: item.title,
                                    ),
                                  ),
                                )
                                .then((_) => _reload()),
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

class _Feed {
  _Feed({required this.items, required this.savedIds});

  final List<Announcement> items;
  final Set<String> savedIds;
}
