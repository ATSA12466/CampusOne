import 'package:flutter/material.dart';

import '../core/auth/auth_session.dart';
import '../core/push/push_service.dart';
import '../features/attendance/scan_screen.dart';
import '../features/clubs/clubs_screen.dart';
import '../features/events/events_screen.dart';
import '../features/home/home_screen.dart';
import '../features/messages/conversations_screen.dart';
import '../features/more/more_screen.dart';

/// Bottom-tab shell. Guests get Home/Events/Clubs/More; signed-in users
/// also get a Scan action and Messages.
class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      PushService.init(SessionScope.apiOf(context));
    });
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = SessionScope.sessionOf(context).signedIn;
    final tabs = signedIn
        ? const [
            _Tab(
              label: 'Home',
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              screen: HomeScreen(),
            ),
            _Tab(
              label: 'Events',
              icon: Icons.event_outlined,
              activeIcon: Icons.event,
              screen: EventsScreen(),
            ),
            _Tab(
              label: 'Scan',
              icon: Icons.qr_code_scanner,
              activeIcon: Icons.qr_code_scanner,
              screen: ScanScreen(),
            ),
            _Tab(
              label: 'Messages',
              icon: Icons.forum_outlined,
              activeIcon: Icons.forum,
              screen: ConversationsScreen(),
            ),
            _Tab(
              label: 'More',
              icon: Icons.menu,
              activeIcon: Icons.menu,
              screen: MoreScreen(),
            ),
          ]
        : const [
            _Tab(
              label: 'Home',
              icon: Icons.home_outlined,
              activeIcon: Icons.home,
              screen: HomeScreen(),
            ),
            _Tab(
              label: 'Events',
              icon: Icons.event_outlined,
              activeIcon: Icons.event,
              screen: EventsScreen(),
            ),
            _Tab(
              label: 'Clubs',
              icon: Icons.groups_outlined,
              activeIcon: Icons.groups,
              screen: ClubsScreen(),
            ),
            _Tab(
              label: 'More',
              icon: Icons.menu,
              activeIcon: Icons.menu,
              screen: MoreScreen(),
            ),
          ];
    final safeIndex = _index.clamp(0, tabs.length - 1);
    return Scaffold(
      body: IndexedStack(index: safeIndex, children: [
        for (final tab in tabs) tab.screen,
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: safeIndex,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          for (final tab in tabs)
            NavigationDestination(
              icon: Icon(tab.icon),
              selectedIcon: Icon(tab.activeIcon),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}

class _Tab {
  const _Tab({
    required this.label,
    required this.icon,
    required this.activeIcon,
    required this.screen,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final Widget screen;
}
