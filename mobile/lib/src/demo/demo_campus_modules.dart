import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../core/theme/app_theme.dart';
import 'demo_campus_services.dart';
import 'demo_community.dart';
import 'demo_data.dart';
import 'demo_store.dart';
import 'demo_student_tools.dart';

const _clubPhotos = <String, String>{
  'acs': 'assets/demo/gctu-students-1.jpg',
  'robotics': 'assets/demo/gctu-students-2.jpg',
  'film-society': 'assets/demo/gctu-students-3.jpg',
  'entrepreneurs': 'assets/demo/gctu-students-together.jpg',
};

class DemoClubsScreen extends StatefulWidget {
  const DemoClubsScreen({super.key, required this.store});
  final DemoStore store;

  @override
  State<DemoClubsScreen> createState() => _DemoClubsScreenState();
}

class _DemoClubsScreenState extends State<DemoClubsScreen> {
  final _search = TextEditingController();
  String _category = 'All';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) {
          final categories = [
            'All',
            ...demoClubs.map((club) => club.category).toSet()
          ];
          final query = _search.text.trim().toLowerCase();
          final clubs = demoClubs.where((club) {
            final matchesQuery =
                '${club.name} ${club.category} ${club.description}'
                    .toLowerCase()
                    .contains(query);
            return matchesQuery &&
                (_category == 'All' || club.category == _category);
          }).toList();
          return Scaffold(
            appBar: AppBar(title: const Text('Clubs & communities')),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                _ModuleHero(
                  image: 'assets/demo/gctu-students-together.jpg',
                  eyebrow: 'CAMPUS COMMUNITIES',
                  title: 'Find your people.',
                  detail:
                      'Discover groups, join activities and build your campus story.',
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search clubs or interests',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor:
                        Theme.of(context).colorScheme.surfaceContainerLow,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(children: [
                    for (final category in categories)
                      Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(category),
                          selected: category == _category,
                          onSelected: (_) =>
                              setState(() => _category = category),
                        ),
                      ),
                  ]),
                ),
                const SizedBox(height: 14),
                _ModuleHeading(
                  title: 'Your clubs',
                  subtitle:
                      '${demoClubs.where((c) => widget.store.isJoined(c.id)).length} joined',
                ),
                if (clubs.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(children: [
                        Icon(Icons.search_off_rounded,
                            size: 34,
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant),
                        const SizedBox(height: 8),
                        Text('No clubs found',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Try another search or choose a different category.',
                          textAlign: TextAlign.center,
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                  ),
                        ),
                        TextButton.icon(
                          onPressed: () => setState(() {
                            _search.clear();
                            _category = 'All';
                          }),
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Clear filters'),
                        ),
                      ]),
                    ),
                  )
                else
                  LayoutBuilder(builder: (context, constraints) {
                    final columns = constraints.maxWidth >= 620 ? 3 : 2;
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: clubs.length,
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: columns,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: columns == 2 ? .82 : .9,
                      ),
                      itemBuilder: (context, index) => _ClubPhotoCard(
                        club: clubs[index],
                        store: widget.store,
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => DemoClubProfileScreen(
                              club: clubs[index],
                              store: widget.store,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: 14),
                _ModuleHeading(
                  title: 'Your club passport',
                  subtitle: 'Attendance builds toward badges and certificates',
                ),
                for (final club in demoClubs
                    .where((club) => widget.store.isJoined(club.id)))
                  _ClubPassportCard(store: widget.store, club: club),
                if (demoClubs.every((club) => !widget.store.isJoined(club.id)))
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.card_membership_outlined),
                      title: const Text('Your club progress will show here'),
                      subtitle: const Text(
                          'Join a club and check in to its activities to earn recognition.'),
                    ),
                  ),
                const SizedBox(height: 14),
                _ModuleHeading(
                  title: 'Campus-wide recognition',
                  subtitle:
                      'Sample milestones count attendance across clubs; certificates are club-specific.',
                ),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _RecognitionChip(
                        label: widget.store.clubAttendanceCount() > 0
                            ? 'Meeting regular'
                            : 'Meeting regular · locked',
                        icon: Icons.groups_2_outlined),
                    _RecognitionChip(
                        label: widget.store.clubAttendanceCount() >= 2
                            ? 'Committed member'
                            : 'Committed member · ${widget.store.clubAttendanceCount()}/2',
                        icon: Icons.volunteer_activism_outlined),
                    _RecognitionChip(
                        label: widget.store.clubAttendanceCount() >= 3
                            ? 'Club certificate earned'
                            : 'Club certificate · ${widget.store.clubAttendanceCount()}/3',
                        icon: Icons.workspace_premium_outlined),
                  ],
                ),
                const SizedBox(height: 14),
                const _DemoDisclaimer(),
              ],
            ),
          );
        },
      );
}

