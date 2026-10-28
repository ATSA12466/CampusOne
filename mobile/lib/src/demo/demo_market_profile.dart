import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/photos/app_photos.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/theme_prefs.dart';
import 'demo_store.dart';

class DemoMarketItem {
  const DemoMarketItem(
      {required this.id,
      required this.title,
      required this.price,
      required this.condition,
      required this.category,
      required this.description,
      required this.imageUrl,
      required this.icon,
      required this.seller});
  final String id,
      title,
      price,
      condition,
      category,
      description,
      imageUrl,
      seller;
  final IconData icon;
}

const _marketItems = <DemoMarketItem>[
  DemoMarketItem(
      id: 'books',
      title: 'Computing textbooks bundle',
      price: 'GHS 180',
      condition: 'Good condition',
      category: 'Books',
      description:
          'A sample bundle of introductory computing and programming texts for student revision. Inspect the editions and condition before arranging a real purchase.',
      imageUrl:
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=1200&auto=format&fit=crop&q=85',
      icon: Icons.menu_book_rounded,
      seller: 'Campus seller demo'),
  DemoMarketItem(
      id: 'bag',
      title: 'Everyday student backpack',
      price: 'GHS 120',
      condition: 'Like new',
      category: 'Accessories',
      description:
          'A sample listing for a roomy student backpack with space for a laptop, books and daily essentials.',
      imageUrl:
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=85',
      icon: Icons.backpack_rounded,
      seller: 'Campus seller demo'),
  DemoMarketItem(
      id: 'headphones',
      title: 'Wireless headphones',
      price: 'GHS 260',
      condition: 'Good condition',
      category: 'Electronics',
      description:
          'A sample pair of wireless headphones for study sessions and campus travel. Battery and connectivity checks would be needed for a real listing.',
      imageUrl:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&auto=format&fit=crop&q=85',
      icon: Icons.headphones_rounded,
      seller: 'Campus seller demo'),
];

class DemoMarketScreen extends StatefulWidget {
  const DemoMarketScreen({super.key});
  @override
  State<DemoMarketScreen> createState() => _DemoMarketScreenState();
}

class _DemoMarketScreenState extends State<DemoMarketScreen> {
  String _category = 'All';
  final Set<String> _saved = {};
  @override
  Widget build(BuildContext context) {
    final items = _category == 'All'
        ? _marketItems
        : _marketItems.where((item) => item.category == _category).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Student marketplace'), actions: [
        IconButton(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                    content: Text('Selling is a local demo preview.'))),
            tooltip: 'Sell an item',
            icon: const Icon(Icons.add_box_outlined))
      ]),
      body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            ClipRRect(
                borderRadius: BorderRadius.circular(23),
                child: SizedBox(
                    height: 190,
                    child: Stack(fit: StackFit.expand, children: [
                      Image.network(_marketItems[0].imageUrl,
                          fit: BoxFit.cover,
                          alignment: Alignment.center,
                          loadingBuilder: (context, child, progress) =>
                              progress == null
                                  ? child
                                  : const _RemoteImageFallback(
                                      icon: Icons.storefront_rounded),
                          errorBuilder: (_, __, ___) =>
                              const _RemoteImageFallback(
                                  icon: Icons.storefront_rounded)),
                      const DecoratedBox(
                          decoration: BoxDecoration(
                              gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                            Color(0x22000000),
                            Color(0xE20B2545)
                          ]))),
                      const Positioned(
                          left: 18,
                          right: 18,
                          bottom: 18,
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('CAMPUS EXCHANGE',
                                    style: TextStyle(
                                        color: CampusColors.accent,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 1)),
                                SizedBox(height: 7),
                                Text('Good finds, shared on campus.',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 21)),
                                SizedBox(height: 5),
                                Text('Sample listings for your presentation.',
                                    style: TextStyle(
                                        color: Colors.white70, fontSize: 12))
                              ])),
                    ]))),
            const SizedBox(height: 14),
            Text('DEMO LISTINGS  |  Prices and sellers are fictional.',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 10,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 9),
            SizedBox(
                height: 42,
                child: ListView(scrollDirection: Axis.horizontal, children: [
                  for (final value in [
                    'All',
                    'Books',
                    'Electronics',
                    'Accessories'
                  ])
                    Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                            label: Text(value),
                            selected: _category == value,
                            onSelected: (_) =>
                                setState(() => _category = value)))
                ])),
            const SizedBox(height: 8),
            LayoutBuilder(builder: (context, constraints) {
              final columns = constraints.maxWidth >= 620 ? 3 : 2;
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: items.length,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: columns,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: constraints.maxWidth < 350
                      ? .58
                      : columns == 2
                          ? .74
                          : .80,
                ),
                itemBuilder: (context, index) {
                  final item = items[index];
                  final saved = _saved.contains(item.id);
                  return _MarketCard(
                    item: item,
                    saved: saved,
                    onTap: () =>
                        Navigator.of(context).push(MaterialPageRoute<void>(
                      builder: (_) => DemoMarketDetailScreen(
                        item: item,
                        initiallySaved: saved,
                        onSaveChanged: (value) => setState(() => value
                            ? _saved.add(item.id)
                            : _saved.remove(item.id)),
                      ),
                    )),
                    onSave: () => setState(() =>
                        saved ? _saved.remove(item.id) : _saved.add(item.id)),
                  );
                },
              );
            }),
            const SizedBox(height: 8),
            Text(
                'Product photos are illustrative stock images and load from the internet. Listing data and interactions remain local to this demo.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 10,
                    height: 1.4)),
          ]),
    );
  }
}

