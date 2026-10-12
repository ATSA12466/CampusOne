import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'catalog_repository.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  Future<List<Announcement>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<Announcement>> _load() async {
    final page = await CatalogRepository(
      SessionScope.apiOf(context),
    ).announcements();
    return page.items;
  }

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Announcements')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<Announcement>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<Announcement>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No announcements',
            emptyMessage:
                'Official updates from clubs and the SRC appear here.',
            emptyIcon: Icons.campaign_outlined,
            builder: (context, items) => ListView.builder(
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
