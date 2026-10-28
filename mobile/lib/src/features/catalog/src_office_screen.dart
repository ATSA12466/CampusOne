import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/brand/brand_mark.dart';
import '../../core/media/media.dart';
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
      image: DemoImages.clubService,
      eyebrow: 'STUDENT VOICES',
      title: 'A campus that listens.',
      description: 'Meet the responsibilities, follow the work and keep track of your requests.',
      appBar: AppBar(title: const Text('SRC office')),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<_SrcOffice>(
          future: _future,
          builder: (context, snapshot) => AsyncView<_SrcOffice>(
            snapshot: snapshot,
            onRetry: _reload,
            builder: (context, office) => ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    const CrestMark(size: 44),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Representatives',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(
                            'GCTU SRC — official crest supplied by the council',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ...office.representatives.map(
                  (rep) => Card(
                    child: ListTile(
                      leading: CampusAvatar(name: rep.name, image: rep.avatar),
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
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (project.cover != null)
                          CampusImage(
                            image: project.cover,
                            alt: project.cover?.alt,
                          ),
                        ListTile(
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
                      ],
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

}

class _SrcOffice {
  _SrcOffice({required this.representatives, required this.projects});

  final List<Representative> representatives;
  final List<SrcProject> projects;
}
