import 'package:flutter/material.dart';

import '../../../core/media/media.dart';
import '../../../core/theme/app_theme.dart';

/// The three web auth stories (`src/config/auth.ts`), same images and copy.
class AuthStory {
  const AuthStory({
    required this.image,
    required this.eyebrow,
    required this.title,
    required this.description,
  });

  final CampusMedia image;
  final String eyebrow;
  final String title;
  final String description;

  static const signIn = AuthStory(
    image: DemoImages.clubsHero,
    eyebrow: 'YOUR CAMPUS, CONNECTED',
    title: 'Good people. Big possibilities.',
    description:
        'Find your people, make a little plan, and build a campus life that feels like yours.',
  );

  static const register = AuthStory(
    image: DemoImages.innovationNight,
    eyebrow: 'YOUR NEXT CHAPTER',
    title: 'Make this place yours.',
    description:
        'The next idea, the next friendship, the next opportunity. It all starts with showing up.',
  );

  static const recovery = AuthStory(
    image: DemoImages.studyCorner,
    eyebrow: 'A LITTLE HELP',
    title: 'A pause, not a full stop.',
    description:
        "Find your way back to your people, your plans and the things you're building.",
  );
}

/// The web `PhotoStory` panel (`src/features/auth/components/photo-story.tsx`)
/// as a phone-width photo band: same picture, eyebrow, title, description and
/// the same "Generated demo scene" caption.
class AuthStoryPanel extends StatelessWidget {
  const AuthStoryPanel({super.key, required this.story});

  final AuthStory story;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(CampusRadii.media),
      child: AspectRatio(
        // Web `PhotoStory` uses the portrait frame (4:5); the child reads the theme.
        aspectRatio: 4 / 5,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CampusImageFill(image: story.image, alt: story.image.alt),
            const PhotoScrim(hero: true),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  const EyebrowBadge('GCTU · STUDENT LIFE', onPhoto: true),
                  const SizedBox(height: 24),
                  Text(
                    story.eyebrow,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      letterSpacing: 1.8,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    story.title,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    story.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Generated demo scene · fictional people, not GCTU photography.',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white.withAlpha(204),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
