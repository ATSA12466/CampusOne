import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class CampaignsScreen extends StatelessWidget {
  const CampaignsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'campaigns',
      title: 'Advertising',
      emptyTitle: 'No campaigns',
      emptyMessage: 'Promotional placements appear here.',
      icon: Icons.campaign_outlined,
    );
  }
}
