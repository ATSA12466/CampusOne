import 'dart:async';

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'attendance_repository.dart';

/// Executive live QR display. Polls a fresh signed payload every slot so
/// screenshots expire within about a minute.
class LiveQrScreen extends StatefulWidget {
  const LiveQrScreen({super.key, required this.sessionId, required this.title});

  final String sessionId;
  final String title;

  @override
  State<LiveQrScreen> createState() => _LiveQrScreenState();
}

class _LiveQrScreenState extends State<LiveQrScreen> {
  SessionCode? _code;
  String? _error;
  Timer? _timer;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _refresh();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _refresh());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    try {
      final code = await AttendanceRepository(
        SessionScope.apiOf(context),
      ).liveCode(widget.sessionId);
      if (mounted) {
        setState(() {
          _code = code;
          _error = null;
          _loading = false;
        });
      }
    } on ApiException catch (error) {
      if (mounted) {
        setState(() {
          _error = error.message;
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final code = _code;
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: _loading
                ? const LoadingView(label: 'Preparing QR…')
                : _error != null
                ? ErrorView(message: _error!, onRetry: _refresh)
                : code == null
                ? const EmptyView(
                    title: 'No code',
                    message: 'The session may be closed or revoked.',
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: QrImageView(
                          data: code.code,
                          size: 260,
                          backgroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Refreshes automatically · valid to ${prettyDateTime(code.slotEndsAt)}',
                        style: Theme.of(context).textTheme.bodySmall,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
