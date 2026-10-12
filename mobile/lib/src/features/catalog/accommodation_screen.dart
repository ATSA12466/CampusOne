import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
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

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accommodation')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
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
                    trailing: listing.kind.isEmpty
                        ? null
                        : StatusChip(label: listing.kind),
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
