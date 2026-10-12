import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'catalog_repository.dart';

class SrcOfficeScreen extends StatefulWidget {
  const SrcOfficeScreen({super.key});

  @override
  State<SrcOfficeScreen> createState() => _SrcOfficeScreenState();
}

class _SrcOfficeScreenState extends State<SrcOfficeScreen> {
  Future<_SrcOffice>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<_SrcOffice> _load() async {
    final repo = CatalogRepository(SessionScope.apiOf(context));
    final representatives = await repo.representatives();
    final projects = await repo.projects();
    return _SrcOffice(
      representatives: representatives.items,
      projects: projects.items,
    );
  }

  void _reload() => setState(() => _future = _load());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SRC office')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<_SrcOffice>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_SrcOffice>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, office) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Representatives',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ...office.representatives.map(
                  (rep) => Card(
                    child: ListTile(
                      leading: CircleAvatar(child: Text(_initials(rep.name))),
                      title: Text(rep.name),
                      subtitle: Text(rep.role),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Projects',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ...office.projects.map(
                  (project) => Card(
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      title: Text(project.title),
                      subtitle: Text(project.description),
                      trailing: StatusChip(
                        label: project.status.replaceAll('-', ' '),
                        tone: project.status == 'in-progress'
                            ? ChipTone.warning
                            : project.status == 'completed'
                            ? ChipTone.success
                            : ChipTone.info,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      return parts.first.characters.first.toUpperCase();
    }
    return '${parts.first.characters.first}${parts.last.characters.first}'
        .toUpperCase();
  }
}

class _SrcOffice {
  _SrcOffice({required this.representatives, required this.projects});

  final List<Representative> representatives;
  final List<SrcProject> projects;
}
