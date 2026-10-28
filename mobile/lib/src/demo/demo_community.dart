import 'package:flutter/material.dart';

import '../core/media/media.dart';
import '../core/photos/app_photos.dart';
import '../core/theme/app_theme.dart';

const _feedImages = <String>[
  'assets/demo/gctu-students-together.jpg',
  'assets/demo/gctu-students-1.jpg',
  'assets/demo/gctu-student-matriculation.jpg',
  'assets/demo/gctu-students-2.jpg',
  'assets/demo/gctu-students-3.jpg',
];

class DemoCommunityScreen extends StatefulWidget {
  const DemoCommunityScreen({super.key});

  @override
  State<DemoCommunityScreen> createState() => _DemoCommunityScreenState();
}

class _DemoCommunityScreenState extends State<DemoCommunityScreen> {
  String _filter = 'For you';
  final List<_FeedPost> _posts = [
    _FeedPost(
      author: 'GCTU Student',
      detail: 'Computing student  |  Level 300',
      time: '12 min ago',
      text:
          'Good conversations and big ideas after the campus meetup. What are you building this semester?',
      image: _feedImages[0],
      likes: 24,
      comments: ['Looking forward to the next one!'],
      category: 'Campus',
    ),
    _FeedPost(
      author: 'Student Demo',
      detail: 'New student  |  GCTU',
      time: '1 hr ago',
      text:
          'One step at a time. Getting to know the campus and finding my people.',
      image: _feedImages[2],
      likes: 18,
      comments: [],
      category: 'Campus',
    ),
    _FeedPost(
      author: 'GCTU Student',
      detail: 'Study group  |  Level 200',
      time: '3 hrs ago',
      text:
          'Study group is meeting this afternoon. Bring your questions and notes; everyone is welcome.',
      image: _feedImages[1],
      likes: 12,
      comments: ['Where are you meeting?'],
      category: 'Study',
    ),
  ];
  final Set<_FeedPost> _liked = {};

