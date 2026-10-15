import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/search/search_repository.dart';
import '../../core/store/saves_repository.dart';
import '../../core/theme/app_theme.dart';
import '../../core/widgets/states.dart';
import '../clubs/club_detail_screen.dart';
import '../events/event_detail_screen.dart';
import '../listings/listing_detail_screen.dart';

/// Cross-collection browser: search everything, or open one collection.
class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final _search = TextEditingController();
  Future<_Results>? _future;
  String _query = '';
  String _scope = 'all';
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

  Future<_Results> _load() async {
    final api = SessionScope.apiOf(context);
    final hits = _query.length >= 2
        ? await SearchRepository(api).search(_query, scope: _scope)
        : <SearchHit>[];
    var saved = <SavedItem>[];
    if (SessionScope.sessionOf(context).signedIn) {
      try {
        saved = await SavesRepository(api).list();
      } catch (_) {
        saved = [];
      }
    }
    return _Results(hits: hits, saved: saved);
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
    return PhotoScaffold(
      image: DemoImages.campusLife,
      eyebrow: 'ONE CAMPUS. PLENTY OF POSSIBILITIES.',
      title: 'A little curiosity goes a long way.',
      description: 'Your next community, good idea or useful find. Take a look around.',
      appBar: AppBar(title: const Text('Discover')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Search clubs, events, housing…',
              leading: const Icon(Icons.search),
              onSubmitted: (value) {
                setState(() => _query = value.trim());
                _reload();
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  for (final scope in ['all', ...SearchRepository.scopes])
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(scope),
                        selected: _scope == scope,
                        onSelected: (_) {
                          setState(() => _scope = scope);
                          _reload();
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SwitchListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: const Text('Saved only'),
              value: _savedOnly,
              onChanged: SessionScope.sessionOf(context).signedIn
                  ? (value) => setState(() => _savedOnly = value)
                  : null,
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<_Results>(
                future: _future,
                builder: (context, snapshot) => AsyncView<_Results>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  builder: (context, results) {
                    if (_savedOnly) return _savedView(results.saved);
                    if (_query.length < 2) {
                      return const EmptyView(
                        title: 'Search everything',
                        message:
                            'Type at least 2 characters to search every collection at once.',
                        icon: Icons.explore_outlined,
                      );
                    }
                    if (results.hits.isEmpty) {
                      return const EmptyView(
                        title: 'No matches',
                        message: 'Try another keyword or collection.',
                        icon: Icons.search_off_outlined,
                      );
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: results.hits.length,
                      itemBuilder: (context, index) {
                        final hit = results.hits[index];
                        final art = _collectionArtwork(hit.collection);
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Card(
                            child: InkWell(
                              borderRadius:
                                  BorderRadius.circular(CampusRadii.card),
                              onTap: () => _openHit(hit),
                              child: Padding(
                                padding: const EdgeInsets.all(10),
                                child: Row(
                                  children: [
                                    SizedBox(
                                      width: 64,
                                      height: 64,
                                      child: CampusImage(
                                        image: art,
                                        alt: art.alt,
                                        aspect: CampusAspect.square,
                                        showProvenance: false,
                                        borderRadius: BorderRadius.circular(
                                          CampusRadii.control,
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
                                            hit.title,
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
                                            '${hit.collection}${hit.subtitle.isEmpty ? '' : ' · ${hit.subtitle}'}',
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
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
                                    const Icon(Icons.chevron_right),
                                  ],
                                ),
                              ),
                            ),
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

  Widget _savedView(List<SavedItem> saved) {
    final items = _scope == 'all'
        ? saved
        : saved.where((s) => s.kind == _scope || s.domain == _scope).toList();
    if (items.isEmpty) {
      return const EmptyView(
        title: 'No saved items',
        message: 'Bookmark anything to find it here later.',
        icon: Icons.bookmark_border_outlined,
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Card(
          child: ListTile(
            leading: const Icon(Icons.bookmark_outlined),
            title: Text(item.entityId),
            subtitle: Text(item.kind),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _openSaved(item),
          ),
        );
      },
    );
  }

  void _openHit(SearchHit hit) {
    final screen = switch (hit.collection) {
      'clubs' => ClubDetailScreen(clubId: hit.id),
      'events' => EventDetailScreen(eventId: hit.id),
      'announcements' => ListingDetailScreen(
        domain: 'announcements',
        id: hit.id,
        title: hit.title,
      ),
      _ => ListingDetailScreen(
        domain: hit.collection,
        id: hit.id,
        title: hit.title,
      ),
    };
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => screen)).then((_) => _reload());
  }

  void _openSaved(SavedItem item) {
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

class _Results {
  _Results({required this.hits, required this.saved});

  final List<SearchHit> hits;
  final List<SavedItem> saved;
}

/// Search results have no photo of their own yet, so each hit is framed with the
/// artwork of the collection it came from — the same rhythm the web search and
/// directory pages use.
CampusMedia _collectionArtwork(String collection) => switch (collection) {
  'clubs' => DemoImages.clubMakers,
  'events' => DemoImages.eventShowcase,
  'announcements' => DemoImages.campusLife,
  'accommodation' => DemoImages.housingRoom,
  'marketplace' => DemoImages.marketDesk,
  'opportunities' => DemoImages.campusLife,
  'resources' => DemoImages.studyCorner,
  'media' => DemoImages.mediaPause,
  'posts' => DemoImages.eventSocial,
  'lostFound' => DemoImages.eventSocial,
  _ => DemoImages.campusLife,
};
