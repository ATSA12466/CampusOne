import 'dart:convert';

import 'package:flutter/material.dart';

import '../core/photos/app_photos.dart';
import '../core/theme/app_theme.dart';

import 'demo_market_profile.dart';
import 'demo_community.dart';

const _photos = <String>[
  'assets/demo/gctu-students-1.jpg',
  'assets/demo/gctu-students-2.jpg',
  'assets/demo/gctu-students-3.jpg',
  'assets/demo/gctu-students-together.jpg',
];

const _hostelListings = <DemoHostelListing>[
  DemoHostelListing(
      title: 'North Ridge Student Lodge',
      area: 'Tesano, Accra',
      price: 'GHS 1,800 / semester',
      rooms: 'Shared and single rooms',
      imageUrl:
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&auto=format&fit=crop&q=85',
      description:
          'A sample student accommodation listing with study space, shared kitchen access and campus transport information for demonstration.'),
  DemoHostelListing(
      title: 'Achimota Campus Residence',
      area: 'Achimota, Accra',
      price: 'GHS 2,200 / semester',
      rooms: 'Single rooms',
      imageUrl:
          'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=1200&auto=format&fit=crop&q=85',
      description:
          'A sample residence listing with furnished rooms and shared common areas. Listing details are fictional and should be verified in a real service.'),
  DemoHostelListing(
      title: 'Tesano Study House',
      area: 'Tesano, Accra',
      price: 'GHS 1,500 / semester',
      rooms: 'Shared rooms',
      imageUrl:
          'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=85',
      description:
          'A sample budget accommodation listing for students looking for a quiet study environment near campus.'),
];

class DemoHostelListing {
  const DemoHostelListing(
      {required this.title,
      required this.area,
      required this.price,
      required this.rooms,
      required this.imageUrl,
      required this.description});
  final String title, area, price, rooms, imageUrl, description;
}

class DemoHostelDetailScreen extends StatelessWidget {
  const DemoHostelDetailScreen({super.key, required this.listing});
  final DemoHostelListing listing;
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Hostel details')),
      body: ListView(padding: const EdgeInsets.only(bottom: 24), children: [
        SizedBox(
            height: 280,
            child: Image.network(listing.imageUrl,
                fit: BoxFit.cover,
                alignment: Alignment.center,
                errorBuilder: (_, __, ___) => const _HostelImageFallback())),
        Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
            child: Text(listing.title,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurface,
                    fontSize: 23,
                    fontWeight: FontWeight.w800))),
        Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Text(listing.price,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontSize: 20,
                    fontWeight: FontWeight.w800))),
        Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
            child: Wrap(spacing: 8, runSpacing: 8, children: [
              _HostelTag(icon: Icons.location_on_outlined, label: listing.area),
              _HostelTag(icon: Icons.bed_outlined, label: listing.rooms),
              const _HostelTag(
                  icon: Icons.info_outline, label: 'Sample listing')
            ])),
        const Divider(height: 1),
        Padding(
            padding: const EdgeInsets.all(20),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('About this place',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontSize: 16,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              Text(listing.description,
                  style:
                      TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, height: 1.5)),
              const SizedBox(height: 18),
              Text('What to check',
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontSize: 16,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              const _HostelAmenity(label: 'Room and bathroom condition'),
              const _HostelAmenity(label: 'Distance and transport options'),
              const _HostelAmenity(label: 'Fees, utilities and house rules'),
              const _HostelAmenity(
                  label: 'Confirm availability with the provider')
            ])),
        Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: FilledButton.icon(
                onPressed: () => showDialog<void>(
                    context: context,
                    builder: (context) => AlertDialog(
                            title: const Text('Contact provider'),
                            content: const Text(
                                'Provider contact is not connected in this demo. This sample listing is for presentation only.'),
                            actions: [
                              TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Close'))
                            ])),
                icon: const Icon(Icons.call_outlined),
                label: const Text('Contact provider'))),
        Padding(
            padding: EdgeInsets.all(18),
            child: Text(
                'DEMO LISTING  |  Prices, rooms and provider details are fictional.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 10,
                    fontWeight: FontWeight.w700))),
      ]));
}

class _HostelImageFallback extends StatelessWidget {
  const _HostelImageFallback();
  @override
  Widget build(BuildContext context) => Container(
      color: const Color(0xFFEAF0FF),
      child: Center(
          child: Icon(Icons.home_work_rounded,
              color: Theme.of(context).colorScheme.primary, size: 56)));
}

