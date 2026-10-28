import 'package:flutter/material.dart';

import 'demo_data.dart';
import 'demo_store.dart';
import 'demo_student_tools.dart';

class DemoAttendanceScreen extends StatefulWidget {
  const DemoAttendanceScreen({super.key, required this.store});
  final DemoStore store;
  @override
  State<DemoAttendanceScreen> createState() => _DemoAttendanceScreenState();
}

class _DemoAttendanceScreenState extends State<DemoAttendanceScreen> {
  bool _checkedIn = false;
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Attendance & check-in')),
        body: ListView(padding: const EdgeInsets.all(18), children: [
          _ExtraHero(
            title: 'Your campus moments, recorded.',
            subtitle: 'Review attendance and check in to eligible activities.',
            image: 'assets/demo/gctu-students-together.jpg',
          ),
          const SizedBox(height: 16),
          Row(children: const [
            Expanded(child: _MetricCard(value: '8', label: 'Sessions')),
            SizedBox(width: 10),
            Expanded(child: _MetricCard(value: '92%', label: 'Attendance')),
          ]),
          const SizedBox(height: 18),
          const _Heading('Upcoming check-in', 'Demo event attendance'),
          Card(
              child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Icon(Icons.event_available_rounded,
                              color: Theme.of(context).colorScheme.primary),
                          SizedBox(width: 10),
                          Expanded(
                              child: Text('Career Compass',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w800,
                                      fontSize: 16)))
                        ]),
                        const Padding(
                            padding: EdgeInsets.only(left: 34, top: 5),
                            child: Text(
                                'Wed, 28 Oct · 10:00 AM · Business School, Block C')),
                        const SizedBox(height: 14),
                        SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                                onPressed: _checkedIn
                                    ? null
                                    : () => setState(() => _checkedIn = true),
                                icon: Icon(_checkedIn
                                    ? Icons.check_circle
                                    : Icons.qr_code_scanner_rounded),
                                label: Text(_checkedIn
                                    ? 'Checked in on this device'
                                    : 'Preview event check-in'))),
                        Text(
                            'A live QR scanner and verified attendance require the campus check-in service.',
                            style: TextStyle(
                                fontSize: 11,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant)),
                      ]))),
          const SizedBox(height: 12),
          const _Heading('Recent activity', 'Your attendance history'),
          for (final row in const [
            (
              'Database Systems tutorial',
              'Present · 14 Oct',
              Icons.check_circle_rounded
            ),
            ('ACS club meeting', 'Present · 10 Oct', Icons.groups_rounded),
            (
              'Research Methods lecture',
              'Present · 8 Oct',
              Icons.menu_book_rounded
            )
          ])
            Card(
                child: ListTile(
                    leading: CircleAvatar(
                        backgroundColor:
                            Theme.of(context).colorScheme.primaryContainer,
                        child: Icon(row.$3,
                            color: Theme.of(context).colorScheme.primary)),
                    title: Text(row.$1),
                    subtitle: Text(row.$2),
                    trailing: const Icon(Icons.chevron_right_rounded))),
          const _DemoFootnote(),
        ]),
      );
}

