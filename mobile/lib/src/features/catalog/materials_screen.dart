import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
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

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Study materials')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
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
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: const Icon(Icons.description_outlined),
                    title: Text(material.title),
                    subtitle: Text(
                      '${material.course} · ${material.category}\n${material.description}',
                    ),
                    isThreeLine: true,
                    trailing: StatusChip(label: material.category),
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
