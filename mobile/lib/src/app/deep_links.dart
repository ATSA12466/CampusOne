import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import '../features/clubs/club_detail_screen.dart';
import '../features/events/event_detail_screen.dart';

/// Opens `campusone://` links: `campusone://events/<id>` and
/// `campusone://clubs/<id>`. Paths mirror the web routes (`/events/<id>`,
/// `/clubs/<id>`) so https universal links can reuse this parser later.
/// Unknown links are ignored; the user just stays where they are.
class DeepLinkHandler extends StatefulWidget {
  const DeepLinkHandler({super.key, required this.child});

  final Widget child;

  @override
  State<DeepLinkHandler> createState() => _DeepLinkHandlerState();
}

class _DeepLinkHandlerState extends State<DeepLinkHandler> {
  StreamSubscription<Uri>? _sub;

  @override
  void initState() {
    super.initState();
    final links = AppLinks();
    _sub = links.uriLinkStream.listen(_open, onError: (_) {});
    _openInitial(links);
  }

  Future<void> _openInitial(AppLinks links) async {
    try {
      final uri = await links.getInitialLink();
      if (uri != null && mounted) _open(uri);
    } catch (_) {
      // Cold-start links are best-effort; the app still boots normally.
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  void _open(Uri uri) {
    if (!mounted) return;
    if (uri.scheme != 'campusone') return;
    // `campusone://events/1` puts "events" in host; accept path form too.
    final parts = [if (uri.host.isNotEmpty) uri.host, ...uri.pathSegments];
    if (parts.length != 2) return;
    final Widget? screen = switch (parts[0]) {
      'events' => EventDetailScreen(eventId: parts[1]),
      'clubs' => ClubDetailScreen(clubId: parts[1]),
      _ => null,
    };
    if (screen == null) return;
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => screen));
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
