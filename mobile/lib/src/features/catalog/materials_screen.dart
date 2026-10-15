import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import '../listings/listing_detail_screen.dart';
import 'catalog_repository.dart';

class MaterialsScreen extends StatefulWidget {
  const MaterialsScreen({super.key});

  @override
  State<MaterialsScreen> createState() => _MaterialsScreenState();
}

class _MaterialsScreenState extends State<MaterialsScreen> {
  Future<List<MaterialItem>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<MaterialItem>> _load() async {
    final page = await CatalogRepository(
      SessionScope.apiOf(context),
    ).materials();
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
      appBar: AppBar(title: const Text('Study materials')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<MaterialItem>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<MaterialItem>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No materials yet',
            emptyMessage: 'Shared notes and guides appear here.',
            emptyIcon: Icons.menu_book_outlined,
            builder: (context, materials) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: materials.length,
              itemBuilder: (context, index) {
                final material = materials[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: MediaCard(
                    image: material.cover ?? DemoImages.studyCorner,
                    eyebrow: material.category,
                    title: material.title,
                    description: material.description,
                    facts: [
                      if (material.course.isNotEmpty)
                        MediaFact('Course', material.course),
                      if (material.author.isNotEmpty)
                        MediaFact('Added by', material.author),
                    ],
                    onTap: () => Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (_) => ListingDetailScreen(
                              domain: 'resources',
                              id: material.id,
                              title: material.title,
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