class DemoStudentDocumentsScreen extends StatelessWidget {
  const DemoStudentDocumentsScreen({super.key, required this.store});
  final DemoStore store;
  static const _docs = [
    (
      'Student ID card',
      'Identity',
      Icons.badge_outlined,
      'A student identity card preview. Official validation is not available in this demo.'
    ),
    (
      'Academic calendar',
      'Academic',
      Icons.calendar_month_rounded,
      'Key teaching weeks, examination periods and semester dates.'
    ),
    (
      'Fee statement',
      'Finance',
      Icons.receipt_long_rounded,
      'A sample fee statement preview. No account balance or payment status is connected.'
    ),
    (
      'Enrollment letter',
      'Academic',
      Icons.school_outlined,
      'A sample enrollment letter preview. Request official documents from the university.'
    ),
    (
      'Timetable',
      'Academic',
      Icons.view_week_rounded,
      'Your editable local timetable.'
    ),
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Student documents')),
        body: ListView(padding: const EdgeInsets.all(18), children: [
          _ExtraHero(
              title: 'Important documents, in one place.',
              subtitle:
                  'Quick access to useful student records and campus references.',
              image: 'assets/demo/study-library-pexels.jpg'),
          const SizedBox(height: 16),
          const _Heading(
              'Your documents', 'Sample previews for this presentation'),
          GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _docs.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: .92),
              itemBuilder: (context, i) {
                final doc = _docs[i];
                return InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () {
                      if (doc.$1 == 'Timetable') {
                        Navigator.of(context).push(MaterialPageRoute<void>(
                            builder: (_) => DemoTimetableScreen(store: store)));
                        return;
                      }
                      showModalBottomSheet<void>(
                          context: context,
                          showDragHandle: true,
                          isScrollControlled: true,
                          builder: (context) => SafeArea(
                              child: Padding(
                                  padding:
                                      const EdgeInsets.fromLTRB(22, 4, 22, 28),
                                  child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Icon(doc.$3,
                                            size: 34,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary),
                                        const SizedBox(height: 12),
                                        Text(doc.$1,
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleLarge),
                                        const SizedBox(height: 8),
                                        Text(doc.$4),
                                        const SizedBox(height: 18),
                                        Text(
                                            'DEMO PREVIEW · NOT AN OFFICIAL UNIVERSITY RECORD',
                                            style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w800,
                                                color: Theme.of(context)
                                                    .colorScheme
                                                    .onSurfaceVariant))
                                      ]))));
                    },
                    child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .surfaceContainerLow,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                                color: Theme.of(context)
                                    .colorScheme
                                    .outlineVariant)),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primaryContainer,
                                      borderRadius: BorderRadius.circular(15)),
                                  child: Icon(doc.$3,
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary)),
                              const Spacer(),
                              Text(doc.$2.toUpperCase(),
                                  style: TextStyle(
                                      fontSize: 10,
                                      letterSpacing: .8,
                                      color:
                                          Theme.of(context).colorScheme.primary,
                                      fontWeight: FontWeight.w800)),
                              const SizedBox(height: 5),
                              Text(doc.$1,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800)),
                              const SizedBox(height: 5),
                              Row(children: [
                                Text('Open preview',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant)),
                                Spacer(),
                                Icon(Icons.arrow_forward_rounded,
                                    size: 16,
                                    color:
                                        Theme.of(context).colorScheme.primary)
                              ])
                            ])));
              }),
          const _DemoFootnote(),
        ]),
      );
}

class DemoSavedEventsScreen extends StatelessWidget {
  const DemoSavedEventsScreen({super.key, required this.store});
  final DemoStore store;
  @override
  Widget build(BuildContext context) => AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final saved =
            demoEvents.where((event) => store.isSaved(event.id)).toList();
        return Scaffold(
            appBar: AppBar(title: const Text('Saved events')),
            body: ListView(padding: const EdgeInsets.all(18), children: [
              _ExtraHero(
                  title: 'Your shortlist for campus life.',
                  subtitle: 'Keep the events you are interested in close.',
                  image: 'assets/demo/gctu-students-2.jpg'),
              const SizedBox(height: 16),
              if (saved.isEmpty)
                Card(
                    child: Padding(
                        padding: EdgeInsets.all(24),
                        child: Column(children: [
                          Icon(Icons.bookmark_border_rounded,
                              size: 42,
                              color: Theme.of(context).colorScheme.primary),
                          SizedBox(height: 10),
                          Text('No saved events yet',
                              style: TextStyle(fontWeight: FontWeight.w800)),
                          Text('Save an event to see it here.',
                              textAlign: TextAlign.center)
                        ]))),
              for (final event in saved)
                Card(
                    clipBehavior: Clip.antiAlias,
                    child: Column(children: [
                      Container(
                          height: 112,
                          width: double.infinity,
                          decoration: BoxDecoration(
                              gradient: LinearGradient(colors: event.colors)),
                          child: Center(
                              child: Icon(event.icon,
                                  color: Colors.white, size: 48))),
                      ListTile(
                          title: Text(event.title,
                              style:
                                  const TextStyle(fontWeight: FontWeight.w800)),
                          subtitle: Text(
                              '${event.date} · ${event.time}\n${event.venue}'),
                          isThreeLine: true,
                          trailing: IconButton(
                              tooltip: 'Remove saved event',
                              onPressed: () => store.toggleSaved(event.id),
                              icon: const Icon(Icons.bookmark_remove_outlined)))
                    ])),
              const _DemoFootnote(),
            ]));
      });
}