class DemoClubProfileScreen extends StatelessWidget {
  const DemoClubProfileScreen(
      {super.key, required this.club, required this.store});
  final DemoClub club;
  final DemoStore store;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          final status = store.clubMembership(club.id);
          final member = status == 'member';
          final pending = status == 'pending';
          final approval = club.id == 'robotics' || club.id == 'entrepreneurs';
          return Scaffold(
            appBar: AppBar(title: const Text('Club profile')),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(22),
                  child: SizedBox(
                    height: 210,
                    child: Stack(fit: StackFit.expand, children: [
                      Image.asset(_clubPhotos[club.id]!, fit: BoxFit.cover),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              const Color(0xE60B2545)
                            ],
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
                              Text(club.category.toUpperCase(),
                                  style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 11,
                                      letterSpacing: 1)),
                              const SizedBox(height: 5),
                              Text(club.name,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 21,
                                      fontWeight: FontWeight.w800)),
                            ]),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 14),
                Wrap(spacing: 8, runSpacing: 4, children: [
                  _InfoPill(
                      icon: Icons.people_outline,
                      label: '${club.members} members'),
                  _InfoPill(
                      icon: Icons.verified_outlined, label: 'Sample club'),
                ]),
                const SizedBox(height: 12),
                Text(club.description, style: const TextStyle(height: 1.5)),
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: () {
                    if (pending) {
                      store.leaveClub(club.id);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                            content: Text('Membership request cancelled.')),
                      );
                    } else if (member) {
                      store.leaveClub(club.id);
                    } else {
                      store.requestClubMembership(club.id,
                          approvalRequired: approval);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text(approval
                                ? 'Membership request sent for review.'
                                : 'You joined ${club.name}.')),
                      );
                    }
                  },
                  icon: Icon(member
                      ? Icons.check_circle_outline
                      : pending
                          ? Icons.close_rounded
                          : Icons.group_add_outlined),
                  label: Text(member
                      ? 'Leave club'
                      : pending
                          ? 'Cancel request'
                          : approval
                              ? 'Request to join'
                              : 'Join club'),
                ),
                const SizedBox(height: 18),
                _ModuleHeading(
                    title: 'Activities',
                    subtitle: 'Register or cancel your place'),
                if (member)
                  Card(
                    child: ListTile(
                      leading: Icon(Icons.qr_code_scanner_rounded,
                          color: Theme.of(context).colorScheme.primary),
                      title: const Text('Meeting check-in'),
                      subtitle: const Text(
                          'Scan the QR code shown by a club executive.'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => DemoClubCheckInScreen(
                            club: club,
                            activity: _clubActivities(club.id).first,
                            store: store,
                          ),
                        ),
                      ),
                    ),
                  ),
                if (!member)
                  Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: Text(
                        'Join this club to register for activities and record meeting attendance.',
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 13)),
                  ),
                for (final activity in _clubActivities(club.id))
                  _ActivityCard(
                    activity: activity,
                    club: club,
                    store: store,
                    member: member,
                  ),
                const SizedBox(height: 18),
                const _ModuleHeading(
                    title: 'Club leads', subtitle: 'Sample executive profiles'),
                for (final leader in _clubLeaders(club.id))
                  Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundImage: AssetImage(leader.$3),
                        backgroundColor: const Color(0xFFEAF0FF),
                      ),
                      title: Text(leader.$1),
                      subtitle: Text(leader.$2),
                    ),
                  ),
                const SizedBox(height: 12),
                const _DemoDisclaimer(),
              ],
            ),
          );
        },
      );
}

List<DemoEvent> _clubActivities(String clubId) => switch (clubId) {
      'acs' => [demoEvents[0], demoEvents[2]],
      'robotics' => [demoEvents[0], demoEvents[1]],
      'film-society' => [demoEvents[3]],
      _ => [demoEvents[2], demoEvents[1]],
    };

List<(String, String, String)> _clubLeaders(String clubId) => switch (clubId) {
      'acs' => [
          ('Nana Boateng', 'President', 'assets/demo/gctu-students-1.jpg'),
          ('Abena Owusu', 'Events lead', 'assets/demo/gctu-students-2.jpg')
        ],
      'robotics' => [
          ('Kojo Mensah', 'Project lead', 'assets/demo/gctu-students-2.jpg'),
          ('Esi Arthur', 'Secretary', 'assets/demo/gctu-students-3.jpg')
        ],
      'film-society' => [
          ('Akua Mensima', 'President', 'assets/demo/gctu-students-3.jpg'),
          ('Yaw Kusi', 'Media lead', 'assets/demo/gctu-students-together.jpg')
        ],
      _ => [
          (
            'Kofi Asare',
            'Coordinator',
            'assets/demo/gctu-students-together.jpg'
          ),
          ('Ama Serwaa', 'Community lead', 'assets/demo/gctu-students-1.jpg')
        ],
    };