class _HostelTag extends StatelessWidget {
  const _HostelTag({required this.icon, required this.label});
  final IconData icon;
  final String label;
  @override
  Widget build(BuildContext context) => Chip(
      avatar: Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
      label: Text(label),
      visualDensity: VisualDensity.compact);
}

class _HostelAmenity extends StatelessWidget {
  const _HostelAmenity({required this.label});
  final String label;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Icon(Icons.check_circle_outline_rounded,
            color: Theme.of(context).colorScheme.primary, size: 18),
        const SizedBox(width: 8),
        Expanded(
            child: Text(label,
                style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 13)))
      ]));
}

class DemoHostelsScreen extends StatefulWidget {
  const DemoHostelsScreen({super.key});
  @override
  State<DemoHostelsScreen> createState() => _DemoHostelsScreenState();
}

class _DemoHostelsScreenState extends State<DemoHostelsScreen> {
  final Set<int> _saved = {};
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Hostel discovery')),
        body: ListView(padding: const EdgeInsets.all(18), children: [
          _ServiceHero(
              title: 'Find a place to settle in.',
              subtitle: 'Explore sample accommodation cards near campus.',
              image: _photos[1]),
          const SizedBox(height: 16),
          const _DemoNote(),
          LayoutBuilder(builder: (context, constraints) {
            final columns = constraints.maxWidth >= 620 ? 3 : 2;
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _hostelListings.length,
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columns,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: columns == 2 ? .68 : .78,
              ),
              itemBuilder: (context, index) {
                final listing = _hostelListings[index];
                final saved = _saved.contains(index);
                return _HostelGridCard(
                  listing: listing,
                  saved: saved,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => DemoHostelDetailScreen(listing: listing),
                    ),
                  ),
                  onSave: () => setState(
                    () => saved ? _saved.remove(index) : _saved.add(index),
                  ),
                );
              },
            );
          }),
        ]),
      );
}

class _HostelGridCard extends StatelessWidget {
  const _HostelGridCard(
      {required this.listing,
      required this.saved,
      required this.onTap,
      required this.onSave});
  final DemoHostelListing listing;
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
            Expanded(
              flex: 4,
              child: Stack(fit: StackFit.expand, children: [
                Image.network(listing.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _HostelImageFallback()),
                Positioned(
                    top: 5,
                    right: 5,
                    child: IconButton.filledTonal(
                      onPressed: onSave,
                      tooltip: saved ? 'Remove saved hostel' : 'Save hostel',
                      icon: Icon(saved
                          ? Icons.bookmark_rounded
                          : Icons.bookmark_border_rounded),
                    )),
                Positioned(
                  left: 9,
                  top: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                    decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .94),
                        borderRadius: BorderRadius.circular(14)),
                    child: Text('DEMO',
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontSize: 9,
                            fontWeight: FontWeight.w800)),
                  ),
                ),
              ]),
            ),
            Expanded(
              flex: 6,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(11, 10, 11, 10),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(listing.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              height: 1.15)),
                      const SizedBox(height: 5),
                      Row(children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Expanded(
                            child: Text(listing.area,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: Theme.of(context).colorScheme.onSurfaceVariant, fontSize: 11)))
                      ]),
                      const Spacer(),
                      Text(listing.price,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 12)),
                    ]),
              ),
            ),
          ]),
        ),
      );
}

class DemoLostFoundScreen extends StatefulWidget {
  const DemoLostFoundScreen({super.key});
  @override
  State<DemoLostFoundScreen> createState() => _DemoLostFoundScreenState();
}

class _DemoLostFoundScreenState extends State<DemoLostFoundScreen> {
  String _filter = 'All';
  String _query = '';
  final List<_LostFoundItem> _items = [
    _LostFoundItem(
        'Student ID card', 'Found near the library', 'Found', _photos[0]),
    _LostFoundItem(
        'Black laptop sleeve', 'Lost around Block C', 'Lost', _photos[2]),
    _LostFoundItem(
        'Water bottle', 'Found at the cafeteria', 'Found', _photos[3]),
  ];