  Future<void> _compose() async {
    final textController = TextEditingController();
    String? selectedImage = _feedImages[0];
    final post = await showModalBottomSheet<_FeedPost>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => StatefulBuilder(
        builder: (context, refreshSheet) => Padding(
          padding: EdgeInsets.fromLTRB(
              18, 8, 18, MediaQuery.of(context).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Create a campus post',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 19,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 12),
                  TextField(
                      controller: textController,
                      autofocus: true,
                      minLines: 3,
                      maxLines: 5,
                      maxLength: 240,
                      decoration: const InputDecoration(
                          hintText: 'What would you like to share?',
                          alignLabelWithHint: true)),
                  const SizedBox(height: 8),
                  Row(children: [
                    const Expanded(
                        child: Text('Post photo',
                            style: TextStyle(fontWeight: FontWeight.w700))),
                    TextButton.icon(
                      onPressed: () async {
                        try {
                          final photo = await AppPhotos.chooseDataUrl(context);
                          if (photo != null) {
                            refreshSheet(() => selectedImage = photo);
                          }
                        } on PhotoTooLarge catch (error) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(error.toString())));
                          }
                        } catch (_) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content:
                                        Text('Could not load that photo.')));
                          }
                        }
                      },
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Gallery'),
                    ),
                  ]),
                  const SizedBox(height: 8),
                  if (selectedImage != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: AspectRatio(
                        aspectRatio: 16 / 9,
                        child: Stack(fit: StackFit.expand, children: [
                          _FeedPhoto(source: selectedImage!),
                          Positioned(
                            right: 8,
                            top: 8,
                            child: IconButton.filledTonal(
                              tooltip: 'Remove photo',
                              onPressed: () =>
                                  refreshSheet(() => selectedImage = null),
                              icon: const Icon(Icons.close_rounded),
                            ),
                          ),
                        ]),
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      'Preview · this photo will appear with your post',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                    ),
                  ] else
                    OutlinedButton.icon(
                      onPressed: () =>
                          refreshSheet(() => selectedImage = _feedImages.first),
                      icon: const Icon(Icons.add_photo_alternate_outlined),
                      label: const Text('Choose a sample photo'),
                    ),
                  const SizedBox(height: 8),
                  const Text('Or choose a sample campus photo',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  SizedBox(
                      height: 72,
                      child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _feedImages.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 9),
                          itemBuilder: (context, index) {
                            final image = _feedImages[index];
                            final selected = selectedImage == image;
                            return GestureDetector(
                                onTap: () =>
                                    refreshSheet(() => selectedImage = image),
                                child: Container(
                                    width: 76,
                                    height: 72,
                                    decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(13),
                                        border: Border.all(
                                            color: selected
                                                ? CampusColors.primary
                                                : Colors.transparent,
                                            width: 3)),
                                    child: ClipRRect(
                                        borderRadius: BorderRadius.circular(10),
                                        child: Image.asset(image,
                                            fit: BoxFit.cover,
                                            alignment: Alignment.center))));
                          })),
                  const SizedBox(height: 16),
                  SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                          onPressed: () {
                            final text = textController.text.trim();
                            if (text.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Write something before sharing.')));
                              return;
                            }
                            Navigator.pop(
                                context,
                                _FeedPost(
                                    author: 'Student Demo',
                                    detail: 'GCTU student',
                                    time: 'Just now',
                                    text: text,
                                    image: selectedImage,
                                    likes: 0,
                                    comments: [],
                                    category: 'Campus'));
                          },
                          icon: const Icon(Icons.send_rounded),
                          label: const Text('Share post'))),
                  const SizedBox(height: 6),
                  Text(
                      'Local presentation post. It will not be published online.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 11)),
                ]),
          ),
        ),
      ),
    );
    textController.dispose();
    if (post != null && mounted) setState(() => _posts.insert(0, post));
  }

  Future<void> _comment(int index) async {
    final controller = TextEditingController();
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
            18, 8, 18, MediaQuery.of(context).viewInsets.bottom + 18),
        child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Comments',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontSize: 19,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              if (_posts[index].comments.isEmpty)
                const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text('Start the conversation.')),
              for (final comment in _posts[index].comments)
                ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                        backgroundColor: Color(0xFFEAF0FF),
                        child: Icon(Icons.person_rounded,
                            color: Theme.of(context).colorScheme.primary)),
                    title: Text(comment),
                    subtitle: const Text('Local demo comment')),
              TextField(
                  controller: controller,
                  autofocus: true,
                  decoration: InputDecoration(
                      hintText: 'Add a comment',
                      suffixIcon: IconButton(
                          icon: const Icon(Icons.send_rounded),
                          onPressed: () =>
                              Navigator.pop(context, controller.text.trim()))),
                  onSubmitted: (value) => Navigator.pop(context, value.trim())),
            ]),
      ),
    );
    controller.dispose();
    if (result != null && result.trim().isNotEmpty && mounted) {
      setState(() => _posts[index].comments.add(result.trim()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final visible = _filter == 'For you'
        ? _posts
        : _posts.where((post) => post.category == _filter).toList();
    return Scaffold(
      body: SafeArea(
          bottom: false,
          child: CustomScrollView(slivers: [
            SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
                sliver: SliverToBoxAdapter(
                    child: Row(children: [
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('CAMPUSONE COMMUNITY',
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1)),
                        const SizedBox(height: 5),
                        Text('Campus, together.',
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(
                                    color:
                                        Theme.of(context).colorScheme.onSurface,
                                    fontWeight: FontWeight.w800))
                      ])),
                  IconButton.filledTonal(
                      onPressed: _compose,
                      tooltip: 'Create post',
                      icon: const Icon(Icons.add_rounded)),
                ]))),
            SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 12),
                sliver: SliverToBoxAdapter(
                    child: _CommunityComposer(onTap: _compose))),
            SliverToBoxAdapter(
                child: SizedBox(
                    height: 45,
                    child: ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        scrollDirection: Axis.horizontal,
                        children: [
                          for (final filter in ['For you', 'Campus', 'Study'])
                            Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                    label: Text(filter),
                                    selected: _filter == filter,
                                    onSelected: (_) =>
                                        setState(() => _filter = filter)))
                        ]))),
            SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 8, 14, 22),
                sliver: SliverList.builder(
                    itemCount: visible.length,
                    itemBuilder: (context, index) {
                      final post = visible[index];
                      final postIndex = _posts.indexOf(post);
                      final liked = _liked.contains(post);
                      return _CommunityPostCard(
                          post: post,
                          liked: liked,
                          onLike: () => setState(() =>
                              liked ? _liked.remove(post) : _liked.add(post)),
                          onComment: () => _comment(postIndex),
                          onShare: () => ScaffoldMessenger.of(context)
                              .showSnackBar(const SnackBar(
                                  content: Text(
                                      'Sharing is preview-only in this offline demo.'))));
                    })),
          ])),
      floatingActionButton: FloatingActionButton.extended(
          onPressed: _compose,
          icon: const Icon(Icons.edit_rounded),
          label: const Text('Create post')),
    );
  }
}