class _ActivityCard extends StatelessWidget {
  const _ActivityCard(
      {required this.activity,
      required this.club,
      required this.store,
      required this.member});
  final DemoEvent activity;
  final DemoClub club;
  final DemoStore store;
  final bool member;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          final registered =
              store.isRegisteredForActivity(activity.id, clubId: club.id);
          final attended = store.hasClubAttendance(club.id, activity.id);
          return Card(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor:
                            activity.colors.first.withValues(alpha: .12),
                        child:
                            Icon(activity.icon, color: activity.colors.first),
                      ),
                      title: Text(activity.title),
                      subtitle: Text(
                          '${activity.date} · ${activity.time}\n${activity.venue}'),
                      isThreeLine: true,
                    ),
                    Wrap(spacing: 8, runSpacing: 6, children: [
                      OutlinedButton.icon(
                        onPressed: member && !attended
                            ? () => store.toggleClubActivity(activity.id,
                                clubId: club.id)
                            : null,
                        icon: Icon(registered
                            ? Icons.event_available_rounded
                            : Icons.add_rounded),
                        label: Text(attended
                            ? 'Attended'
                            : registered
                                ? 'Registered'
                                : member
                                    ? 'Register'
                                    : 'Join to register'),
                      ),
                      if (member)
                        TextButton.icon(
                          onPressed: attended
                              ? null
                              : () => Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                      builder: (_) => DemoClubCheckInScreen(
                                          club: club,
                                          activity: activity,
                                          store: store))),
                          icon: Icon(attended
                              ? Icons.verified_rounded
                              : Icons.qr_code_scanner_rounded),
                          label: Text(attended ? 'Checked in' : 'Scan QR'),
                        ),
                    ]),
                  ]),
            ),
          );
        },
      );
}

class DemoClubCheckInScreen extends StatefulWidget {
  const DemoClubCheckInScreen(
      {super.key,
      required this.club,
      required this.activity,
      required this.store});
  final DemoClub club;
  final DemoEvent activity;
  final DemoStore store;

  @override
  State<DemoClubCheckInScreen> createState() => _DemoClubCheckInScreenState();
}

class _DemoClubCheckInScreenState extends State<DemoClubCheckInScreen> {
  final _scanner = MobileScannerController();
  bool _checkedIn = false;
  String? _message;
  String? _lastScannedCode;

  String get _expectedCode =>
      'CAMPUSONE|CLUB|${widget.club.id}|ACTIVITY|${widget.activity.id}';

  @override
  void dispose() {
    _scanner.dispose();
    super.dispose();
  }

  Future<void> _acceptCode(String value) async {
    if (_checkedIn) return;
    if (value.trim() != _expectedCode) {
      if (_message != 'That code does not match this club activity.') {
        setState(
            () => _message = 'That code does not match this club activity.');
      }
      return;
    }
    widget.store.recordClubAttendance(widget.club.id, widget.activity.id);
    if (mounted) {
      setState(() {
        _checkedIn = true;
        _message = 'Your attendance is recorded for this demo.';
      });
    }
    await _scanner.stop();
  }