  Future<void> _report() async {
    final title = TextEditingController();
    final place = TextEditingController();
    var status = 'Lost';
    String? photo;
    final result = await showDialog<_LostFoundItem>(
        context: context,
        builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
                  title: const Text('Report an item'),
                  content: SingleChildScrollView(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                    SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(
                              value: 'Lost',
                              label: Text('I lost it'),
                              icon: Icon(Icons.search_rounded)),
                          ButtonSegment(
                              value: 'Found',
                              label: Text('I found it'),
                              icon: Icon(Icons.check_circle_outline_rounded))
                        ],
                        selected: {
                          status
                        },
                        onSelectionChanged: (value) =>
                            setDialogState(() => status = value.first)),
                    const SizedBox(height: 12),
                    InkWell(
                        onTap: () async {
                          try {
                            final picked =
                                await AppPhotos.chooseDataUrl(context);
                            if (picked != null) {
                              setDialogState(() => photo = picked);
                            }
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          'Could not load that photo. Try a smaller image.')));
                            }
                          }
                        },
                        child: Container(
                            height: 110,
                            width: double.infinity,
                            decoration: BoxDecoration(
                                color: const Color(0xFFEAF0FF),
                                borderRadius: BorderRadius.circular(16)),
                            child: photo == null
                                ? Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                        Icon(Icons.add_a_photo_outlined,
                                            color: Theme.of(context).colorScheme.primary),
                                        SizedBox(height: 6),
                                        Text('Add a clear item photo')
                                      ])
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.memory(
                                        base64Decode(photo!.split(',').last),
                                        fit: BoxFit.cover)))),
                    const SizedBox(height: 12),
                    TextField(
                        controller: title,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: const InputDecoration(
                            labelText: 'What is the item?',
                            hintText: 'e.g. Black laptop sleeve')),
                    TextField(
                        controller: place,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: const InputDecoration(
                            labelText: 'Where was it last seen?',
                            hintText: 'Building, room or nearby landmark')),
                    const SizedBox(height: 10),
                    const Text(
                        'For everyone’s safety, arrange handover through campus staff. This report stays on this device.',
                        style: TextStyle(fontSize: 12)),
                  ])),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Cancel')),
                    FilledButton(
                        onPressed: () => Navigator.pop(
                            context,
                            _LostFoundItem(title.text.trim(), place.text.trim(),
                                status, photo ?? _photos[1])),
                        child: const Text('Add report')),
                  ],
                )));
    title.dispose();
    place.dispose();
    if (result != null && result.title.isNotEmpty && mounted) {
      setState(() => _items.insert(0, result));
    }
  }

  @override
  Widget build(BuildContext context) {
    final shown = _items
        .where((item) =>
            (_filter == 'All' || item.status == _filter) &&
            ('${item.title} ${item.place}'
                .toLowerCase()
                .contains(_query.toLowerCase())))
        .toList();
    return Scaffold(
      appBar: AppBar(title: const Text('Lost & found'), actions: [
        IconButton(
            onPressed: _report,
            tooltip: 'Report an item',
            icon: const Icon(Icons.add_circle_outline_rounded))
      ]),
      body: ListView(
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 100),
          children: [
            _ServiceHero(
                title: 'Help good things find their way.',
                subtitle:
                    'Browse or report a campus item in this local preview.',
                image: _photos[0]),
            const SizedBox(height: 14),
            TextField(
                onChanged: (value) => setState(() => _query = value.trim()),
                decoration: InputDecoration(
                    hintText: 'Search items or campus locations',
                    prefixIcon: const Icon(Icons.search_rounded),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: BorderSide.none))),
            const SizedBox(height: 12),
            Wrap(spacing: 8, children: [
              for (final f in ['All', 'Lost', 'Found'])
                ChoiceChip(
                    label: Text(f),
                    selected: _filter == f,
                    onSelected: (_) => setState(() => _filter = f))
            ]),
            const SizedBox(height: 12),
            const _DemoNote(),
            if (shown.isNotEmpty)
              GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: shown.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 10,
                      mainAxisSpacing: 10,
                      childAspectRatio: .78),
                  itemBuilder: (context, index) {
                    final item = shown[index];
                    final image = item.image.startsWith('data:image')
                        ? Image.memory(base64Decode(item.image.split(',').last),
                            fit: BoxFit.cover)
                        : Image.asset(item.image, fit: BoxFit.cover);
                    return InkWell(
                        borderRadius: BorderRadius.circular(20),
                        onTap: () => showModalBottomSheet<void>(
                            context: context,
                            showDragHandle: true,
                            builder: (context) => SafeArea(
                                child: Padding(
                                    padding: const EdgeInsets.fromLTRB(
                                        20, 0, 20, 24),
                                    child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(item.title,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .titleLarge),
                                          const SizedBox(height: 8),
                                          Text(
                                              '${item.status} item · ${item.place}'),
                                          const SizedBox(height: 12),
                                          const Text(
                                              'If this is yours, contact campus security or the student services desk to arrange a safe handover.'),
                                          const SizedBox(height: 10),
                                          Text(
                                              'Local demo listing · contact details are not connected.',
                                              style: TextStyle(
                                                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                                                  fontSize: 11))
                                        ])))),
                        child: Card(
                            clipBehavior: Clip.antiAlias,
                            margin: EdgeInsets.zero,
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                      child: Stack(
                                          fit: StackFit.expand,
                                          children: [
                                        image,
                                        Positioned(
                                            left: 8,
                                            top: 8,
                                            child: Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 9,
                                                        vertical: 5),
                                                decoration: BoxDecoration(
                                                    color: item.status ==
                                                            'Found'
                                                        ? const Color(
                                                            0xFFE3F7EF)
                                                        : const Color(
                                                            0xFFFFF0CB),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            20)),
                                                child: Text(
                                                    item.status.toUpperCase(),
                                                    style: const TextStyle(
                                                        fontSize: 9,
                                                        fontWeight:
                                                            FontWeight.w800))))
                                      ])),
                                  Padding(
                                      padding: const EdgeInsets.all(11),
                                      child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(item.title,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                    fontWeight:
                                                        FontWeight.w800)),
                                            const SizedBox(height: 4),
                                            Row(children: [
                                              Icon(Icons.place_outlined,
                                                  size: 14,
                                                  color: Theme.of(context).colorScheme.onSurfaceVariant),
                                              const SizedBox(width: 3),
                                              Expanded(
                                                  child: Text(item.place,
                                                      maxLines: 1,
                                                      overflow:
                                                          TextOverflow.ellipsis,
                                                      style: const TextStyle(
                                                          fontSize: 11,
                                                          color: Color(
                                                              0xFF78849A))))
                                            ])
                                          ]))
                                ])));
                  }),
            if (shown.isEmpty)
              const Center(
                  child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text('No items in this filter yet.'))),
          ]),
      floatingActionButton: FloatingActionButton.extended(
          onPressed: _report,
          icon: const Icon(Icons.add_rounded),
          label: const Text('Report item')),
    );
  }
}