class _FeedPost {
  _FeedPost(
      {required this.author,
      required this.detail,
      required this.time,
      required this.text,
      required this.image,
      required this.likes,
      required this.comments,
      required this.category});
  final String author, detail, time, text, category;
  final String? image;
  final int likes;
  final List<String> comments;
}

class _FeedPhoto extends StatelessWidget {
  const _FeedPhoto({required this.source});
  final String source;

  @override
  Widget build(BuildContext context) {
    if (source.startsWith('data:image/')) {
      return CampusImage(
        image: CampusMedia.tryParse(source, alt: 'Photo attached to a post'),
        alt: 'Photo attached to a post',
        aspect: CampusAspect.auto,
        fit: BoxFit.cover,
        showProvenance: false,
      );
    }
    return Image.asset(
      source,
      fit: BoxFit.cover,
      alignment: Alignment.center,
      errorBuilder: (_, __, ___) => ColoredBox(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        child: Center(
          child: Icon(Icons.broken_image_outlined,
              color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      ),
    );
  }
}

class _CommunityComposer extends StatelessWidget {
  const _CommunityComposer({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Material(
      color: Theme.of(context).colorScheme.surfaceContainerLow,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Row(children: [
                const CircleAvatar(
                    radius: 19,
                    backgroundImage:
                        AssetImage('assets/demo/ama-demo-profile.jpg')),
                const SizedBox(width: 10),
                Expanded(
                    child: Text('Share something with campus...',
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 13))),
                IconButton(
                    onPressed: onTap,
                    tooltip: 'Add a photo',
                    icon: Icon(Icons.photo_outlined,
                        color: Theme.of(context).colorScheme.primary)),
                Icon(Icons.edit_note_rounded,
                    color: Theme.of(context).colorScheme.primary)
              ]))));
}

class _CommunityPostCard extends StatelessWidget {
  const _CommunityPostCard(
      {required this.post,
      required this.liked,
      required this.onLike,
      required this.onComment,
      required this.onShare});
  final _FeedPost post;
  final bool liked;
  final VoidCallback onLike, onComment, onShare;
  @override
  Widget build(BuildContext context) => Card(
      margin: const EdgeInsets.only(bottom: 13),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(13, 13, 10, 10),
            child: Row(children: [
              const CircleAvatar(
                  radius: 21,
                  backgroundImage:
                      AssetImage('assets/demo/ama-demo-profile.jpg')),
              const SizedBox(width: 10),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(post.author,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 13)),
                    const SizedBox(height: 2),
                    Text('${post.detail}  |  ${post.time}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 10))
                  ])),
              IconButton(
                  onPressed: () => showModalBottomSheet<void>(
                      context: context,
                      showDragHandle: true,
                      builder: (context) => SafeArea(
                              child: Wrap(children: [
                            ListTile(
                                leading: const Icon(Icons.flag_outlined),
                                title: const Text('Report post'),
                                subtitle: const Text('Demo action only'),
                                onTap: () => Navigator.pop(context))
                          ]))),
                  icon: const Icon(Icons.more_horiz_rounded))
            ])),
        Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(post.text,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 13,
                    height: 1.4))),
        const SizedBox(height: 10),
        if (post.image case final image?)
          AspectRatio(aspectRatio: 1.18, child: _FeedPhoto(source: image)),
        Padding(
            padding: const EdgeInsets.fromLTRB(8, 4, 8, 8),
            child: Row(children: [
              IconButton(
                  onPressed: onLike,
                  tooltip: liked ? 'Unlike' : 'Like',
                  icon: Icon(
                      liked
                          ? Icons.favorite_rounded
                          : Icons.favorite_border_rounded,
                      color: liked
                          ? const Color(0xFFD94E5D)
                          : CampusColors.primary)),
              Text('${post.likes + (liked ? 1 : 0)}',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700)),
              const SizedBox(width: 14),
              IconButton(
                  onPressed: onComment,
                  tooltip: 'Comment',
                  icon: Icon(Icons.mode_comment_outlined,
                      color: Theme.of(context).colorScheme.primary)),
              Text('${post.comments.length}',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700)),
              const Spacer(),
              IconButton(
                  onPressed: onShare,
                  tooltip: 'Share',
                  icon: Icon(Icons.share_outlined,
                      color: Theme.of(context).colorScheme.primary))
            ])),
      ]));
}