  Future<void> _enterCode() async {
    final controller = TextEditingController();
    final code = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter meeting code'),
        content: TextField(
          controller: controller,
          textCapitalization: TextCapitalization.characters,
          decoration:
              const InputDecoration(hintText: 'Code from your club executive'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: const Text('Check in')),
        ],
      ),
    );
    controller.dispose();
    if (code != null && mounted) await _acceptCode(code);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Club meeting check-in')),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(18),
            children: [
              Text(widget.club.name,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: FontWeight.w800,
                      fontSize: 20)),
              const SizedBox(height: 5),
              Text(widget.activity.title,
                  style: TextStyle(
                      color: Theme.of(context).colorScheme.onSurfaceVariant)),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: Stack(fit: StackFit.expand, children: [
                    if (!_checkedIn)
                      MobileScanner(
                        controller: _scanner,
                        onDetect: (capture) {
                          for (final barcode in capture.barcodes) {
                            final value = barcode.rawValue;
                            if (value != null && value != _lastScannedCode) {
                              _lastScannedCode = value;
                              _acceptCode(value);
                            }
                          }
                        },
                      )
                    else
                      Container(
                          color: const Color(0xFFEAF7F0),
                          child: const Icon(Icons.verified_rounded,
                              color: Color(0xFF17834A), size: 86)),
                    if (!_checkedIn)
                      IgnorePointer(
                        child: Center(
                          child: Container(
                            width: 220,
                            height: 220,
                            decoration: BoxDecoration(
                                border:
                                    Border.all(color: Colors.white, width: 4),
                                borderRadius: BorderRadius.circular(26)),
                          ),
                        ),
                      ),
                  ]),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                  _message ??
                      'Point your camera at the meeting QR code supplied by a club executive.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: _message?.startsWith('That code') == true
                          ? Colors.red.shade700
                          : const Color(0xFF61708A),
                      height: 1.4)),
              const SizedBox(height: 12),
              if (!_checkedIn)
                OutlinedButton.icon(
                    onPressed: _enterCode,
                    icon: const Icon(Icons.keyboard_alt_outlined),
                    label: const Text('Enter meeting code instead')),
              if (!_checkedIn)
                TextButton.icon(
                    onPressed: () => _acceptCode(_expectedCode),
                    icon: const Icon(Icons.qr_code_2_rounded),
                    label: const Text('Try a sample check-in')),
              if (_checkedIn)
                FilledButton.icon(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.check_rounded),
                    label: const Text('Done')),
              const SizedBox(height: 10),
              const Text(
                  'Demo check-ins are stored on this device for the current session.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF8B97A8), fontSize: 11)),
            ],
          ),
        ),
      );
}

class DemoSrcOfficeScreen extends StatefulWidget {
  const DemoSrcOfficeScreen({super.key, required this.store});
  final DemoStore store;

  @override
  State<DemoSrcOfficeScreen> createState() => _DemoSrcOfficeScreenState();
}

class _DemoSrcOfficeScreenState extends State<DemoSrcOfficeScreen> {
  Future<void> _sendFeedback() async {
    final controller = TextEditingController();
    final message = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Share feedback with the SRC'),
        content: TextField(
          controller: controller,
          minLines: 3,
          maxLines: 6,
          decoration:
              const InputDecoration(hintText: 'What should the SRC know?'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, controller.text.trim()),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (message != null && message.trim().isNotEmpty) {
      widget.store.addSrcFeedback(message);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Feedback saved in this demo.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: widget.store,
        builder: (context, _) => Scaffold(
          body: SafeArea(
            bottom: false,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
              children: [
                const _SrcPosterBanner(),
                const SizedBox(height: 16),
                const _ModuleHeading(
                    title: 'Meet your SRC',
                    subtitle: 'Meet the student leaders serving GCTU'),
                SizedBox(
                  height: 222,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      for (final leader in const [
                        (
                          'Nana Ofori',
                          'SRC President',
                          'assets/demo/gctu-students-1.jpg'
                        ),
                        (
                          'Akosua Nyarko',
                          'Vice President',
                          'assets/demo/gctu-students-2.jpg'
                        ),
                        (
                          'Kwame Asante',
                          'General Secretary',
                          'assets/demo/gctu-students-3.jpg'
                        ),
                      ])
                        _SrcLeaderCard(
                          name: leader.$1,
                          role: leader.$2,
                          image: leader.$3,
                          onTap: () => _showInfo(context, leader.$2,
                              '${leader.$1}\n\nSample SRC profile for the CampusOne presentation.'),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Official updates',
                    subtitle: 'Sample notices for this presentation'),
                for (final notice in demoAnnouncements.take(2))
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.campaign_outlined),
                      title: Text(notice.title),
                      subtitle: Text('${notice.category} | ${notice.date}'),
                      onTap: () =>
                          _showInfo(context, notice.title, notice.body),
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Projects & initiatives',
                    subtitle: 'Public progress updates'),
                _SrcProjectSpotlight(
                  title: 'Campus Wi-Fi feedback drive',
                  status: 'IN PROGRESS',
                  image: 'assets/demo/gctu-students-together.jpg',
                  onTap: () => _showInfo(context, 'Campus Wi-Fi feedback drive',
                      'Collecting student reports about study areas. This is a sample public progress update.'),
                ),
                for (final project in const [
                  (
                    'Welcome week',
                    'Completed',
                    'A sample programme to help new students connect.'
                  ),
                ])
                  Card(
                    child: ListTile(
                      leading: Icon(Icons.flag_outlined,
                          color: Theme.of(context).colorScheme.primary),
                      title: Text(project.$1),
                      subtitle: Text(project.$3),
                      trailing: Text(project.$2),
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'SRC committees',
                    subtitle: 'Sample committee directory'),
                for (final committee in const [
                  ('Academic Affairs', 'Academic support and student learning'),
                  (
                    'Welfare Committee',
                    'Student wellbeing and campus services'
                  ),
                  (
                    'Sports and Recreation',
                    'Games, fitness and student sports'
                  ),
                ])
                  Card(
                    child: ListTile(
                      leading: Icon(Icons.groups_outlined,
                          color: Theme.of(context).colorScheme.primary),
                      title: Text(committee.$1),
                      subtitle: Text(committee.$2),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _showInfo(context, committee.$1,
                          '${committee.$2}. This is sample committee information.'),
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'SRC events',
                    subtitle: 'Sample programmes and RSVP'),
                for (final event in demoEvents.where((e) => e.id == 'akwaaba'))
                  _SrcEventCard(event: event, store: widget.store),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Have your say',
                    subtitle: 'Sample student consultation'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                              'Which area should the SRC prioritize next?',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          for (final option in const [
                            'Study spaces',
                            'Student transport',
                            'Campus activities'
                          ])
                            ChoiceChip(
                              label: Text(option),
                              selected: widget.store.srcPollChoice == option,
                              onSelected: (_) {
                                widget.store.voteSrcPoll(option);
                              },
                            ),
                          if (widget.store.srcPollChoice != null)
                            const Text(
                                'Thanks. Your sample vote is recorded locally.'),
                        ]),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: _sendFeedback,
                  icon: const Icon(Icons.edit_note_outlined),
                  label: const Text('Send private feedback'),
                ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Student resources',
                    subtitle: 'Sample public documents'),
                for (final resource in const [
                  ('SRC student support guide', 'PDF guide'),
                  ('Campus services directory', 'Directory'),
                  ('Student welfare contacts', 'Contact sheet'),
                ])
                  Card(
                    child: ListTile(
                      leading: Icon(Icons.description_outlined,
                          color: Theme.of(context).colorScheme.primary),
                      title: Text(resource.$1),
                      subtitle: Text(resource.$2),
                      trailing: const Icon(Icons.open_in_new),
                      onTap: () => _showInfo(context, resource.$1,
                          'This sample resource is included for the presentation. Official documents are not connected.'),
                    ),
                  ),
                if (widget.store.srcFeedback.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const _ModuleHeading(
                      title: 'Your feedback',
                      subtitle: 'Visible only in this demo'),
                  for (final item in widget.store.srcFeedback)
                    Card(
                        child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Text(item))),
                ],
                const SizedBox(height: 12),
                const _DemoDisclaimer(),
              ],
            ),
          ),
        ),
      );
}

