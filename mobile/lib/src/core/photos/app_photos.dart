import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

/// Device photos encoded exactly like the web uploader: a compressed JPEG
/// data URL, so the shared 720KB server cap applies to both clients.
class AppPhotos {
  AppPhotos._();

  static final _picker = ImagePicker();

  /// Returns a `data:image/jpeg;base64,…` URL, or null when cancelled.
  static Future<String?> pickDataUrl({
    ImageSource source = ImageSource.gallery,
  }) async {
    final file = await _picker.pickImage(
      source: source,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 70,
    );
    if (file == null) return null;
    final bytes = await File(file.path).readAsBytes();
    final dataUrl = 'data:image/jpeg;base64,${base64Encode(bytes)}';
    // The server caps the data URL string at 720000 chars; base64 inflates
    // raw bytes by ~33%, so validate the encoded string, not the file.
    if (dataUrl.length > 719000) {
      throw const PhotoTooLarge();
    }
    return dataUrl;
  }

  /// Lets the user choose camera or gallery. Returns the data URL or null.
  static Future<String?> chooseDataUrl(BuildContext context) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Choose from gallery'),
              onTap: () => Navigator.of(context).pop(ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined),
              title: const Text('Take a photo'),
              onTap: () => Navigator.of(context).pop(ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (source == null) return null;
    return pickDataUrl(source: source);
  }
}

class PhotoTooLarge implements Exception {
  const PhotoTooLarge();

  @override
  String toString() =>
      'That photo is too large. Pick a smaller one (under ~650KB).';
}
