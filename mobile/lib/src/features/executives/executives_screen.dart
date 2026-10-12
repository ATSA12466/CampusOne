import 'package:flutter/material.dart';

import '../clubs/clubs_screen.dart';
import '../events/events_screen.dart';
import 'manage_hub_screen.dart';

/// Executive hub: everything an exec needs is one hop from here.
class ExecutivesScreen extends StatelessWidget {
  const ExecutivesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Executive tools')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const _Hint(
            text:
                'Club approvals, member management, event check-in sessions, and live QR codes live behind your club dashboards.',
          ),
          const SizedBox(height: 12),
          _Row(
            icon: Icons.groups_outlined,
            title: 'My clubs',
            subtitle: 'Open a club dashboard, then Manage.',
            onTap: () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const ClubsScreen())),
          ),
          _Row(
            icon: Icons.event_outlined,
            title: 'Events',
            subtitle: 'Open an event for check-in sessions.',
            onTap: () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const EventsScreen())),
          ),
          _Row(
            icon: Icons.dashboard_outlined,
            title: 'Manage hub',
            subtitle: 'Requests and check-in overview.',
            onTap: () => Navigator.of(
              context,
            ).push(MaterialPageRoute(builder: (_) => const ManageHubScreen())),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, required this.subtitle, this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

class _Hint extends StatelessWidget {
  const _Hint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.secondaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(
              Icons.info_outline,
              color: Theme.of(context).colorScheme.onSecondaryContainer,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSecondaryContainer,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
