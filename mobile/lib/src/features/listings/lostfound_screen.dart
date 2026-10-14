import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class LostFoundScreen extends StatelessWidget {
  const LostFoundScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'lostFound',
      title: 'Lost & found',
      emptyTitle: 'No reports found',
      emptyMessage: 'Lost and found reports appear here.',
      icon: Icons.find_in_page_outlined,
      photoCollection: 'reports',
      photoTypes: ['lost', 'found'],
    );
  }
}