class DemoMarketDetailScreen extends StatefulWidget {
  const DemoMarketDetailScreen(
      {super.key,
      required this.item,
      this.initiallySaved = false,
      this.onSaveChanged});
  final DemoMarketItem item;
  final bool initiallySaved;
  final ValueChanged<bool>? onSaveChanged;
  @override
  State<DemoMarketDetailScreen> createState() => _DemoMarketDetailScreenState();
}

class _DemoMarketDetailScreenState extends State<DemoMarketDetailScreen> {
  late bool _saved = widget.initiallySaved;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Listing details'), actions: [
          IconButton(
              onPressed: () {
                setState(() => _saved = !_saved);
                widget.onSaveChanged?.call(_saved);
              },
              tooltip: _saved ? 'Remove saved item' : 'Save item',
              icon: Icon(_saved
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded))
        ]),
        body: ListView(padding: const EdgeInsets.only(bottom: 24), children: [
          SizedBox(
              height: 300,
              child: Image.network(widget.item.imageUrl,
                  fit: BoxFit.cover,
                  alignment: Alignment.center,
                  loadingBuilder: (context, child, progress) => progress == null
                      ? child
                      : _RemoteImageFallback(icon: widget.item.icon),
                  errorBuilder: (_, __, ___) =>
                      _RemoteImageFallback(icon: widget.item.icon))),
          Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
              child: Row(children: [
                Expanded(
                    child: Text(widget.item.title,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontSize: 22,
                            fontWeight: FontWeight.w800))),
                IconButton(
                    onPressed: () {
                      setState(() => _saved = !_saved);
                      widget.onSaveChanged?.call(_saved);
                    },
                    icon: Icon(
                        _saved
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        color: Theme.of(context).colorScheme.primary))
              ])),
          Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(widget.item.price,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.primary,
                      fontSize: 23,
                      fontWeight: FontWeight.w800))),
          Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
              child: Wrap(spacing: 8, children: [
                _InfoChip(
                    icon: Icons.category_outlined, text: widget.item.category),
                _InfoChip(
                    icon: Icons.verified_outlined, text: widget.item.condition)
              ])),
          const Divider(height: 1),
          Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('About this item',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 16)),
                    const SizedBox(height: 8),
                    Text(widget.item.description,
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            height: 1.5)),
                    const SizedBox(height: 20),
                    Text('Seller',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 16)),
                    const SizedBox(height: 10),
                    ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: CircleAvatar(
                            backgroundColor: Color(0xFFFFF0B5),
                            child: Icon(Icons.person_rounded,
                                color:
                                    Theme.of(context).colorScheme.onSurface)),
                        title: Text(widget.item.seller,
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: const Text('Sample seller profile'),
                        trailing: const Icon(Icons.chevron_right_rounded))
                  ])),
          Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: FilledButton.icon(
                  onPressed: () => showDialog<void>(
                      context: context,
                      builder: (context) => AlertDialog(
                              title: const Text('Contact seller'),
                              content: const Text(
                                  'Messaging is not connected. This is a presentation listing with fictional seller information.'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Close'))
                              ])),
                  icon: const Icon(Icons.chat_bubble_outline_rounded),
                  label: const Text('Contact seller'))),
          Padding(
              padding: EdgeInsets.all(18),
              child: Text(
                  'DEMO LISTING  |  No purchase or contact request will be sent.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                      fontSize: 10,
                      fontWeight: FontWeight.w700))),
        ]),
      );
}

