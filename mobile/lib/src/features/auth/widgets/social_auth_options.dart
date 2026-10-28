import 'package:flutter/material.dart';

/// Provider choices are shared by registration, sign-in and the offline demo.
/// The CampusOne backend does not currently expose OAuth endpoints, so callers
/// must explain that a provider is not connected instead of implying success.
class SocialAuthOptions extends StatelessWidget {
  const SocialAuthOptions({
    super.key,
    required this.onProvider,
    this.action = 'Continue with',
  });

  final ValueChanged<String> onProvider;
  final String action;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(children: [
            const Expanded(child: Divider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text('OR CONTINUE WITH',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 1.1,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      )),
            ),
            const Expanded(child: Divider()),
          ]),
          const SizedBox(height: 14),
          _ProviderButton(
            label: '$action Google',
            asset: 'assets/brand/google-g.png',
            onPressed: () => onProvider('Google'),
          ),
          const SizedBox(height: 10),
          _ProviderButton(
            label: '$action GitHub',
            asset: 'assets/brand/github-mark.png',
            onPressed: () => onProvider('GitHub'),
          ),
        ],
      );
}

class _ProviderButton extends StatelessWidget {
  const _ProviderButton({
    required this.label,
    required this.asset,
    required this.onPressed,
  });

  final String label;
  final String asset;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 50,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: const Color(0xFF1F1F1F),
            side: const BorderSide(color: Color(0xFF747775)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: Row(children: [
            SizedBox(
              width: 24,
              height: 24,
              child: asset.endsWith('github-mark.png')
                  ? Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(2),
                      child: Image.asset(asset, fit: BoxFit.contain),
                    )
                  : Image.asset(asset, fit: BoxFit.contain),
            ),
            Expanded(
              child: Text(label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF1F1F1F),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  )),
            ),
            const SizedBox(width: 24),
          ]),
        ),
      );
}
