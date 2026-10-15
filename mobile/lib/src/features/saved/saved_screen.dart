import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
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
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () => _open(item),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Row(
                              children: [
                                SizedBox(
                                  width: 64,
                                  height: 64,
                                  child: CampusImage(
                                    image: _savedArtwork(item),
                                    alt: '${item.kind} on CampusOne',
                                    aspect: CampusAspect.square,
                                    showProvenance: false,
                                    borderRadius: const BorderRadius.all(
                                      Radius.circular(14),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.entityId,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: Theme.of(context)
                                            .textTheme
                                            .titleSmall
                                            ?.copyWith(
                                              fontWeight: FontWeight.w700,
                                            ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        item.kind,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onSurfaceVariant,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  tooltip: 'Remove',
                                  icon: const Icon(Icons.delete_outline),
                                  onPressed: () => _remove(item),
                                ),
                              ],
                            ),
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

/// Saved records store an id, not a photo — frame each one with its collection's
/// artwork so the list still reads as pictures, like the web saved views.
CampusMedia _savedArtwork(SavedItem item) {
  final domain = item.domain.isEmpty ? item.kind : item.domain;
  return switch (domain) {
    'club' || 'clubs' => DemoImages.clubMakers,
    'event' || 'events' => DemoImages.eventShowcase,
    'announcement' || 'announcements' => DemoImages.campusLife,
    'accommodation' => DemoImages.housingRoom,
    'marketplace' => DemoImages.marketDesk,
    'lostFound' || 'lost-found' => DemoImages.eventSocial,
    'opportunities' => DemoImages.campusLife,
    'resources' => DemoImages.studyCorner,
    'media' => DemoImages.mediaPause,
    _ => DemoImages.campusLife,
  };
}