class _SrcEventCard extends StatelessWidget {
  const _SrcEventCard({required this.event, required this.store});
  final DemoEvent event;
  final DemoStore store;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(
            height: 150,
            width: double.infinity,
            child: Stack(fit: StackFit.expand, children: [
              Image.asset('assets/demo/gctu-students-together.jpg',
                  fit: BoxFit.cover),
              DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                    event.colors.first.withValues(alpha: .08),
                    event.colors.first.withValues(alpha: .88)
                  ]))),
              Positioned(
                  left: 14,
                  bottom: 13,
                  child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16)),
                      child: Text(event.date,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontSize: 10,
                              fontWeight: FontWeight.w800)))),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 11, 8, 8),
            child: Row(children: [
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(event.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurface,
                            fontWeight: FontWeight.w800,
                            fontSize: 15)),
                    const SizedBox(height: 4),
                    Text('${event.time} · ${event.venue}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                            color:
                                Theme.of(context).colorScheme.onSurfaceVariant,
                            fontSize: 12)),
                  ])),
              const SizedBox(width: 6),
              FilledButton.tonal(
                  onPressed: () => store.toggleRsvp(event.id),
                  child: Text(store.isGoing(event.id) ? 'Going' : 'RSVP')),
            ]),
          ),
        ]),
      );
}

class DemoFreshersHubScreen extends StatelessWidget {
  const DemoFreshersHubScreen({super.key, required this.store});
  final DemoStore store;

