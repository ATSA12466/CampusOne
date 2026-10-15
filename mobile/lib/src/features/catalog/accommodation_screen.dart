import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import '../listings/listing_detail_screen.dart';
import 'catalog_repository.dart';

class AccommodationScreen extends StatefulWidget {
  const AccommodationScreen({super.key});

  @override
  State<AccommodationScreen> createState() => _AccommodationScreenState();
}

class _AccommodationScreenState extends State<AccommodationScreen> {
  Future<List<ListingItem>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<ListingItem>> _load() async {
    final page = await CatalogRepository(
      SessionScope.apiOf(context),
    ).accommodation();
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
      appBar: AppBar(title: const Text('Accommodation')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<ListingItem>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<ListingItem>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No listings found',
            emptyMessage: 'New housing options appear here.',
            emptyIcon: Icons.bed_outlined,
            builder: (context, listings) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: listings.length,
              itemBuilder: (context, index) {
                final listing = listings[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: MediaCard(
                    image: listing.cover ?? DemoImages.housingRoom,
                    eyebrow: listing.kind.isEmpty ? 'Accommodation' : listing.kind,
                    title: listing.title,
                    description: listing.intro.isNotEmpty
                        ? listing.intro
                        : listing.facilities.join(' · '),
                    facts: [
                      if (listing.location.isNotEmpty)
                        MediaFact('Location', listing.location),
                      if (listing.price.isNotEmpty)
                        MediaFact('Price', listing.price),
                      if (listing.facilities.isNotEmpty)
                        MediaFact('Facilities', listing.facilities.take(2).join(', ')),
                    ],
                    onTap: () => Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (_) => ListingDetailScreen(
                              domain: 'accommodation',
                              id: listing.id,
                              title: listing.title,
                            ),
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
