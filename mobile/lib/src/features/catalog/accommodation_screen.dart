import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
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
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: const Icon(Icons.home_work_outlined),
                    title: Text(listing.title),
                    subtitle: Text(
                      '${listing.location} · ${listing.price}\n${listing.facilities.join(' · ')}',
                    ),
                    isThreeLine: true,
                    trailing: const Icon(Icons.chevron_right),
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
