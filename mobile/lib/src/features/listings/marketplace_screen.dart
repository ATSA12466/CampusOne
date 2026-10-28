import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class MarketplaceScreen extends StatelessWidget {
  const MarketplaceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'marketplace',
      title: 'Marketplace',
      emptyTitle: 'No listings found',
      emptyMessage: 'Items students are selling appear here.',
      icon: Icons.storefront_outlined,
      photoCollection: 'marketPosts',
      photoTypes: ['listing'],
    );
  }
}