class _LostFoundItem {
  const _LostFoundItem(this.title, this.place, this.status, this.image);
  final String title, place, status, image;
}

class DemoFreshersScreen extends StatefulWidget {
  const DemoFreshersScreen({super.key});
  @override
  State<DemoFreshersScreen> createState() => _DemoFreshersScreenState();
}

class _DemoFreshersScreenState extends State<DemoFreshersScreen> {
  final Set<int> _done = {};
  static const _steps = [
    'Find your lecture blocks',
    'Save your timetable',
    'Meet your SRC and class reps',
    'Explore clubs and student groups',
    'Locate library and student services'
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Freshers Hub')),
        body: ListView(padding: const EdgeInsets.all(18), children: [
          _ServiceHero(
              title: 'Welcome to GCTU.',
              subtitle:
                  'Your first steps around campus, gathered in one place.',
              image: 'assets/demo/gctu-student-matriculation.jpg'),
          const SizedBox(height: 18),
          Text('Your campus starter checklist',
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 8),
          for (var i = 0; i < _steps.length; i++)
            Card(
                child: CheckboxListTile(
                    value: _done.contains(i),
                    onChanged: (value) => setState(
                        () => value == true ? _done.add(i) : _done.remove(i)),
                    controlAffinity: ListTileControlAffinity.leading,
                    title: Text(_steps[i]),
                    activeColor: Theme.of(context).colorScheme.primary)),
          const SizedBox(height: 16),
          Text('Useful places to start',
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: Theme.of(context).colorScheme.onSurface)),
          const SizedBox(height: 8),
          Wrap(spacing: 9, runSpacing: 9, children: [
            _FreshersShortcut(
                icon: Icons.home_work_rounded,
                label: 'Hostels',
                onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                    builder: (_) => const DemoHostelsScreen()))),
            _FreshersShortcut(
                icon: Icons.storefront_rounded,
                label: 'Marketplace',
                onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                    builder: (_) => const DemoMarketScreen()))),
            _FreshersShortcut(
                icon: Icons.find_in_page_rounded,
                label: 'Lost & found',
                onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                    builder: (_) => const DemoLostFoundScreen()))),
            _FreshersShortcut(
                icon: Icons.forum_rounded,
                label: 'Community',
                onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
                    builder: (_) => const DemoCommunityScreen()))),
          ]),
          const SizedBox(height: 14),
          _PhotoServiceCard(
              image: _photos[3],
              title: 'Get to know your campus',
              subtitle: 'Student life, communities and events',
              badge: 'CAMPUS GUIDE',
              actionLabel: 'Explore',
              onTap: () => showDialog<void>(
                  context: context,
                  builder: (context) => AlertDialog(
                          title: const Text('Campus guide'),
                          content: const Text(
                              'Explore the Home and Explore tabs for sample events, clubs, announcements and student services.'),
                          actions: [
                            TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Got it'))
                          ]))),
          const _DemoNote(),
        ]),
      );
}