class _MarketCard extends StatelessWidget {
  const _MarketCard(
      {required this.item,
      required this.saved,
      required this.onTap,
      required this.onSave});
  final DemoMarketItem item;
  final bool saved;
  final VoidCallback onTap, onSave;
  @override
  Widget build(BuildContext context) => Card(
      clipBehavior: Clip.antiAlias,
      margin: EdgeInsets.zero,
      child: InkWell(
          onTap: onTap,
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
                height: 125,
                width: double.infinity,
                child: Stack(fit: StackFit.expand, children: [
                  Image.network(item.imageUrl,
                      fit: BoxFit.cover,
                      alignment: Alignment.center,
                      loadingBuilder: (context, child, progress) =>
                          progress == null
                              ? child
                              : _RemoteImageFallback(icon: item.icon),
                      errorBuilder: (_, __, ___) =>
                          _RemoteImageFallback(icon: item.icon)),
                  Positioned(
                      top: 10,
                      left: 10,
                      child: Container(
                        constraints: const BoxConstraints(maxWidth: 92),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 6),
                        decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .94),
                            borderRadius: BorderRadius.circular(14)),
                        child: Text(item.category,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.onSurface,
                                fontSize: 10,
                                fontWeight: FontWeight.w800)),
                      )),
                  Positioned(
                      top: 4,
                      right: 4,
                      child: IconButton.filledTonal(
                          onPressed: onSave,
                          tooltip: saved ? 'Unsave item' : 'Save item',
                          icon: Icon(saved
                              ? Icons.bookmark_rounded
                              : Icons.bookmark_border_rounded)))
                ])),
            Padding(
              padding: const EdgeInsets.fromLTRB(12, 9, 12, 11),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                          height: 1.15)),
                  const SizedBox(height: 4),
                  Text(item.condition,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 11)),
                  const SizedBox(height: 5),
                  Text(item.price,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 14)),
                ],
              ),
            ),
          ])));
}

class DemoStudentProfileScreen extends StatefulWidget {
  const DemoStudentProfileScreen({super.key, this.store});
  final DemoStore? store;
  @override
  State<DemoStudentProfileScreen> createState() =>
      _DemoStudentProfileScreenState();
}

class _DemoStudentProfileScreenState extends State<DemoStudentProfileScreen> {
  final _name = TextEditingController();
  final _programme = TextEditingController();
  final _level = TextEditingController();
  final _bio = TextEditingController();
  final _interests = TextEditingController();
  final _campus = TextEditingController();
  final _editName = TextEditingController();
  final _editProgramme = TextEditingController();
  final _editLevel = TextEditingController();
  final _editBio = TextEditingController();
  final _editInterests = TextEditingController();
  final _editCampus = TextEditingController();
  String? _photoDataUrl;
  late bool _discoverable;
  late bool _showInterests;

  @override
  void initState() {
    super.initState();
    final store = widget.store;
    _name.text = store?.profileName ?? 'Student Demo';
    _programme.text = store?.profileProgramme ?? 'BSc. Information Technology';
    _level.text = store?.profileLevel ?? 'Level 300';
    _bio.text =
        store?.profileBio ?? 'Learning, building and connecting at GCTU.';
    _interests.text =
        store?.profileInterests ?? 'Technology, design, campus life';
    _campus.text = store?.profileCampus ?? 'Tesano, Accra';
    _photoDataUrl = store?.profilePhoto;
    _discoverable = store?.profileDiscoverable ?? true;
    _showInterests = store?.profileInterestsVisible ?? true;
  }

  @override
  void dispose() {
    _name.dispose();
    _programme.dispose();
    _level.dispose();
    _bio.dispose();
    _interests.dispose();
    _campus.dispose();
    _editName.dispose();
    _editProgramme.dispose();
    _editLevel.dispose();
    _editBio.dispose();
    _editInterests.dispose();
    _editCampus.dispose();
    super.dispose();
  }

