import 'package:flutter/material.dart';

import 'domain_list_screen.dart';

class CoursesScreen extends StatelessWidget {
  const CoursesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DomainListScreen(
      domain: 'courses',
      title: 'Courses',
      emptyTitle: 'No courses found',
      emptyMessage: 'Course listings appear here.',
      icon: Icons.book_outlined,
    );
  }
}