  static const _steps = [
    'Find your lecture rooms',
    'Set up your student profile',
    'Explore a club or society',
    'Save your first campus event',
    'Locate the library and student services',
  ];

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) {
          final done = _steps.where(store.isFreshersStepComplete).length;
          return Scaffold(
            appBar: AppBar(title: const Text('Freshers Hub')),
            body: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                const _FreshersWelcomeCard(),
                const SizedBox(height: 16),
                const _ModuleHeading(
                    title: 'Your first week, made easier',
                    subtitle: 'Jump straight into the essentials'),
                const SizedBox(height: 8),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.55,
                  children: [
                    _FreshersAction(
                        icon: Icons.groups_rounded,
                        title: 'Find your club',
                        detail: 'Meet your people',
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                                builder: (_) =>
                                    DemoClubsScreen(store: store)))),
                    _FreshersAction(
                        icon: Icons.event_available_rounded,
                        title: 'Campus events',
                        detail: 'See what is happening',
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                                builder: (_) =>
                                    _FreshersEventsScreen(store: store)))),
                    _FreshersAction(
                        icon: Icons.calendar_month_rounded,
                        title: 'My timetable',
                        detail: 'Plan your week',
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                                builder: (_) =>
                                    DemoTimetableScreen(store: store)))),
                    _FreshersAction(
                        icon: Icons.home_work_rounded,
                        title: 'Accommodation',
                        detail: 'Explore student housing',
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute<void>(
                                builder: (_) => const DemoHostelsScreen()))),
                  ],
                ),
                const SizedBox(height: 16),
                _ModuleHeading(
                    title: 'Your first-week checklist',
                    subtitle: '$done of ${_steps.length} complete'),
                LinearProgressIndicator(
                    value: done / _steps.length,
                    minHeight: 7,
                    borderRadius: BorderRadius.circular(8)),
                const SizedBox(height: 8),
                for (final step in _steps)
                  Card(
                    child: CheckboxListTile(
                      value: store.isFreshersStepComplete(step),
                      onChanged: (_) => store.toggleFreshersStep(step),
                      title: Text(step),
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Campus guide',
                    subtitle: 'Know what to find and where to ask'),
                for (final place in const [
                  (
                    'Library',
                    'Quiet study, books and learning support',
                    Icons.local_library_outlined
                  ),
                  (
                    'Student Services',
                    'Guidance for student support and welfare',
                    Icons.support_agent_outlined
                  ),
                  (
                    'SRC Office',
                    'Student leadership and representation',
                    Icons.account_balance_outlined
                  ),
                  (
                    'ICT Help Desk',
                    'Help with campus systems and connectivity',
                    Icons.computer_outlined
                  ),
                ])
                  Card(
                    child: ListTile(
                      leading: Icon(place.$3,
                          color: Theme.of(context).colorScheme.primary),
                      title: Text(place.$1),
                      subtitle: Text(place.$2),
                      trailing: const Icon(Icons.info_outline),
                      onTap: () => _showInfo(context, place.$1,
                          '${place.$2}. Location and opening hours are sample details; confirm them with the university.'),
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Quick answers',
                    subtitle: 'Helpful pointers for getting started'),
                for (final faq in const [
                  (
                    'How do I find my classes?',
                    'Check your department timetable and confirm room details with your class representative.'
                  ),
                  (
                    'How do I join a club?',
                    'Browse the club directory, review its membership details and join or request membership.'
                  ),
                  (
                    'Where can I get official updates?',
                    'Check the SRC Office and your department announcements regularly.'
                  ),
                  (
                    'Who can help with account access?',
                    'Use the account help options in CampusOne or contact the university support team.'
                  ),
                ])
                  Card(
                    child: ExpansionTile(
                      title: Text(faq.$1),
                      childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      children: [Text(faq.$2)],
                    ),
                  ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'More ways to settle in',
                    subtitle: 'Useful student spaces'),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => DemoClubsScreen(store: store)),
                  ),
                  icon: const Icon(Icons.groups_outlined),
                  label: const Text('Explore clubs'),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const DemoHostelsScreen()),
                  ),
                  icon: const Icon(Icons.home_work_outlined),
                  label: const Text('Browse accommodation'),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const DemoCommunityScreen()),
                  ),
                  icon: const Icon(Icons.forum_outlined),
                  label: const Text('Join the student conversation'),
                ),
                const SizedBox(height: 14),
                const _ModuleHeading(
                    title: 'Orientation picks',
                    subtitle: 'Sample events to help you meet people'),
                for (final event in demoEvents
                    .where((e) => e.id == 'akwaaba' || e.id == 'career'))
                  Card(
                    child: ListTile(
                      leading: CircleAvatar(
                          backgroundColor: event.colors.first,
                          child: Icon(event.icon, color: Colors.white)),
                      title: Text(event.title),
                      subtitle: Text(
                          '${event.date} | ${event.time} | ${event.venue}'),
                      isThreeLine: true,
                      trailing: TextButton(
                        onPressed: () => store.toggleRsvp(event.id),
                        child: Text(store.isGoing(event.id) ? 'Going' : 'RSVP'),
                      ),
                    ),
                  ),
                const SizedBox(height: 14),
                OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                        builder: (_) => const DemoCommunityScreen()),
                  ),
                  icon: const Icon(Icons.forum_outlined),
                  label: const Text('Meet other students'),
                ),
                const SizedBox(height: 12),
                const _DemoDisclaimer(),
              ],
            ),
          );
        },
      );
}

