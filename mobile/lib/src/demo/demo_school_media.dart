import 'package:flutter/material.dart';

import 'demo_store.dart';

const _schoolStories = <_SchoolStory>[
  _SchoolStory(
    id: 'campus-welcome',
    category: 'Campus news',
    type: 'News',
    title: 'A warm welcome to a new campus chapter',
    summary:
        'A student-focused introduction to finding your community, getting oriented and making the most of campus life.',
    date: 'CampusOne feature',
    author: 'School Media desk',
    image: 'assets/demo/gctu-student-matriculation.jpg',
    duration: '4 min read',
    body:
        'Starting university is a collection of small firsts: your first lecture, first group project and first familiar face on campus. This sample feature brings together a few practical ways to find your footing, meet other students and keep an eye on official university updates. Confirm dates, services and announcements through GCTU channels.',
  ),
  _SchoolStory(
    id: 'student-voices',
    category: 'Interviews',
    type: 'Interview',
    title: 'Student voices: finding your place at GCTU',
    summary:
        'Students share how clubs, class groups and campus activities helped them feel at home.',
    date: 'Student conversations',
    author: 'Campus conversations',
    image: 'assets/demo/gctu-students-together.jpg',
    duration: '6 min read',
    body:
        'In this sample interview feature, students talk about the people and experiences that helped them settle into campus life. Their advice: start with one interest, ask questions and give yourself time to find your community. These are illustrative demo voices, not attributed real interviews.',
  ),
  _SchoolStory(
    id: 'tech-podcast',
    category: 'Podcasts',
    type: 'Audio',
    title: 'The campus signal: ideas, tech and student life',
    summary:
        'A sample podcast episode about creative projects and collaboration on campus.',
    date: 'Podcast preview',
    author: 'CampusOne Audio',
    image: 'assets/demo/gctu-students-2.jpg',
    duration: '18 min',
    body:
        'A sample episode card for a future campus podcast series. A real audio file and verified host information will appear here when published by the university media team.',
  ),
  _SchoolStory(
    id: 'campus-life-video',
    category: 'Videos',
    type: 'Video',
    title: 'A quick look at student life',
    summary:
        'A visual campus-life preview with moments from student activities and shared spaces.',
    date: 'Video preview',
    author: 'School Media desk',
    image: 'assets/demo/gctu-students-3.jpg',
    duration: '2 min',
    body:
        'This demo video feature uses a campus photograph as its cover. Playback will be available when an approved video is attached by the School Media team.',
  ),
  _SchoolStory(
    id: 'event-recap',
    category: 'Event coverage',
    type: 'Gallery',
    title: 'Campus moments worth remembering',
    summary:
        'A sample event recap bringing together student participation, photos and highlights.',
    date: 'Photo story',
    author: 'Campus photo desk',
    image: 'assets/demo/gctu-students-1.jpg',
    duration: '12 photos',
    body:
        'A sample event-coverage story layout for photos, captions and highlights. Event names, dates and participants should be confirmed before official publication.',
  ),
  _SchoolStory(
    id: 'study-spaces',
    category: 'Campus news',
    type: 'Guide',
    title: 'Make a study routine that works for you',
    summary:
        'Simple ideas for planning study time, finding resources and learning with classmates.',
    date: 'Student guide',
    author: 'School Media desk',
    image: 'assets/demo/study-library-pexels.jpg',
    duration: '3 min read',
    body:
        'Try short focused sessions, keep deadlines in your calendar and use course materials shared by approved class channels. Ask your lecturer or Course Rep when course information is unclear.',
  ),
];

const _mediaCategories = [
  'For you',
  'Campus news',
  'Podcasts',
  'Videos',
  'Interviews',
  'Event coverage',
];

class DemoSchoolMediaScreen extends StatefulWidget {
  const DemoSchoolMediaScreen({super.key, required this.store});
  final DemoStore store;

  @override
  State<DemoSchoolMediaScreen> createState() => _DemoSchoolMediaScreenState();
}

