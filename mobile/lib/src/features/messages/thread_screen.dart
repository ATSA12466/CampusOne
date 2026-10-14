import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'messages_repository.dart';

class ThreadScreen extends StatefulWidget {
  const ThreadScreen({super.key, required this.thread});

  final Conversation thread;

  @override
  State<ThreadScreen> createState() => _ThreadScreenState();
}

class _ThreadScreenState extends State<ThreadScreen> {
  final _composer = TextEditingController();
  final _scroll = ScrollController();
  List<ChatMessage> _messages = [];
  bool _loading = true;
  bool _sending = false;
  String? _error;
  Timer? _timer;

  MessagesRepository get _repo =>
      MessagesRepository(SessionScope.apiOf(context));

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(
      const Duration(seconds: 15),
      (_) => _load(silent: true),
    );
  }

  @override
  void dispose() {
    _composer.dispose();
    _scroll.dispose();
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    try {
      final messages = await _repo.thread(widget.thread.id);
      unawaited(_repo.markRead(widget.thread.id));
      if (mounted) {
        setState(() {
          _messages = messages;
          _loading = false;
          if (!silent) _error = null;
        });
        _jumpToEnd();
      }
    } on ApiException catch (error) {
      if (mounted && !silent) {
        setState(() {
          _error = error.message;
          _loading = false;
        });
      }
    }
  }

  void _jumpToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  Future<void> _send() async {
    final body = _composer.text.trim();
    if (body.isEmpty || _sending) return;
    if (!SessionScope.sessionOf(context).signedIn) {
      showAppMessage(context, 'Please sign in to send messages.', error: true);
      return;
    }
    setState(() => _sending = true);
    try {
      await _repo.send(widget.thread.id, body);
      _composer.clear();
      await _load(silent: true);
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = SessionScope.sessionOf(context).user?.id ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(widget.thread.title)),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _loading
                  ? const LoadingView(label: 'Loading messages…')
                  : _error != null
                  ? ErrorView(message: _error!, onRetry: _load)
                  : _messages.isEmpty
                  ? const EmptyView(
                      title: 'No messages yet',
                      message: 'Say hello to start the conversation.',
                      icon: Icons.chat_bubble_outline,
                    )
                  : ListView.builder(
                      controller: _scroll,
                      padding: const EdgeInsets.all(16),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final message = _messages[index];
                        final mine =
                            message.senderId.isNotEmpty &&
                            message.senderId == me;
                        return Align(
                          alignment: mine
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            constraints: BoxConstraints(
                              maxWidth:
                                  MediaQuery.of(context).size.width * 0.75,
                            ),
                            decoration: BoxDecoration(
                              color: mine
                                  ? Theme.of(
                                      context,
                                    ).colorScheme.primaryContainer
                                  : Theme.of(
                                      context,
                                    ).colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Column(
                              crossAxisAlignment: mine
                                  ? CrossAxisAlignment.end
                                  : CrossAxisAlignment.start,
                              children: [
                                if (!mine)
                                  Text(
                                    message.senderName,
                                    style:
                                        Theme.of(context).textTheme.labelSmall,
                                  ),
                                Text(message.body),
                                Text(
                                  prettyDateTime(message.createdAt),
                                  style: Theme.of(
                                    context,
                                  ).textTheme.labelSmall,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _composer,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(
                        hintText: 'Message',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(24)),
                        ),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 10,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: 'Send',
                    onPressed: _sending ? null : _send,
                    icon: _sending
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