class _FreshersWelcomeCard extends StatelessWidget {
  const _FreshersWelcomeCard();

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF062654), Color(0xFF0642A1)],
            ),
          ),
          child: Column(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(72),
                child: Image.asset(
                  'assets/demo/ama-demo-profile.jpg',
                  width: 120,
                  height: 120,
                  fit: BoxFit.cover,
                  alignment: Alignment.topCenter,
                  semanticLabel:
                      'Student portrait for the Freshers welcome guide',
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'AKWAABA TO GCTU',
                style: TextStyle(
                  color: CampusColors.accent,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 7),
              Text(
                'Start campus with confidence.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Your first-week guide to people, places and useful student tools.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, height: 1.4),
              ),
            ],
          ),
        ),
      );
}

class _FreshersAction extends StatelessWidget {
  const _FreshersAction({
    required this.icon,
    required this.title,
    required this.detail,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String detail;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 3),
                    Text(detail,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Theme.of(context)
                                .colorScheme
                                .onSurfaceVariant)),
                  ],
                ),
              ),
            ]),
          ),
        ),
      );
}

class _FreshersEventsScreen extends StatelessWidget {
  const _FreshersEventsScreen({required this.store});
  final DemoStore store;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: store,
        builder: (context, _) => Scaffold(
          appBar: AppBar(title: const Text('Welcome events')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _ModuleHero(
                image: 'assets/demo/gctu-students-together.jpg',
                eyebrow: 'MEET YOUR CAMPUS',
                title: 'Make your first connections.',
                detail:
                    'Illustrative demo events; check official channels for live schedules.',
              ),
              const SizedBox(height: 14),
              for (final event in demoEvents.where(
                  (event) => event.id == 'akwaaba' || event.id == 'career'))
                Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: event.colors.first,
                      child: Icon(event.icon, color: Colors.white),
                    ),
                    title: Text(event.title),
                    subtitle:
                        Text('${event.date} · ${event.time} · ${event.venue}'),
                    isThreeLine: true,
                    trailing: FilledButton.tonal(
                      onPressed: () => store.toggleRsvp(event.id),
                      child: Text(store.isGoing(event.id) ? 'Going' : 'RSVP'),
                    ),
                  ),
                ),
              const _DemoDisclaimer(),
            ],
          ),
        ),
      );
}

class _ClubPhotoCard extends StatelessWidget {
  const _ClubPhotoCard(
      {required this.club, required this.store, required this.onTap});
  final DemoClub club;
  final DemoStore store;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              flex: 3,
              child: Stack(fit: StackFit.expand, children: [
                Image.asset(_clubPhotos[club.id]!, fit: BoxFit.cover),
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.transparent, const Color(0xE60B2545)],
                    ),
                  ),
                ),
                Positioned(
                  left: 11,
                  right: 10,
                  bottom: 10,
                  child: Text(club.category.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: .7)),
                ),
              ]),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(11, 9, 11, 8),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(club.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                              height: 1.15)),
                      const Spacer(),
                      Row(children: [
                        Icon(Icons.people_alt_outlined,
                            size: 14, color: club.color),
                        const SizedBox(width: 4),
                        Expanded(
                            child: Text('${club.members} members',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .onSurfaceVariant,
                                    fontSize: 11))),
                        Icon(
                            store.isJoined(club.id)
                                ? Icons.check_circle_rounded
                                : Icons.arrow_forward_rounded,
                            size: 16,
                            color: club.color),
                      ]),
                    ]),
              ),
            ),
          ]),
        ),
      );
}

class _ClubPassportCard extends StatelessWidget {
  const _ClubPassportCard({required this.store, required this.club});
  final DemoStore store;
  final DemoClub club;

  @override
  Widget build(BuildContext context) {
    final count = store.clubAttendanceCount(club.id);
    final progress = (count / 3).clamp(0.0, 1.0);
    final earned = count >= 3;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                    color: const Color(0xFFFFF2C2),
                    borderRadius: BorderRadius.circular(15)),
                child: Icon(
                    earned
                        ? Icons.workspace_premium_rounded
                        : Icons.military_tech_rounded,
                    color: const Color(0xFF9B6B00),
                    size: 27)),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text(
                      earned
                          ? '${club.name} certificate unlocked'
                          : '${club.name} club progress',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Theme.of(context).colorScheme.onSurface)),
                  const SizedBox(height: 3),
                  Text(
                      '$count verified ${count == 1 ? 'activity' : 'activities'} · 3 to earn a certificate',
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          fontSize: 12)),
                ])),
          ]),
          const SizedBox(height: 14),
          ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: const Color(0xFFEAF0FA),
                  color: const Color(0xFFF0B429))),
          if (earned) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => showDialog<void>(
                  context: context,
                  builder: (context) => AlertDialog(
                        title: const Text('Club participation certificate'),
                        content: Text(
                            'This demo certificate recognizes three verified activities for ${club.name}. Official certificates would be issued by the club executive team.'),
                        actions: [
                          TextButton(
                              onPressed: () => Navigator.pop(context),
                              child: const Text('Close'))
                        ],
                      )),
              icon: const Icon(Icons.workspace_premium_outlined),
              label: const Text('View certificate'),
            ),
          ],
        ]),
      ),
    );
  }
}