class _DemoSchoolMediaScreenState extends State<DemoSchoolMediaScreen> {
  final _search = TextEditingController();
  String _category = 'For you';
  bool _savedOnly = false;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _search.text.trim().toLowerCase();
    final stories = _schoolStories.where((story) {
      final matchesCategory =
          _category == 'For you' || story.category == _category;
      final matchesQuery =
          '${story.title} ${story.summary} ${story.author} ${story.type}'
              .toLowerCase()
              .contains(query);
      return matchesCategory &&
          matchesQuery &&
          (!_savedOnly || widget.store.isSchoolMediaSaved(story.id));
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('School Media'),
        actions: [
          IconButton(
            tooltip: _savedOnly ? 'Show all stories' : 'Saved stories',
            onPressed: () => setState(() => _savedOnly = !_savedOnly),
            icon: Icon(_savedOnly
                ? Icons.bookmark_rounded
                : Icons.bookmark_border_rounded),
          ),
        ],
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final columns = constraints.maxWidth >= 700 ? 3 : 2;
          final featured = stories.isNotEmpty &&
              _category == 'For you' &&
              query.isEmpty &&
              !_savedOnly;
          final remaining = featured ? stories.skip(1).toList() : stories;
          return CustomScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                sliver: SliverToBoxAdapter(child: _MediaWelcomeHero()),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                sliver: SliverToBoxAdapter(
                  child: SearchBar(
                    controller: _search,
                    hintText: 'Search stories, topics and people',
                    leading: const Icon(Icons.search_rounded),
                    trailing: [
                      if (_search.text.isNotEmpty)
                        IconButton(
                          tooltip: 'Clear search',
                          onPressed: () {
                            _search.clear();
                            setState(() {});
                          },
                          icon: const Icon(Icons.close_rounded),
                        ),
                    ],
                    onChanged: (_) => setState(() {}),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 46,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: _mediaCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final category = _mediaCategories[index];
                      return ChoiceChip(
                        label: Text(category),
                        selected: category == _category,
                        onSelected: (_) => setState(() => _category = category),
                      );
                    },
                  ),
                ),
              ),
              if (featured) ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  sliver: SliverToBoxAdapter(
                    child: _sectionTitle(
                        context, 'Editor’s pick', 'A good place to start'),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverToBoxAdapter(
                    child: _FeaturedMediaCard(
                      story: stories.first,
                      saved: widget.store.isSchoolMediaSaved(stories.first.id),
                      onSave: () => _toggleSaved(stories.first),
                      onTap: () => _open(stories.first),
                    ),
                  ),
                ),
              ],
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
                sliver: SliverToBoxAdapter(
                  child: _sectionTitle(
                    context,
                    _savedOnly ? 'Your saved stories' : 'Latest from campus',
                    '${remaining.length} ${remaining.length == 1 ? 'story' : 'stories'}',
                  ),
                ),
              ),
              if (remaining.isEmpty)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
                  sliver: SliverToBoxAdapter(
                    child: _MediaEmptyState(
                      savedOnly: _savedOnly,
                      onReset: () => setState(() {
                        _search.clear();
                        _category = 'For you';
                        _savedOnly = false;
                      }),
                    ),
                  ),
                )
              else if (constraints.maxWidth >= 560)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  sliver: SliverGrid.builder(
                    itemCount: remaining.length,
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: columns,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: columns == 3 ? .82 : .72,
                    ),
                    itemBuilder: (context, index) => _MediaStoryCard(
                      story: remaining[index],
                      saved:
                          widget.store.isSchoolMediaSaved(remaining[index].id),
                      onSave: () => _toggleSaved(remaining[index]),
                      onTap: () => _open(remaining[index]),
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
                  sliver: SliverList.separated(
                    itemCount: remaining.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) => SizedBox(
                      height: 310,
                      child: _MediaStoryCard(
                        story: remaining[index],
                        saved: widget.store
                            .isSchoolMediaSaved(remaining[index].id),
                        onSave: () => _toggleSaved(remaining[index]),
                        onTap: () => _open(remaining[index]),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _toggleSaved(_SchoolStory story) {
    widget.store.toggleSchoolMediaSaved(story.id);
    setState(() {});
  }

  void _open(_SchoolStory story) => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => _SchoolStoryDetail(
            story: story,
            isSaved: widget.store.isSchoolMediaSaved(story.id),
            onSave: () => _toggleSaved(story),
          ),
        ),
      );
}

Widget _sectionTitle(BuildContext context, String title, String subtitle) =>
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title,
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 2),
      Text(subtitle,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant)),
    ]);

