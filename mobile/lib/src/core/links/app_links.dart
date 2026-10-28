import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../widgets/states.dart';

/// Opens http(s) links (media samples, application pages) externally.
Future<void> openExternalLink(BuildContext context, String raw) async {
  final uri = Uri.tryParse(raw.trim());
  if (uri == null || !(uri.scheme == 'http' || uri.scheme == 'https')) {
    if (context.mounted) {
      showAppMessage(context, 'No link is attached to this item.');
    }
    return;
  }
  if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
    if (context.mounted) {
      showAppMessage(context, 'Could not open the link.', error: true);
    }
  }
}
