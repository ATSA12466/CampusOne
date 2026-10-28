import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class OpportunitiesScreen extends StatelessWidget {
  const OpportunitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'opportunities',
      title: 'Opportunities',
      emptyTitle: 'No opportunities found',
      emptyMessage: 'Internships, competitions and pathways appear here.',
      icon: Icons.rocket_launch_outlined,
    );
  }
}
