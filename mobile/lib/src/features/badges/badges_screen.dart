import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'badges_repository.dart';

class BadgesScreen extends StatefulWidget {
  const BadgesScreen({super.key});

  @override
  State<BadgesScreen> createState() => _BadgesScreenState();
}

class _BadgesScreenState extends State<BadgesScreen> {
  Future<List<BadgeAward>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= BadgesRepository(SessionScope.apiOf(context)).mine();
  }

  void _reload() => setState(
    () => _future = BadgesRepository(SessionScope.apiOf(context)).mine(),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My badges')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<BadgeAward>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<BadgeAward>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No badges yet',
            emptyMessage:
                'Check in to events with a ticket to start earning badges.',
            emptyIcon: Icons.verified_outlined,
            builder: (context, awards) => GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: 190,
              ),
              itemCount: awards.length,
              itemBuilder: (context, index) {
                final award = awards[index];
                final badge = award.badge;
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          badge?.iconData ?? Icons.verified_outlined,
                          size: 40,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          badge?.name ?? award.badgeId,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 4),
                        Expanded(
                          child: Text(
                            badge?.description ?? 'CampusOne achievement.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ),
                        Text(
                          prettyDate(award.awardedAt),
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onSurfaceVariant,
                              ),
                        ),
                      ],
                    ),
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
