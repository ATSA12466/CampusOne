import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import 'listing_detail_screen.dart';
import 'listings_repository.dart';
import 'photo_record_editor.dart';

/// Configurable catalog list used by marketplace, opportunities, lost & found,
/// media, campaigns, courses and resources.
class DomainListScreen extends StatefulWidget {
  const DomainListScreen({
    super.key,
    required this.domain,
    required this.title,
    required this.emptyTitle,
    required this.emptyMessage,
    required this.icon,
    this.photoCollection,
    this.photoTypes = const ['listing'],
  });

  final String domain;
  final String title;
  final String emptyTitle;
  final String emptyMessage;
  final IconData icon;
  final String? photoCollection;
  final List<String> photoTypes;

  @override
  State<DomainListScreen> createState() => _DomainListScreenState();
}

class _DomainListScreenState extends State<DomainListScreen> {
  final _search = TextEditingController();
  Future<_Data>? _future;
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

  Future<_Data> _load() async {
    final repo = ListingsRepository(SessionScope.apiOf(context));
    final items = await repo.list(widget.domain, search: _query);
    var records = <PhotoRecord>[];
    if (widget.photoCollection != null &&
        SessionScope.sessionOf(context).signedIn) {
      try {
        records = await repo.myPhotoRecords(widget.photoCollection!);
      } catch (_) {
        records = [];
      }
    }
    return _Data(items: items, records: records);
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

  Future<void> _addRecord() async {
    final saved = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => PhotoRecordEditor(
          collection: widget.photoCollection!,
          types: widget.photoTypes,
        ),
      ),
    );
    if (saved == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    final hero = _domainCopy(widget.domain);
    return PhotoScaffold(
      image: _domainArtwork(widget.domain),
      eyebrow: hero.eyebrow,
      title: hero.title,
      description: hero.description,
      appBar: AppBar(title: Text(widget.title)),
      floatingActionButton:
          widget.photoCollection != null && signedIn
          ? FloatingActionButton.extended(
              onPressed: _addRecord,
              icon: const Icon(Icons.add_a_photo_outlined),
              label: const Text('Add mine'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'Search ${widget.title.toLowerCase()}',
              leading: const Icon(Icons.search),
              onSubmitted: (value) {
                setState(() => _query = value.trim());
                _reload();
              },
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<_Data>(
                future: _future,
                builder: (context, snapshot) => AsyncView<_Data>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: widget.emptyTitle,
                  emptyMessage: widget.emptyMessage,
                  emptyIcon: widget.icon,
                  builder: (context, data) => ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (data.records.isNotEmpty) ...[
                        Text(
                          'My records (${data.records.length})',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        for (final record in data.records)
                          Card(
                            child: ListTile(
                              leading: const Icon(
                                Icons.photo_camera_outlined,
                              ),
                              title: Text(record.title),
                              subtitle: Text(
                                '${record.type} · ${record.location}',
                              ),
                              trailing: const StatusChip(label: 'Only you'),
                              onTap: () => Navigator.of(context)
                                  .push<bool>(
                                    MaterialPageRoute(
                                      builder: (_) => PhotoRecordEditor(
                                        collection: widget.photoCollection!,
                                        types: widget.photoTypes,
                                        record: record,
                                      ),
                                    ),
                                  )
                                  .then((saved) {
                                    if (saved == true) _reload();
                                  }),
                            ),
                          ),
                        const SizedBox(height: 16),
                        Text(
                          'Campus listings',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                      ],
                      if (data.items.isEmpty)
                        EmptyView(
                          title: widget.emptyTitle,
                          message: widget.emptyMessage,
                          icon: widget.icon,
                        ),
                      for (final item in data.items)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: MediaCard(
                            image:
                                item.photo ??
                                _domainArtwork(widget.domain),
                            eyebrow: item.chips.isEmpty
                                ? widget.domain
                                : item.chips.first,
                            title: item.title,
                            description: item.description.isEmpty
                                ? item.subtitle
                                : item.description,
                            facts: [
                              if (item.subtitle.isNotEmpty)
                                MediaFact('Details', item.subtitle),
                              for (final entry
                                  in item.extra.entries.take(2))
                                if (entry.value.isNotEmpty)
                                  MediaFact(entry.key, entry.value),
                            ],
                            onTap: () => Navigator.of(context)
                                .push(
                                  MaterialPageRoute(
                                    builder: (_) => ListingDetailScreen(
                                      domain: widget.domain,
                                      id: item.id,
                                      title: item.title,
                                    ),
                                  ),
                                )
                                .then((_) => _reload()),
                          ),
                        ),
                    ],
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

class _Data {
  _Data({required this.items, required this.records});

  final List<ListingItem> items;
  final List<PhotoRecord> records;
}

/// Category artwork so every domain list keeps the web's photo rhythm even for
/// records that carry no photo of their own.
/// Header copy per catalog domain, copied from the web `listingConfig`
/// (`src/config/listings.ts`) so both clients open a screen the same way.
class _DomainCopy {
  const _DomainCopy(this.eyebrow, this.title, this.description);

  final String eyebrow;
  final String title;
  final String description;
}

_DomainCopy _domainCopy(String domain) => switch (domain) {
  'marketplace' => const _DomainCopy(
    'MARKETPLACE',
    'Good finds. New beginnings.',
    'Useful things, passed from one student to another.',
  ),
  'accommodation' => const _DomainCopy(
    'ACCOMMODATION',
    'A place to call your own.',
    'Find a little space for your next chapter.',
  ),
  'opportunities' => const _DomainCopy(
    'OPPORTUNITIES',
    'Your next door is open.',
    'Scholarships, internships and chances to try something new.',
  ),
  'lostFound' => const _DomainCopy(
    'LOST & FOUND',
    'A little help finding home.',
    'Careful reports and safe handovers.',
  ),
  'media' => const _DomainCopy(
    'TAKE A LITTLE PAUSE',
    'Listen. Look. Find a new perspective.',
    'A media library with honest availability and a few licensed playback samples.',
  ),
  'campaigns' => const _DomainCopy(
    'CAMPUS PARTNERS',
    'Good ideas deserve a little space.',
    'A transparent view of supplied promotional placements, not a publishing console.',
  ),
  _ => const _DomainCopy(
    'ACADEMICS',
    'A little more understanding.',
    'Resources for your next bright idea.',
  ),
};

CampusMedia _domainArtwork(String domain) => switch (domain) {
  'marketplace' => DemoImages.marketDesk,
  'accommodation' => DemoImages.housingRoom,
  'opportunities' => DemoImages.campusLife,
  'resources' => DemoImages.studyCorner,
  'media' => DemoImages.mediaPause,
  'lostFound' => DemoImages.eventSocial,
  'events' => DemoImages.eventShowcase,
  'courses' => DemoImages.studyCorner,
  _ => DemoImages.campusLife,
};
