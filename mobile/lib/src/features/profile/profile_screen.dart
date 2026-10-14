import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import '../attendance/attendance_history_screen.dart';
import '../auth/sign_in_screen.dart';
import '../badges/badges_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final user = session.user;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (user == null)
            Card(
              child: ListTile(
                leading: const Icon(Icons.person_outline),
                title: const Text('Browsing as guest'),
                subtitle: const Text('Sign in to RSVP, check in, and more.'),
                trailing: FilledButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const SignInScreen()),
                  ),
                  child: const Text('Sign in'),
                ),
              ),
            )
          else
            Card(
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(
                    context,
                  ).colorScheme.primaryContainer,
                  child: Icon(
                    Icons.person,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
                title: Text(user.name),
                subtitle: Text('${user.email}\n${user.roleLabel()}'),
                isThreeLine: true,
              ),
            ),
          const SizedBox(height: 12),
          _Row(
            icon: Icons.how_to_reg_outlined,
            title: 'My attendance',
            onTap: !session.signedIn
                ? null
                : () => Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const AttendanceHistoryScreen(),
                    ),
                  ),
          ),
          _Row(
            icon: Icons.verified_outlined,
            title: 'My badges',
            onTap: !session.signedIn
                ? null
                : () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const BadgesScreen()),
                  ),
          ),
          const SizedBox(height: 12),
          if (session.signedIn)
            OutlinedButton.icon(
              onPressed: () async {
                await session.signOut();
                if (context.mounted) {
                  showAppMessage(context, 'Signed out.');
                }
              },
              icon: const Icon(Icons.logout),
              label: const Text('Sign out'),
            ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.icon, required this.title, this.onTap});

  final IconData icon;
  final String title;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(title),
        trailing: const Icon(Icons.chevron_right),
        enabled: onTap != null,
        onTap: onTap,
      ),
    );
  }
}
