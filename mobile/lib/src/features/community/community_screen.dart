import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/theme/app_theme.dart';
import '../../core/photos/app_photos.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'community_repository.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final _search = TextEditingController();
  Future<_Feed>? _future;
  String _query = '';
  String _view = 'all';

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _future ??= _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<_Feed> _load() async {
    final api = SessionScope.apiOf(context);
    final signedIn = SessionScope.sessionOf(context).signedIn;
    final repo = CommunityRepository(api);
    final public = await repo.publicPosts(search: _query);
    var mine = <FeedPost>[];
    var replies = <PostReply>[];
    var reacted = <String>{};
    if (signedIn) {
      try {
        mine = await repo.myPosts();
        replies = await repo.replies();
        reacted = await repo.reactedPostIds();
      } on ApiException {
        // Public feed still renders.
      }
    }
    return _Feed(
        public: public, mine: mine, replies: replies, reacted: reacted);
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

  Future<void> _compose() async {
    final published = await Navigator.of(
      context,
    ).push<bool>(MaterialPageRoute(builder: (_) => const PostComposerSheet()));
    if (published == true) _reload();
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    return PhotoScaffold(
      image: DemoImages.eventSocial,
      eyebrow: 'GOOD COMPANY, GOOD CONVERSATION',
      title: 'A campus full of stories.',
      description:
          'A useful idea. A little question. A moment worth sharing. Make room for your campus community.',
      appBar: AppBar(title: const Text('Community')),
      floatingActionButton: signedIn
          ? FloatingActionButton.extended(
              onPressed: _compose,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Post'),
            )
          : null,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SearchBar(
              controller: _search,
              hintText: 'A topic, a story, a person…',
              leading: const Icon(Icons.search),
              onSubmitted: (value) {
                setState(() => _query = value.trim());
                _reload();
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'all', label: Text('All')),
                ButtonSegment(value: 'mine', label: Text('Mine')),
                ButtonSegment(value: 'liked', label: Text('Liked')),
              ],
              selected: {_view},
              onSelectionChanged: (values) =>
                  setState(() => _view = values.first),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _reload,
              child: FutureBuilder<_Feed>(
                future: _future,
                builder: (context, snapshot) => AsyncView<_Feed>(
                  snapshot: snapshot,
                  onRetry: _reload,
                  emptyTitle: 'No stories yet',
                  emptyMessage: 'Be the first to share something.',
                  emptyIcon: Icons.forum_outlined,
                  builder: (context, feed) {
                    final all = [...feed.mine, ...feed.public];
                    final visible = all.where((post) {
                      if (_view == 'mine' && !post.mine) return false;
                      if (_view == 'liked' && !feed.reacted.contains(post.id)) {
                        return false;
                      }
                      return true;
                    }).toList();
                    if (visible.isEmpty) {
                      return const EmptyView(
                        title: 'Nothing in this view',
                        message: 'Try another filter.',
                        icon: Icons.forum_outlined,
                      );
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: visible.length + 1,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return const Padding(
                            padding: EdgeInsets.only(bottom: 8),
                            child: Text(
                              'Share updates with students across your campus. Your posts and replies sync to your account.',
                            ),
                          );
                        }
                        final post = visible[index - 1];
                        return PostCard(
                          post: post,
                          liked: feed.reacted.contains(post.id),
                          replies: feed.replies
                              .where((r) => r.postId == post.id)
                              .toList(),
                          onChanged: _reload,
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PostCard extends StatefulWidget {
  const PostCard({
    super.key,
    required this.post,
    required this.liked,
    required this.replies,
    required this.onChanged,
  });

  final FeedPost post;
  final bool liked;
  final List<PostReply> replies;
  final VoidCallback onChanged;

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> {
  bool _expanded = false;
  final _reply = TextEditingController();

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  Future<void> _react() async {
    if (!SessionScope.sessionOf(context).signedIn) {
      showAppMessage(context, 'Please sign in to react.', error: true);
      return;
    }
    try {
      await CommunityRepository(
        SessionScope.apiOf(context),
      ).setReacted(widget.post.id, !widget.liked);
      widget.onChanged();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _sendReply() async {
    final body = _reply.text.trim();
    if (body.length < 2) return;
    final session = SessionScope.sessionOf(context);
    if (!session.signedIn) {
      showAppMessage(context, 'Please sign in to reply.', error: true);
      return;
    }
    try {
      await CommunityRepository(SessionScope.apiOf(context)).addReply(
        PostReply(
          id: newRecordId('reply'),
          postId: widget.post.id,
          author: session.user?.name ?? 'You',
          body: body,
          createdAt: DateTime.now().toUtc().toIso8601String(),
        ),
      );
      _reply.clear();
      widget.onChanged();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _remove() async {
    try {
      await CommunityRepository(
        SessionScope.apiOf(context),
      ).removePost(widget.post.id);
      widget.onChanged();
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  Future<void> _concern() async {
    final api = SessionScope.apiOf(context);
    final result = await showDialog<_ConcernResult>(
      context: context,
      builder: (context) => const _ConcernDialog(),
    );
    if (result == null) return;
    try {
      final repo = CommunityRepository(api);
      if (result.escalate) {
        await repo.reportPost(
          widget.post.id,
          result.reason,
          result.note,
        );
        if (mounted) {
          showAppMessage(context, 'Report sent to the moderation team.');
        }
      } else {
        await repo.addConcern(
          targetId: widget.post.id,
          reason: result.reason,
          note: result.note,
        );
        if (mounted) {
          showAppMessage(context, 'Noted privately on your account.');
        }
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CampusAvatar(name: post.author, size: 40),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.author,
                        style: Theme.of(context).textTheme.titleSmall,
                      ),
                      Text(
                        '${post.topic} · ${prettyDate(post.createdAt)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                if (post.mine) ...[
                  const StatusChip(label: 'Only you'),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      if (value == 'delete') _remove();
                    },
                    itemBuilder: (_) => const [
                      PopupMenuItem(value: 'delete', child: Text('Delete')),
                    ],
                  ),
                ] else
                  IconButton(
                    tooltip: 'Raise a concern',
                    icon: const Icon(Icons.flag_outlined),
                    onPressed: SessionScope.sessionOf(context).signedIn
                        ? _concern
                        : null,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(post.body),
            if ((post.photo ?? '').isNotEmpty) ...[
              const SizedBox(height: 12),
              CampusImage(
                image: CampusMedia.tryParse(post.photo,
                    alt: 'Photo shared with this post'),
                alt: 'Photo shared with this post',
                aspect: CampusAspect.video,
                borderRadius: BorderRadius.circular(CampusRadii.media),
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                TextButton.icon(
                  onPressed: _react,
                  icon: Icon(
                    widget.liked
                        ? Icons.favorite
                        : Icons.favorite_border_outlined,
                  ),
                  label: Text('${post.likes + (widget.liked ? 1 : 0)}'),
                ),
                TextButton.icon(
                  onPressed: () => setState(() => _expanded = !_expanded),
                  icon: const Icon(Icons.comment_outlined),
                  label: Text('${widget.replies.length}'),
                ),
              ],
            ),
            if (_expanded) ...[
              for (final reply in widget.replies)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: Text(reply.body),
                  subtitle: Text(
                    '${reply.author} · ${prettyDate(reply.createdAt)}',
                  ),
                ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _reply,
                      decoration: const InputDecoration(
                        hintText: 'Write a reply…',
                      ),
                      onSubmitted: (_) => _sendReply(),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Send reply',
                    icon: const Icon(Icons.send),
                    onPressed: _sendReply,
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class PostComposerSheet extends StatefulWidget {
  const PostComposerSheet({super.key});

  @override
  State<PostComposerSheet> createState() => _PostComposerSheetState();
}

class _PostComposerSheetState extends State<PostComposerSheet> {
  final _body = TextEditingController();
  String _topic = 'Campus life';
  String? _photo;
  bool _busy = false;

  static const _topics = [
    'Campus life',
    'Study',
    'Clubs',
    'Events',
    'Opportunities',
  ];

  @override
  void dispose() {
    _body.dispose();
    super.dispose();
  }

  Future<void> _attach() async {
    try {
      final photo = await AppPhotos.chooseDataUrl(context);
      if (photo != null && mounted) setState(() => _photo = photo);
    } on PhotoTooLarge catch (error) {
      if (mounted) showAppMessage(context, error.toString(), error: true);
    } catch (_) {
      if (mounted) {
        showAppMessage(context, 'Could not read that photo.', error: true);
      }
    }
  }

  Future<void> _publish() async {
    if (_body.text.trim().length < 5 || _busy) {
      showAppMessage(context, 'Share at least five characters.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      final session = SessionScope.sessionOf(context);
      await CommunityRepository(SessionScope.apiOf(context)).publish(
        FeedPost(
          id: newRecordId('post'),
          author: session.user?.name ?? 'You',
          body: _body.text.trim(),
          createdAt: DateTime.now().toUtc().toIso8601String(),
          topic: _topic,
          likes: 0,
          mine: true,
          photo: _photo,
        ),
      );
      if (mounted) {
        showAppMessage(context, 'Posted to your account.');
        Navigator.of(context).pop(true);
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New post')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DropdownButtonFormField<String>(
            initialValue: _topic,
            decoration: const InputDecoration(labelText: 'Topic'),
            items: [
              for (final topic in _topics)
                DropdownMenuItem(value: topic, child: Text(topic)),
            ],
            onChanged: (value) => setState(() => _topic = value ?? _topic),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _body,
            decoration: const InputDecoration(
              labelText: 'What is happening on campus?',
            ),
            minLines: 4,
            maxLines: 8,
            maxLength: 3000,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _attach,
            icon: const Icon(Icons.photo_outlined),
            label: Text(_photo == null ? 'Add a photo' : 'Change photo'),
          ),
          if (_photo != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Stack(
                children: [
                  CampusImage(
                    image: CampusMedia.tryParse(
                      _photo,
                      alt: 'Photo attached to your post',
                    ),
                    alt: 'Photo attached to your post',
                    aspect: CampusAspect.video,
                    showProvenance: false,
                    borderRadius: BorderRadius.circular(18),
                  ),
                  Positioned(
                    right: 10,
                    top: 10,
                    child: IconButton.filledTonal(
                      tooltip: 'Remove attached photo',
                      onPressed: () => setState(() => _photo = null),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Your photo will appear with your post.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
          const SizedBox(height: 8),
          const Text(
            'Only you can see your posts. They sync to your account across devices.',
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: _busy ? null : _publish,
            child: const Text('Post'),
          ),
        ],
      ),
    );
  }
}

class _ConcernResult {
  _ConcernResult({
    required this.reason,
    required this.note,
    required this.escalate,
  });

  final String reason;
  final String note;
  final bool escalate;
}

class _ConcernDialog extends StatefulWidget {
  const _ConcernDialog();

  @override
  State<_ConcernDialog> createState() => _ConcernDialogState();
}

class _ConcernDialogState extends State<_ConcernDialog> {
  final _note = TextEditingController();
  String _reason = 'spam';
  bool _escalate = false;

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Raise a concern'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _reason,
            items: const [
              DropdownMenuItem(value: 'spam', child: Text('Spam')),
              DropdownMenuItem(value: 'harassment', child: Text('Harassment')),
              DropdownMenuItem(value: 'privacy', child: Text('Privacy')),
              DropdownMenuItem(value: 'other', child: Text('Other')),
            ],
            onChanged: (value) => setState(() => _reason = value ?? 'spam'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _note,
            decoration: const InputDecoration(labelText: 'What is wrong?'),
            minLines: 2,
            maxLines: 4,
            onChanged: (_) => setState(() {}),
          ),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Send to moderators'),
            subtitle: const Text('Off keeps it as your private note.'),
            value: _escalate,
            onChanged: (value) => setState(() => _escalate = value),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _note.text.trim().length >= 10
              ? () => Navigator.of(context).pop(
                    _ConcernResult(
                      reason: _reason,
                      note: _note.text.trim(),
                      escalate: _escalate,
                    ),
                  )
              : null,
          child: const Text('Save'),
        ),
      ],
    );
  }
}

class _Feed {
  _Feed({
    required this.public,
    required this.mine,
    required this.replies,
    required this.reacted,
  });

  final List<FeedPost> public;
  final List<FeedPost> mine;
  final List<PostReply> replies;
  final Set<String> reacted;
}
