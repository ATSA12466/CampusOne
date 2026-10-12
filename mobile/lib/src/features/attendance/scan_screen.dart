import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/widgets/states.dart';
import 'attendance_repository.dart';

/// Student QR check-in. The camera only reads the code; the server validates
/// everything (signature, expiry, eligibility, duplicates).
class ScanScreen extends StatefulWidget {
  const ScanScreen({super.key});

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  final _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.normal,
    facing: CameraFacing.back,
  );
  bool _busy = false;
  CheckInResult? _result;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_busy || _result != null) return;
    if (capture.barcodes.isEmpty) return;
    final raw = capture.barcodes.first.rawValue?.trim() ?? '';
    if (raw.isEmpty || !raw.startsWith('C1A1.')) return;
    if (!SessionScope.sessionOf(context).signedIn) {
      if (mounted) {
        showAppMessage(context, 'Please sign in to check in.', error: true);
      }
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await AttendanceRepository(
        SessionScope.apiOf(context),
      ).checkIn(raw);
      if (mounted) setState(() => _result = result);
    } on ApiException catch (error) {
      if (mounted) {
        showAppMessage(context, error.message, error: true);
        setState(() => _busy = false);
      }
    }
  }

  void _reset() => setState(() {
    _result = null;
    _busy = false;
  });

  @override
  Widget build(BuildContext context) {
    final result = _result;
    return Scaffold(
      appBar: AppBar(title: const Text('Scan to check in')),
      body: SafeArea(
        child: result != null
            ? _ResultView(result: result, onScanAgain: _reset)
            : Column(
                children: [
                  Expanded(
                    child: Stack(
                      children: [
                        MobileScanner(
                          controller: _controller,
                          onDetect: _onDetect,
                        ),
                        if (_busy)
                          Container(
                            color: Colors.black54,
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: Colors.white,
                              ),
                            ),
                          ),
                        Center(
                          child: Container(
                            width: 240,
                            height: 240,
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: Colors.white,
                                width: 3,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Point the camera at the session QR shown by the event team. Codes rotate every minute.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.result, required this.onScanAgain});

  final CheckInResult result;
  final VoidCallback onScanAgain;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              result.duplicate
                  ? Icons.info_outline
                  : Icons.check_circle_outline,
              size: 72,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 16),
            Text(
              result.duplicate ? 'Already checked in' : 'Checked in',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              result.record.eventTitle,
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            Text(
              prettyDateTime(result.record.checkedInAt),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (result.badges.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...result.badges.map(
                (award) => Card(
                  child: ListTile(
                    leading: Icon(
                      award.badge?.iconData ?? Icons.verified_outlined,
                      color: theme.colorScheme.primary,
                    ),
                    title: Text(
                      'Badge earned: ${award.badge?.name ?? award.badgeId}',
                    ),
                    subtitle: award.badge == null
                        ? null
                        : Text(award.badge!.description),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: onScanAgain,
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan another'),
            ),
          ],
        ),
      ),
    );
  }
}
