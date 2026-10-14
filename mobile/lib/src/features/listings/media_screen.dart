import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class MediaScreen extends StatelessWidget {
  const MediaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'media',
      title: 'Media',
      emptyTitle: 'No media found',
      emptyMessage: 'Campus media and playback samples appear here.',
      icon: Icons.play_circle_outline,
    );
  }
}
