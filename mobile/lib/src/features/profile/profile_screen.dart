import 'package:flutter/material.dart';

import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/widgets/states.dart';
import '../attendance/attendance_history_screen.dart';
import '../auth/sign_in_screen.dart';
import '../badges/badges_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final session = SessionScope.sessionOf(context);
    final user = session.user;
    return PhotoScaffold(
      image: DemoImages.campusLife,
      eyebrow: 'YOUR CAMPUS, YOUR STORY',
      title: 'A little more you.',
      description: 'The things you care about, the people you connect with and the plans you are making.',
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
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CampusAvatar(
                      name: user.name,
                      image: CampusMedia.tryParse(user.avatar, alt: user.name),
                      size: 64,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user.email,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(
                                  color: Theme.of(
                                    context,
                                  ).colorScheme.onSurfaceVariant,
                                ),
                          ),
                          const SizedBox(height: 6),
                          StatusChip(label: user.roleLabel()),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
          if (session.signedIn)
            _Row(
              icon: Icons.edit_outlined,
              title: 'Edit profile',
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const EditProfileScreen()),
              ),
            ),
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