class _FreshersShortcut extends StatelessWidget {
  const _FreshersShortcut(
      {required this.icon, required this.label, required this.onTap});
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ActionChip(
      avatar: Icon(icon, color: Theme.of(context).colorScheme.primary, size: 18),
      label: Text(label),
      onPressed: onTap,
      backgroundColor: Theme.of(context).colorScheme.surfaceContainerHigh,
      side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant));
}

class _ServiceHero extends StatelessWidget {
  const _ServiceHero(
      {required this.title, required this.subtitle, required this.image});
  final String title, subtitle, image;
  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: SizedBox(
            height: 210,
            child: Stack(fit: StackFit.expand, children: [
              Image.asset(image,
                  fit: BoxFit.cover, alignment: Alignment.center),
              const DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Color(0x11000000), Color(0xDD06172F)]))),
              Positioned(
                  left: 18,
                  right: 18,
                  bottom: 18,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('CAMPUSONE  |  DEMO',
                            style: TextStyle(
                                color: CampusColors.accent,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1)),
                        const SizedBox(height: 6),
                        Text(title,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 22,
                                height: 1.1)),
                        const SizedBox(height: 5),
                        Text(subtitle,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12)),
                      ])),
            ])),
      );
}

class _PhotoServiceCard extends StatelessWidget {
  const _PhotoServiceCard(
      {required this.image,
      required this.title,
      required this.subtitle,
      required this.badge,
      required this.actionLabel,
      required this.onTap});
  final String image, title, subtitle, badge, actionLabel;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        margin: const EdgeInsets.only(bottom: 13),
        child: InkWell(
            onTap: onTap,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(
                  height: 165,
                  width: double.infinity,
                  child: Stack(fit: StackFit.expand, children: [
                    Image.asset(image,
                        fit: BoxFit.cover, alignment: Alignment.center),
                    const DecoratedBox(
                        decoration: BoxDecoration(
                            gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                          Color(0x16000000),
                          Colors.transparent,
                          Color(0x55000000)
                        ]))),
                    Positioned(
                        left: 12,
                        top: 12,
                        child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: .92),
                                borderRadius: BorderRadius.circular(18)),
                            child: Text(badge,
                                style: TextStyle(
                                    color:
                                        Theme.of(context).colorScheme.onSurface,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: .5)))),
                  ])),
              Padding(
                  padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
                  child: Row(children: [
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Text(title,
                              style: TextStyle(
                                  color:
                                      Theme.of(context).colorScheme.onSurface,
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800)),
                          const SizedBox(height: 4),
                          Text(subtitle,
                              style: const TextStyle(
                                  color: Color(0xFF738096), fontSize: 11))
                        ])),
                    const SizedBox(width: 8),
                    TextButton(onPressed: onTap, child: Text(actionLabel))
                  ])),
            ])),
      );
}

class _DemoNote extends StatelessWidget {
  const _DemoNote();
  @override
  Widget build(BuildContext context) => Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Text(
          'DEMO CONTENT  |  Sample listings do not contact a real office or provider. Hostel images are illustrative stock photos loaded online.',
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 10,
              fontWeight: FontWeight.w600)));
}
