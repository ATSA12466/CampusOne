import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
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

  /// Reads a check-in code from a saved image (screenshot, forwarded invite).
  /// Uses the same server-validated check-in path as the live camera.
  Future<void> _pickFromGallery() async {
    if (_busy || _result != null) return;
    try {
      final file = await ImagePicker().pickImage(source: ImageSource.gallery);
      if (file == null || !mounted) return;
      final capture = await _controller.analyzeImage(file.path);
      if (!mounted) return;
      final barcodes = capture?.barcodes ?? const [];
      final raw =
          barcodes.isEmpty ? '' : (barcodes.first.rawValue?.trim() ?? '');
      if (!raw.startsWith('C1A1.')) {
        showAppMessage(
          context,
          'No check-in code found in that image.',
          error: true,
        );
        return;
      }
      await _onDetect(capture!);
    } catch (_) {
      if (mounted) {
        showAppMessage(context, 'Could not read that image.', error: true);
      }
    }
  }

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
                          errorBuilder: (context, error, _) => _CameraErrorView(
                            denied:
                                error.errorCode ==
                                MobileScannerErrorCode.permissionDenied,
                            message: error.toString(),
                            onRetry: () => _controller.start(),
                          ),
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
                    padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      'Point the camera at the session QR shown by the event team. Codes rotate every minute.',
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: OutlinedButton.icon(
                      onPressed: _busy ? null : _pickFromGallery,
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('Choose from gallery'),
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Shown when the camera cannot start — most often because camera access
/// was denied. Explains the fix instead of leaving a black preview.
class _CameraErrorView extends StatelessWidget {
  const _CameraErrorView({
    required this.denied,
    required this.message,
    required this.onRetry,
  });

  final bool denied;
  final String message;
  final VoidCallback onRetry;

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
              denied ? Icons.videocam_off_outlined : Icons.error_outline,
              size: 56,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 12),
            Text(
              denied ? 'Camera access is off' : 'Camera unavailable',
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              denied
                  ? 'Allow camera access for CampusOne in your system Settings, then try again.'
                  : message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
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