class _MediaWelcomeHero extends StatelessWidget {
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: SizedBox(
          height: 220,
          child: Stack(fit: StackFit.expand, children: [
            Image.asset('assets/demo/gctu-students-together.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    ColoredBox(color: Theme.of(context).colorScheme.primary)),
            const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0x1800173F), Color(0xE600173F)],
                ),
              ),
            ),
            Positioned(
              left: 18,
              right: 18,
              bottom: 18,
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GCTU STORIES · PEOPLE · IDEAS',
                        style: TextStyle(
                            color: Color(0xFFFFD34D),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.2)),
                    const SizedBox(height: 6),
                    Text('The stories shaping campus.',
                        style: Theme.of(context)
                            .textTheme
                            .headlineSmall
                            ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800)),
                    const SizedBox(height: 4),
                    const Text(
                        'News, conversations, audio and event moments—all in one place.',
                        style: TextStyle(color: Colors.white70, height: 1.35)),
                  ]),
            ),
          ]),
        ),
      );
}

class _FeaturedMediaCard extends StatelessWidget {
  const _FeaturedMediaCard({
    required this.story,
    required this.saved,
    required this.onSave,
    required this.onTap,
  });
  final _SchoolStory story;
  final bool saved;
  final VoidCallback onSave, onTap;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Stack(children: [
              AspectRatio(
                aspectRatio: 16 / 8.5,
                child: Image.asset(story.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => ColoredBox(
                        color: Theme.of(context).colorScheme.primaryContainer)),
              ),
              Positioned(
                left: 12,
                top: 12,
                child: _StoryTypeLabel(story: story, prominent: true),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: IconButton.filledTonal(
                    tooltip: saved ? 'Remove saved story' : 'Save story',
                    onPressed: onSave,
                    icon: Icon(saved
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded)),
              ),
            ]),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(story.title,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800, height: 1.12)),
                    const SizedBox(height: 6),
                    Text(story.summary,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant)),
                    const SizedBox(height: 10),
                    _StoryMeta(story: story),
                  ]),
            ),
          ]),
        ),
      );
}

class _MediaStoryCard extends StatelessWidget {
  const _MediaStoryCard({
    required this.story,
    required this.saved,
    required this.onSave,
    required this.onTap,
  });
  final _SchoolStory story;
  final bool saved;
  final VoidCallback onSave, onTap;

  @override
  Widget build(BuildContext context) => Card(
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              flex: 5,
              child: Stack(fit: StackFit.expand, children: [
                Image.asset(story.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => ColoredBox(
                        color: Theme.of(context).colorScheme.primaryContainer)),
                Positioned(
                    left: 10, top: 10, child: _StoryTypeLabel(story: story)),
                Positioned(
                  right: 5,
                  top: 5,
                  child: IconButton.filledTonal(
                      tooltip: saved ? 'Remove saved story' : 'Save story',
                      onPressed: onSave,
                      icon: Icon(saved
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded)),
                ),
                if (story.type == 'Video' || story.type == 'Audio')
                  Center(
                    child: Icon(
                      story.type == 'Video'
                          ? Icons.play_circle_fill_rounded
                          : Icons.headphones_rounded,
                      color: Colors.white,
                      size: 45,
                      shadows: const [
                        Shadow(color: Colors.black54, blurRadius: 10)
                      ],
                    ),
                  ),
              ]),
            ),
            Expanded(
              flex: 5,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 9),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(story.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context)
                              .textTheme
                              .titleSmall
                              ?.copyWith(fontWeight: FontWeight.w800)),
                      const SizedBox(height: 5),
                      Expanded(
                        child: Text(story.summary,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context)
                                .textTheme
                                .bodySmall
                                ?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant)),
                      ),
                      _StoryMeta(story: story, compact: true),
                    ]),
              ),
            ),
          ]),
        ),
      );
}

class _StoryTypeLabel extends StatelessWidget {
  const _StoryTypeLabel({required this.story, this.prominent = false});
  final _SchoolStory story;
  final bool prominent;

  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface.withValues(alpha: .94),
          borderRadius: BorderRadius.circular(99),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(
              horizontal: prominent ? 11 : 9, vertical: prominent ? 7 : 5),
          child: Text(story.type.toUpperCase(),
              style: TextStyle(
                  color: Theme.of(context).colorScheme.primary,
                  fontSize: prominent ? 10 : 9,
                  fontWeight: FontWeight.w900,
                  letterSpacing: .7)),
        ),
      );
}

