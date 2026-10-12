import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'messages_repository.dart';
import 'thread_screen.dart';

/// Direct-message inbox with lightweight polling (15s) while visible.
class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  Future<List<Conversation>>? _future;
  Timer? _timer;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
    _timer ??= Timer.periodic(
      const Duration(seconds: 15),
      (_) => _reload(silent: true),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<List<Conversation>> _load() =>
      MessagesRepository(SessionScope.apiOf(context)).conversations();

  void _reload({bool silent = false}) {
    if (!mounted) return;
    if (silent) {
      _load().then((value) {
        if (mounted) setState(() => _future = Future.value(value));
      });
      return;
    }
    setState(() => _future = _load());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: RefreshIndicator(
        onRefresh: () async => _reload(),
        child: FutureBuilder<List<Conversation>>(
          future: _future,
          builder: (context, snapshot) => AsyncView<List<Conversation>>(
            snapshot: snapshot,
            onRetry: _reload,
            emptyTitle: 'No conversations yet',
            emptyMessage: 'Club chats and direct messages appear here.',
            emptyIcon: Icons.forum_outlined,
            builder: (context, conversations) => ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: conversations.length,
              itemBuilder: (context, index) {
                final thread = conversations[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    leading: CircleAvatar(
                      child: Text(
                        thread.title.isEmpty
                            ? '?'
                            : thread.title.characters.first.toUpperCase(),
                      ),
                    ),
                    title: Text(thread.title),
                    trailing: thread.unreadCount > 0
                        ? Badge(
                            label: Text('${thread.unreadCount}'),
                            child: const Icon(Icons.chevron_right),
                          )
                        : const Icon(Icons.chevron_right),
                    subtitle: Text(
                      thread.lastMessagePreview(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    onTap: () => Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (_) => ThreadScreen(thread: thread),
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