  Future<void> _edit() async {
    _editName.text = _name.text;
    _editProgramme.text = _programme.text;
    _editLevel.text = _level.text;
    _editBio.text = _bio.text;
    _editInterests.text = _interests.text;
    _editCampus.text = _campus.text;
    final name = _editName;
    final programme = _editProgramme;
    final level = _editLevel;
    final bio = _editBio;
    final interests = _editInterests;
    final campus = _editCampus;
    var photoDataUrl = _photoDataUrl;
    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, updateDialog) => AlertDialog(
          title: const Text('Make it yours'),
          content: SizedBox(
            width: 440,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Column(children: [
                      Stack(alignment: Alignment.bottomRight, children: [
                        _DemoProfileAvatar(
                          photoDataUrl: photoDataUrl,
                          radius: 42,
                        ),
                        IconButton.filled(
                          tooltip: 'Update profile photo',
                          onPressed: () async {
                            try {
                              final picked =
                                  await AppPhotos.chooseDataUrl(context);
                              if (picked != null) {
                                updateDialog(() => photoDataUrl = picked);
                              }
                            } on PhotoTooLarge catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(error.toString())),
                                );
                              }
                            } catch (_) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content:
                                          Text('Could not open that photo.')),
                                );
                              }
                            }
                          },
                          icon: const Icon(
                            Icons.photo_library_outlined,
                            size: 18,
                          ),
                        ),
                      ]),
                      const SizedBox(height: 7),
                      Text(
                        'Choose a photo from your gallery',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context)
                                  .colorScheme
                                  .onSurfaceVariant,
                            ),
                      ),
                      if (photoDataUrl != null)
                        TextButton(
                          onPressed: () =>
                              updateDialog(() => photoDataUrl = null),
                          child: const Text('Restore demo photo'),
                        ),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  const _EditProfileLabel('ABOUT YOU'),
                  const SizedBox(height: 10),
                  TextField(
                    controller: name,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Name',
                      prefixIcon: Icon(Icons.person_outline_rounded),
                    ),
                  ),
                  const SizedBox(height: 11),
                  TextField(
                    controller: programme,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Programme',
                      prefixIcon: Icon(Icons.school_outlined),
                    ),
                  ),
                  const SizedBox(height: 11),
                  TextField(
                    controller: level,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Academic level',
                      prefixIcon: Icon(Icons.layers_outlined),
                    ),
                  ),
                  const SizedBox(height: 11),
                  TextField(
                    controller: campus,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Campus',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 18),
                  const _EditProfileLabel('PROFILE DETAILS'),
                  const SizedBox(height: 10),
                  TextField(
                    controller: bio,
                    maxLength: 240,
                    minLines: 2,
                    maxLines: 4,
                    decoration: const InputDecoration(
                      labelText: 'About me',
                      alignLabelWithHint: true,
                      prefixIcon: Icon(Icons.notes_rounded),
                    ),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: interests,
                    maxLength: 120,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: const InputDecoration(
                      labelText: 'Interests',
                      hintText: 'e.g. technology, music, football',
                      prefixIcon: Icon(Icons.auto_awesome_outlined),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Your changes are kept for this demo session.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton.icon(
              onPressed: () {
                if (name.text.trim().length < 2) return;
                Navigator.pop(dialogContext, true);
              },
              icon: const Icon(Icons.check_rounded, size: 18),
              label: const Text('Save profile'),
            ),
          ],
        ),
      ),
    );
    if (saved == true && mounted) {
      final cleanName = name.text.trim();
      final cleanProgramme = programme.text.trim();
      final cleanLevel = level.text.trim();
      final cleanBio = bio.text.trim();
      final cleanInterests = interests.text.trim();
      final cleanCampus = campus.text.trim();
      widget.store?.updateDemoProfile(
        name: cleanName,
        programme: cleanProgramme,
        level: cleanLevel,
        bio: cleanBio,
        interests: cleanInterests,
        campus: cleanCampus,
        photo: photoDataUrl,
      );
      setState(() {
        _name.text = cleanName;
        _programme.text = cleanProgramme;
        _level.text = cleanLevel;
        _bio.text = cleanBio;
        _interests.text = cleanInterests;
        _campus.text = cleanCampus;
        _photoDataUrl = photoDataUrl;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated for this demo.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: const Text('Student profile'),
          actions: [
            IconButton(
                onPressed: _edit,
                tooltip: 'Edit profile',
                icon: const Icon(Icons.edit_outlined)),
          ],
        ),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
          children: [
            Container(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 22),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    CampusColors.primaryDark,
                    CampusColors.primary,
                    Color(0xFF4776B9)
                  ],
                ),
              ),
              child: Column(children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                  ),
                  child: _DemoProfileAvatar(
                    photoDataUrl: _photoDataUrl,
                    radius: 48,
                  ),
                ),
                const SizedBox(height: 14),
                Text(_name.text,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 23,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 5),
                Text('${_programme.text} | ${_level.text}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, height: 1.4)),
                const SizedBox(height: 14),
                const _InfoChip(
                    icon: Icons.verified_outlined, text: 'GCTU STUDENT'),
              ]),
            ),
            const SizedBox(height: 14),
            Row(children: [
              Expanded(
                  child: _ProfileStat(
                      value: (widget.store?.goingEventCount ?? 4)
                          .toString()
                          .padLeft(2, '0'),
                      label: 'Going')),
              const SizedBox(width: 9),
              Expanded(
                  child: _ProfileStat(
                      value: (widget.store?.joinedClubCount ?? 1)
                          .toString()
                          .padLeft(2, '0'),
                      label: 'Clubs')),
              const SizedBox(width: 9),
              Expanded(
                  child: _ProfileStat(
                      value: (widget.store?.completedTaskCount ?? 3)
                          .toString()
                          .padLeft(2, '0'),
                      label: 'Tasks done')),
            ]),
            const SizedBox(height: 22),
            Text('About me',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                    fontSize: 18)),
            const SizedBox(height: 7),
            Text(_bio.text,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.5)),
            if (_showInterests && _interests.text.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: [
                  for (final interest in _interests.text.split(','))
                    if (interest.trim().isNotEmpty)
                      Chip(
                        visualDensity: VisualDensity.compact,
                        avatar:
                            const Icon(Icons.auto_awesome_rounded, size: 15),
                        label: Text(interest.trim()),
                      ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            _profileSectionHeading(context, 'Privacy & visibility'),
            const SizedBox(height: 8),
            _ProfileSettingsCard(
              children: [
                SwitchListTile.adaptive(
                  value: _discoverable,
                  onChanged: (value) {
                    setState(() => _discoverable = value);
                    widget.store?.updateProfilePrivacy(discoverable: value);
                  },
                  secondary:
                      const _SettingsIcon(icon: Icons.people_alt_outlined),
                  title: const Text('Discoverable to classmates'),
                  subtitle: Text(_discoverable
                      ? 'Classmates can find your demo profile.'
                      : 'Your demo profile is hidden from discovery.'),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14),
                ),
                Divider(
                    height: 1,
                    indent: 68,
                    color: Theme.of(context).colorScheme.outlineVariant),
                SwitchListTile.adaptive(
                  value: _showInterests,
                  onChanged: (value) {
                    setState(() => _showInterests = value);
                    widget.store?.updateProfilePrivacy(interestsVisible: value);
                  },
                  secondary:
                      const _SettingsIcon(icon: Icons.auto_awesome_outlined),
                  title: const Text('Show my interests'),
                  subtitle:
                      const Text('Display your interests on this profile.'),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _profileSectionHeading(context, 'Appearance'),
            const SizedBox(height: 8),
            _AppearanceSettingsCard(),
            const SizedBox(height: 20),
            Text('Student information',
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontWeight: FontWeight.w800,
                    fontSize: 18)),
            const SizedBox(height: 8),
            _ProfileInfo(
                icon: Icons.school_outlined,
                title: 'Programme',
                value: _programme.text),
            _ProfileInfo(
                icon: Icons.layers_outlined,
                title: 'Academic level',
                value: _level.text),
            _ProfileInfo(
                icon: Icons.location_on_outlined,
                title: 'Campus',
                value: _campus.text),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _edit,
              icon: const Icon(Icons.edit_outlined),
              label: const Text('Edit profile details'),
              style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50)),
            ),
            const SizedBox(height: 12),
            Text(
              'Changes are temporary and shown only in this demo.',
              textAlign: TextAlign.center,
              style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11,
                  height: 1.4),
            ),
          ],
        ),
      );
}