class _StoryMeta extends StatelessWidget {
  const _StoryMeta({required this.story, this.compact = false});
  final _SchoolStory story;
  final bool compact;

  @override
  Widget build(BuildContext context) => Row(children: [
        Icon(Icons.person_outline_rounded,
            size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        Expanded(
            child: Text(story.author,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant))),
        const SizedBox(width: 6),
        Icon(Icons.schedule_rounded,
            size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: 3),
        Text(story.duration,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: compact ? 9 : null)),
      ]);
}

class _MediaEmptyState extends StatelessWidget {
  const _MediaEmptyState({required this.savedOnly, required this.onReset});
  final bool savedOnly;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) => Card(
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(children: [
            Icon(savedOnly ? Icons.bookmark_border : Icons.search_off_rounded,
                size: 38, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 10),
            Text(savedOnly ? 'No saved stories yet' : 'No stories found',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              savedOnly
                  ? 'Save an article, interview or episode to find it here.'
                  : 'Try a different search or media category.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            TextButton(
                onPressed: onReset, child: const Text('Explore all media')),
          ]),
        ),
      );
}

class _SchoolStoryDetail extends StatefulWidget {
  const _SchoolStoryDetail({
    required this.story,
    required this.isSaved,
    required this.onSave,
  });
  final _SchoolStory story;
  final bool isSaved;
  final VoidCallback onSave;

  @override
  State<_SchoolStoryDetail> createState() => _SchoolStoryDetailState();
}

class _SchoolStoryDetailState extends State<_SchoolStoryDetail> {
  late bool _saved = widget.isSaved;

  void _toggleSaved() {
    widget.onSave();
    setState(() => _saved = !_saved);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(widget.story.category),
          actions: [
            IconButton(
                tooltip: _saved ? 'Remove saved story' : 'Save story',
                onPressed: _toggleSaved,
                icon: Icon(_saved
                    ? Icons.bookmark_rounded
                    : Icons.bookmark_border_rounded)),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(22),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Stack(fit: StackFit.expand, children: [
                  Image.asset(widget.story.image,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => ColoredBox(
                          color:
                              Theme.of(context).colorScheme.primaryContainer)),
                  if (widget.story.type == 'Video' ||
                      widget.story.type == 'Audio')
                    Center(
                      child: IconButton.filledTonal(
                        tooltip: 'Demo media preview',
                        onPressed: () => ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(
                                content: Text(
                                    'Playback will be available when the media is published.'))),
                        icon: Icon(widget.story.type == 'Video'
                            ? Icons.play_arrow_rounded
                            : Icons.headphones_rounded),
                        iconSize: 36,
                      ),
                    ),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            Align(
                alignment: Alignment.centerLeft,
                child: _StoryTypeLabel(story: widget.story, prominent: true)),
            const SizedBox(height: 10),
            Text(widget.story.title,
                style: Theme.of(context)
                    .textTheme
                    .headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800, height: 1.13)),
            const SizedBox(height: 8),
            _StoryMeta(story: widget.story),
            const SizedBox(height: 4),
            Text(widget.story.date,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant)),
            const SizedBox(height: 14),
            Text(widget.story.summary,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.4)),
            const SizedBox(height: 16),
            Text(widget.story.body,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Theme.of(context).colorScheme.onSurface,
                    height: 1.6)),
            const SizedBox(height: 18),
            Card(
              child: ListTile(
                leading: Icon(Icons.info_outline_rounded,
                    color: Theme.of(context).colorScheme.primary),
                title: const Text('School Media preview'),
                subtitle: const Text(
                    'Sample content and imagery for presentation. Official stories should be published by an authorized campus media team.'),
              ),
            ),
          ],
        ),
      );
}

class _SchoolStory {
  const _SchoolStory({
    required this.id,
    required this.category,
    required this.type,
    required this.title,
    required this.summary,
    required this.date,
    required this.author,
    required this.image,
    required this.duration,
    required this.body,
  });
  final String id;
  final String category;
  final String type;
  final String title;
  final String summary;
  final String date;
  final String author;
  final String image;
  final String duration;
  final String body;
}
