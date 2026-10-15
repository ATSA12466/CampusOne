import 'package:flutter/material.dart';

import '../../core/media/media.dart';

/// The web's first-run tour data (`src/config/onboarding.ts` plus the highlight
/// cards in `src/features/onboarding/components/intro-highlights.tsx`), so the
/// app walks the same five steps with the same words.
///
/// Amended for the app only where the web sentence would be untrue here — the
/// app's tasks, notes and plans live on the CampusOne account, not on a single
/// browser. Those two amendments are called out in `docs/CROSS_PLATFORM_PARITY.md`.
const programmes = [
  'BSc Information Technology',
  'BSc Computer Science',
  'BSc Computer Engineering',
  'BSc Business Administration',
];

const levels = ['Level 100', 'Level 200', 'Level 300', 'Level 400', 'Postgraduate'];

const campusInterests = [
  'Clubs & societies',
  'Events & culture',
  'Study & academics',
  'Careers & opportunities',
  'Campus living',
  'Student representation',
];

class OnboardingHighlight {
  const OnboardingHighlight({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;
}

const _explore = OnboardingHighlight(
  icon: Icons.explore_outlined,
  title: 'A campus worth exploring',
  text: 'Photo stories, useful shortcuts, LMS/SIP links and a magazine-style Home.',
);
const _focus = OnboardingHighlight(
  icon: Icons.menu_book_outlined,
  title: 'Make a little room for focus',
  text: 'Course resources, your account tasks and the supplied class schedule.',
);
const _people = OnboardingHighlight(
  icon: Icons.volunteer_activism_outlined,
  title: 'Good people. Shared interests.',
  text: 'Find clubs, preview membership requests and see the next campus event.',
);
const _next = OnboardingHighlight(
  icon: Icons.event_available_outlined,
  title: 'Your next chapter',
  text: 'Explore student opportunities and the parts of campus life you care about.',
);

class OnboardingStep {
  const OnboardingStep({
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.image,
    this.highlights = const [],
  });

  final String eyebrow;
  final String title;
  final String description;
  final CampusMedia image;
  final List<OnboardingHighlight> highlights;
}

const onboardingSteps = [
  OnboardingStep(
    eyebrow: '01 / A PLACE TO BEGIN',
    title: 'Your campus starts with you.',
    description:
        'A little less searching. A little more belonging. Meet your independent '
        'student-life companion for GCTU.',
    image: DemoImages.campusLife,
    highlights: [_explore, _focus, _people],
  ),
  OnboardingStep(
    eyebrow: '02 / MAKE ROOM FOR FOCUS',
    title: 'A little plan. A good day.',
    // Web: "…stays on this device, not in the university timetable." The app
    // syncs to the CampusOne account, so it says so instead.
    description:
        'Bring your classes, learning resources and to-dos into view. Demo '
        'planning syncs to your CampusOne account, not the university timetable.',
    image: DemoImages.studyCorner,
    highlights: [_focus],
  ),
  OnboardingStep(
    eyebrow: '03 / FIND YOUR PEOPLE',
    title: 'Good company changes everything.',
    description:
        'Explore communities, campus events and ideas worth showing up for. '
        'Club requests and tickets are labelled demo previews.',
    image: DemoImages.clubsHero,
    highlights: [_people],
  ),
  OnboardingStep(
    eyebrow: '04 / STAY IN THE LOOP',
    title: 'Your voice has a place here.',
    description:
        'Discover student representation, campus updates and opportunities. '
        'This independent prototype is not an official SRC or university service.',
    image: DemoImages.innovationNight,
    highlights: [_next],
  ),
  OnboardingStep(
    eyebrow: '05 / MAKE IT YOURS',
    title: 'A familiar face. A fresh start.',
    // Web: "These are preferences, not official academic registration."
    description:
        "Set up your CampusOne profile and choose the parts of campus life "
        "you're curious about. These are preferences, not official academic "
        'registration.',
    image: DemoImages.clubsHero,
  ),
];