Widget _profileSectionHeading(BuildContext context, String title) => Text(
      title,
      style: TextStyle(
        color: Theme.of(context).colorScheme.onSurface,
        fontWeight: FontWeight.w800,
        fontSize: 18,
      ),
    );

class _ProfileSettingsCard extends StatelessWidget {
  const _ProfileSettingsCard({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
          border:
              Border.all(color: Theme.of(context).colorScheme.outlineVariant),
        ),
        child: Column(children: children),
      );
}

class _SettingsIcon extends StatelessWidget {
  const _SettingsIcon({required this.icon});
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(14),
        ),
        child:
            Icon(icon, color: Theme.of(context).colorScheme.primary, size: 21),
      );
}

class _AppearanceSettingsCard extends StatelessWidget {
  const _AppearanceSettingsCard();

  @override
  Widget build(BuildContext context) {
    final prefs = ThemeScope.of(context);
    final mode = prefs.mode;
    final colors = Theme.of(context).colorScheme;
    return _ProfileSettingsCard(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 15, 16, 12),
          child: Row(children: [
            _SettingsIcon(
                icon: switch (mode) {
              ThemeMode.system => Icons.brightness_6_outlined,
              ThemeMode.light => Icons.light_mode_outlined,
              ThemeMode.dark => Icons.dark_mode_outlined,
            }),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('App theme',
                    style: TextStyle(fontWeight: FontWeight.w700)),
                Text(
                    switch (mode) {
                      ThemeMode.system => 'Follow your device setting',
                      ThemeMode.light => 'Light appearance is on',
                      ThemeMode.dark => 'Dark appearance is on',
                    },
                    style: TextStyle(
                        color: colors.onSurfaceVariant, fontSize: 12)),
              ],
            )),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
          child: SegmentedButton<ThemeMode>(
            showSelectedIcon: false,
            segments: const [
              ButtonSegment(value: ThemeMode.system, label: Text('System')),
              ButtonSegment(value: ThemeMode.light, label: Text('Light')),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark')),
            ],
            selected: {mode},
            onSelectionChanged: (selection) => prefs.setMode(selection.first),
          ),
        ),
      ],
    );
  }
}