class _ModuleHero extends StatelessWidget {
  const _ModuleHero(
      {required this.image,
      required this.eyebrow,
      required this.title,
      required this.detail});
  final String image, eyebrow, title, detail;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: SizedBox(
          height: 190,
          child: Stack(fit: StackFit.expand, children: [
            Image.asset(image,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    Container(color: Theme.of(context).colorScheme.primary)),
            const DecoratedBox(
                decoration: BoxDecoration(
                    gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x160B2545), Color(0xE60B2545)]))),
            Positioned(
                left: 18,
                right: 18,
                bottom: 18,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(eyebrow,
                        style: const TextStyle(
                            color: CampusColors.accent,
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1)),
                    const SizedBox(height: 5),
                    Text(title,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 23,
                            height: 1.05,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 5),
                    Text(detail,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12)),
                  ],
                )),
          ]),
        ),
      );
}

class _SrcPosterBanner extends StatelessWidget {
  const _SrcPosterBanner();

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: AspectRatio(
          aspectRatio: 1066 / 1280,
          child: Image.asset(
            'assets/demo/WhatsApp Image 2026-10-19 at 10.10.39.jpeg',
            fit: BoxFit.cover,
            semanticLabel: 'GCTU SRC Welcome Back to Campus poster',
          ),
        ),
      );
}

class _SrcLeaderCard extends StatelessWidget {
  const _SrcLeaderCard(
      {required this.name,
      required this.role,
      required this.image,
      required this.onTap});
  final String name, role, image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 160,
        child: Card(
          clipBehavior: Clip.antiAlias,
          margin: const EdgeInsets.only(right: 12, bottom: 4),
          child: InkWell(
            onTap: onTap,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: Image.asset(image,
                      fit: BoxFit.cover, width: double.infinity)),
              Padding(
                padding: const EdgeInsets.fromLTRB(11, 8, 11, 10),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontWeight: FontWeight.w800,
                              fontSize: 13)),
                      const SizedBox(height: 3),
                      Text(role,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w700)),
                    ]),
              ),
            ]),
          ),
        ),
      );
}

class _SrcProjectSpotlight extends StatelessWidget {
  const _SrcProjectSpotlight(
      {required this.title,
      required this.status,
      required this.image,
      required this.onTap});
  final String title, status, image;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: SizedBox(
            height: 168,
            child: Stack(fit: StackFit.expand, children: [
              Image.asset(image, fit: BoxFit.cover),
              const DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Color(0x110B2545), Color(0xE60B2545)]))),
              Positioned(
                  left: 14,
                  right: 14,
                  bottom: 14,
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(status,
                            style: const TextStyle(
                                color: CampusColors.accent,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                letterSpacing: .8)),
                        const SizedBox(height: 5),
                        Text(title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800)),
                      ])),
            ]),
          ),
        ),
      );
}

class _ModuleHeading extends StatelessWidget {
  const _ModuleHeading({required this.title, required this.subtitle});
  final String title, subtitle;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurface,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(subtitle,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant)),
        ]),
      );
}

class _RecognitionChip extends StatelessWidget {
  const _RecognitionChip({required this.label, required this.icon});
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Chip(
        avatar:
            Icon(icon, size: 16, color: Theme.of(context).colorScheme.primary),
        label: Text(label),
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHigh,
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      );
}

class _InfoPill extends StatelessWidget {
  const _InfoPill({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Chip(
        avatar:
            Icon(icon, size: 15, color: Theme.of(context).colorScheme.primary),
        label: Text(label),
        visualDensity: VisualDensity.compact,
      );
}

class _DemoDisclaimer extends StatelessWidget {
  const _DemoDisclaimer();

  @override
  Widget build(BuildContext context) => Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Text(
          'Demo content and images are for presentation. Actions are saved only in this app session.',
          textAlign: TextAlign.center,
          style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 11,
              height: 1.4),
        ),
      );
}

void _showInfo(BuildContext context, String title, String detail) =>
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(detail),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close')),
        ],
      ),
    );
