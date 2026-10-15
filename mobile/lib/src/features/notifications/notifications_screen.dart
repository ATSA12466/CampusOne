import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import 'notifications_repository.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  Future<List<AppNotification>>? _future;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  Future<List<AppNotification>> _load() =>
      NotificationsRepository(SessionScope.apiOf(context)).list();

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

  Future<void> _markRead(AppNotification item) async {
    if (item.read) return;
    try {
      await NotificationsRepository(
        SessionScope.apiOf(context),
      ).markRead(item.id);
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _markAllRead() async {
    try {
      await NotificationsRepository(
        SessionScope.apiOf(context),
      ).markAllRead();
      _reload();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PhotoScaffold(
      image: DemoImages.innovationNight,
      eyebrow: 'YOUR CAMPUS, IN THE LOOP',
      title: 'A little heads-up.',
      description: 'Useful reminders and campus updates. Keep what matters in view, without the noise.',
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          IconButton(
            tooltip: 'Mark all as read',
            icon: const Icon(Icons.done_all_outlined),
            onPressed: _markAllRead,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<AppNotification>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<AppNotification>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'All caught up',
            emptyMessage: 'New notifications will appear here.',
            emptyIcon: Icons.notifications_none_outlined,
            builder: (context, items) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: Icon(
                      item.iconData,
                      color: item.read
                          ? Theme.of(context).colorScheme.onSurfaceVariant
                          : Theme.of(context).colorScheme.primary,
                    ),
                    title: Text(
                      item.title,
                      style: TextStyle(
                        fontWeight: item.read
                            ? FontWeight.normal
                            : FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      '${item.body}\n${prettyDateTime(item.createdAt)}',
                    ),
                    isThreeLine: true,
                    onTap: () => _markRead(item),
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
