import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/saves_repository.dart';
import '../../core/widgets/states.dart';
import '../clubs/club_detail_screen.dart';
import '../events/event_detail_screen.dart';
import '../listings/listing_detail_screen.dart';

/// Everything the student bookmarked, across collections.
class SavedScreen extends StatefulWidget {
  const SavedScreen({super.key});

  @override
  State<SavedScreen> createState() => _SavedScreenState();
}

class _SavedScreenState extends State<SavedScreen> {
  Future<List<SavedItem>>? _future;
  String _filter = 'all';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<SavedItem>> _load() =>
      SavesRepository(SessionScope.apiOf(context)).list();

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

  Future<void> _remove(SavedItem item) async {
    try {
      await SavesRepository(
        SessionScope.apiOf(context),
      ).setSaved(item.kind, '${item.domain}:${item.entityId}', false);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<SavedItem>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<SavedItem>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'Nothing saved yet',
            emptyMessage: 'Bookmark clubs, events and listings to find them here.',
            emptyIcon: Icons.bookmark_border_outlined,
            builder: (context, saved) {
              final kinds = {
                'all',
                ...saved.map((s) => s.kind),
              }.toList();
              final items = _filter == 'all'
                  ? saved
                  : saved.where((s) => s.kind == _filter).toList();
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final kind in kinds)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(kind),
                              selected: _filter == kind,
                              onSelected: (_) =>
                                  setState(() => _filter = kind),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (items.isEmpty)
                    const EmptyView(
                      title: 'Nothing here',
                      message: 'Try another filter.',
                      icon: Icons.bookmark_border_outlined,
                    ),
                  for (final item in items)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.bookmark_outlined),
                        title: Text(item.entityId),
                        subtitle: Text(item.kind),
                        trailing: IconButton(
                          tooltip: 'Remove',
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _remove(item),
                        ),
                        onTap: () => _open(item),
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

  void _open(SavedItem item) {
    final Widget? screen = switch (item.kind) {
      'club' => ClubDetailScreen(clubId: item.entityId),
      'event' => EventDetailScreen(eventId: item.entityId),
      'announcement' => ListingDetailScreen(
        domain: 'announcements',
        id: item.ref,
        title: item.ref,
      ),
      'listing' => ListingDetailScreen(
        domain: item.domain,
        id: item.ref,
        title: item.ref,
      ),
      'media' => ListingDetailScreen(
        domain: 'media',
        id: item.entityId,
        title: item.entityId,
      ),
      _ => null,
    };
    if (screen == null) {
      showAppMessage(context, 'Open this from its collection.');
      return;
    }
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => screen)).then((_) => _reload());
  }
}