class DemoAchievementsScreen extends StatelessWidget {
  const DemoAchievementsScreen({super.key, required this.store});
  final DemoStore store;
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Achievements')),
      body: ListView(padding: const EdgeInsets.all(18), children: [
        _ExtraHero(
            title: 'Every step counts.',
            subtitle:
                'A growing record of your learning and campus involvement.',
            image: 'assets/demo/gctu-students-3.jpg'),
        const SizedBox(height: 16),
        Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(children: [
                  Icon(Icons.stars_rounded,
                      size: 42, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 14),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text('YOUR CAMPUS JOURNEY',
                            style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                fontSize: 10,
                                letterSpacing: .8,
                                fontWeight: FontWeight.w800)),
                        const SizedBox(height: 4),
                        Text(
                            '${store.tasks.where((task) => task.completed).length} tasks completed',
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w800)),
                        const Text('Keep showing up and exploring.')
                      ]))
                ]))),
        const SizedBox(height: 14),
        const _Heading('Milestones', 'Demo badges based on your activity'),
        for (final badge in [
          (
            'First steps',
            'Complete your first task',
            Icons.flag_rounded,
            store
          ),
          (
            'Campus explorer',
            'Save an event to your shortlist',
            Icons.explore_rounded,
            store
          ),
          (
            'Learning streak',
            'Complete a learning task',
            Icons.menu_book_rounded,
            store
          )
        ])
          Card(
              child: ListTile(
                  leading: CircleAvatar(
                      backgroundColor:
                          Theme.of(context).colorScheme.secondaryContainer,
                      child: Icon(
                        badge.$3,
                        color:
                            Theme.of(context).colorScheme.onSecondaryContainer,
                      )),
                  title: Text(badge.$1,
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text(badge.$2),
                  trailing: Icon(
                      (badge.$1 == 'First steps' &&
                                  badge.$4.tasks.any((t) => t.completed)) ||
                              (badge.$1 == 'Campus explorer' &&
                                  demoEvents.any((e) => badge.$4.isSaved(e.id)))
                          ? Icons.verified_rounded
                          : Icons.lock_outline_rounded,
                      color: Theme.of(context).colorScheme.primary))),
        const _DemoFootnote(),
      ]));
}

class _ExtraHero extends StatelessWidget {
  const _ExtraHero(
      {required this.title, required this.subtitle, required this.image});
  final String title, subtitle, image;
  @override
  Widget build(BuildContext context) => ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: Stack(children: [
        AspectRatio(
            aspectRatio: 1.8, child: Image.asset(image, fit: BoxFit.cover)),
        Positioned.fill(
            child: DecoratedBox(
                decoration: BoxDecoration(
                    gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
              Colors.black.withValues(alpha: .05),
              Colors.black.withValues(alpha: .78)
            ])))),
        Positioned(
            left: 18,
            right: 18,
            bottom: 18,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(subtitle,
                  style: const TextStyle(color: Colors.white, height: 1.3))
            ]))
      ]));
}

class _Heading extends StatelessWidget {
  const _Heading(this.title, this.subtitle);
  final String title, subtitle;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title,
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Theme.of(context).colorScheme.onSurface)),
        Text(subtitle,
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 12))
      ]));
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.value, required this.label});
  final String value, label;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(18),
          border:
              Border.all(color: Theme.of(context).colorScheme.outlineVariant)),
      child: Column(children: [
        Text(value,
            style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Theme.of(context).colorScheme.primary)),
        Text(label,
            style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
                fontSize: 12))
      ]));
}

class _DemoFootnote extends StatelessWidget {
  const _DemoFootnote();
  @override
  Widget build(BuildContext context) => Padding(
      padding: EdgeInsets.symmetric(vertical: 18),
      child: Text(
          'DEMO DATA · Preview activity is stored only on this device session. Official records require connected university services.',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 10,
              height: 1.4)));
}