class _DemoProfileAvatar extends StatelessWidget {
  const _DemoProfileAvatar({
    required this.photoDataUrl,
    required this.radius,
  });

  final String? photoDataUrl;
  final double radius;

  @override
  Widget build(BuildContext context) {
    ImageProvider<Object> image =
        const AssetImage('assets/demo/ama-demo-profile.jpg');
    if (photoDataUrl case final value? when value.startsWith('data:')) {
      final comma = value.indexOf(',');
      if (comma >= 0) {
        try {
          image = MemoryImage(base64Decode(value.substring(comma + 1)));
        } on FormatException {
          // Keep the demo portrait if an invalid image string is encountered.
        }
      }
    }
    return CircleAvatar(
      radius: radius,
      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      backgroundImage: image,
      onBackgroundImageError: (_, __) {},
      child: null,
    );
  }
}

class _EditProfileLabel extends StatelessWidget {
  const _EditProfileLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: TextStyle(
          color: Theme.of(context).colorScheme.primary,
          fontSize: 11,
          fontWeight: FontWeight.w800,
          letterSpacing: 1,
        ),
      );
}

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({required this.value, required this.label});
  final String value, label;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(17),
          border:
              Border.all(color: Theme.of(context).colorScheme.outlineVariant)),
      child: Column(children: [
        Text(value,
            style: TextStyle(
                color: Theme.of(context).colorScheme.primary,
                fontWeight: FontWeight.w800,
                fontSize: 19)),
        const SizedBox(height: 3),
        Text(label,
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 10))
      ]));
}

class _ProfileInfo extends StatelessWidget {
  const _ProfileInfo(
      {required this.icon, required this.title, required this.value});
  final IconData icon;
  final String title, value;
  @override
  Widget build(BuildContext context) => ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title,
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 11)),
      subtitle: Text(value,
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurface,
              fontWeight: FontWeight.w700)));
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 5),
        Text(text,
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurface,
                fontSize: 10,
                fontWeight: FontWeight.w700))
      ]));
}

class _RemoteImageFallback extends StatelessWidget {
  const _RemoteImageFallback({required this.icon});
  final IconData icon;
  @override
  Widget build(BuildContext context) => Container(
      decoration: BoxDecoration(
          gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
            Theme.of(context).colorScheme.primaryContainer,
            Theme.of(context).colorScheme.surfaceContainerHigh,
          ])),
      child: Center(
          child: Icon(icon,
              color: Theme.of(context).colorScheme.primary, size: 54)));
}
