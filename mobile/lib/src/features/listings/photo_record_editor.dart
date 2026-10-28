import 'dart:convert';

import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/photos/app_photos.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';
import 'listings_repository.dart';

/// Add/edit a photo record (own marketplace listing or lost-found report).
/// Records sync to the account; only the owner sees them.
class PhotoRecordEditor extends StatefulWidget {
  const PhotoRecordEditor({
    super.key,
    required this.collection,
    required this.types,
    this.record,
  });

  final String collection; // marketPosts | reports
  final List<String> types;
  final PhotoRecord? record;

  @override
  State<PhotoRecordEditor> createState() => _PhotoRecordEditorState();
}

class _PhotoRecordEditorState extends State<PhotoRecordEditor> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _category;
  late final TextEditingController _location;
  late final TextEditingController _price;
  String _type = 'listing';
  String? _photo;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final record = widget.record;
    _title = TextEditingController(text: record?.title ?? '');
    _description = TextEditingController(text: record?.description ?? '');
    _category = TextEditingController(text: record?.category ?? '');
    _location = TextEditingController(text: record?.location ?? '');
    _price = TextEditingController(
      text: record == null ? '' : record.priceValue.toStringAsFixed(0),
    );
    _type = record?.type ?? widget.types.first;
    _photo = record?.photo;
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _category.dispose();
    _location.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _attach() async {
    try {
      final photo = await AppPhotos.chooseDataUrl(context);
      if (photo != null) setState(() => _photo = photo);
    } on PhotoTooLarge catch (error) {
      if (mounted) showAppMessage(context, error.toString(), error: true);
    } catch (_) {
      if (mounted) {
        showAppMessage(context, 'Could not read that photo.', error: true);
      }
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    if (_photo == null) {
      showAppMessage(context, 'Attach a photo of the item.', error: true);
      return;
    }
    setState(() => _busy = true);
    try {
      await ListingsRepository(
        SessionScope.apiOf(context),
      ).savePhotoRecord(
        widget.collection,
        PhotoRecord(
          id: widget.record?.id ?? newRecordId('photo'),
          title: _title.text.trim(),
          description: _description.text.trim(),
          category: _category.text.trim(),
          location: _location.text.trim(),
          priceValue: double.tryParse(_price.text.trim()) ?? 0,
          type: _type,
          photo: _photo!,
          status: widget.record?.status ?? 'open',
        ),
      );
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    final record = widget.record;
    if (record == null) return;
    final api = SessionScope.apiOf(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this record?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ListingsRepository(api)
          .removePhotoRecord(widget.collection, record.id);
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final photo = _photo;
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.record == null ? 'New record' : 'Edit record'),
        actions: [
          if (widget.record != null)
            IconButton(
              tooltip: 'Delete',
              icon: const Icon(Icons.delete_outline),
              onPressed: _delete,
            ),
        ],
      ),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (photo != null && photo.contains(','))
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.memory(
                  base64Decode(photo.split(',').last),
                  height: 200,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(
                    height: 200,
                    child: Center(child: Text('Photo preview unavailable')),
                  ),
                ),
              ),
            OutlinedButton.icon(
              onPressed: _attach,
              icon: const Icon(Icons.photo_outlined),
              label: Text(photo == null ? 'Attach a photo' : 'Change photo'),
            ),
            const SizedBox(height: 12),
            if (widget.types.length > 1)
              DropdownButtonFormField<String>(
                initialValue: _type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: [
                  for (final type in widget.types)
                    DropdownMenuItem(value: type, child: Text(type)),
                ],
                onChanged: (value) =>
                    setState(() => _type = value ?? widget.types.first),
              )
            else
              Text('Type: $_type',
                  style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 12),
            TextFormField(
              controller: _title,
              decoration: const InputDecoration(labelText: 'Title'),
              validator: (value) =>
                  (value ?? '').trim().length >= 3 ? null : 'Add a title.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _description,
              decoration: const InputDecoration(labelText: 'Description'),
              minLines: 3,
              maxLines: 5,
              validator: (value) => (value ?? '').trim().length >= 20
                  ? null
                  : 'Describe it in at least 20 characters.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _category,
              decoration: const InputDecoration(labelText: 'Category'),
              validator: (value) =>
                  (value ?? '').trim().length >= 3 ? null : 'Add a category.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _location,
              decoration: const InputDecoration(labelText: 'Location'),
              validator: (value) =>
                  (value ?? '').trim().length >= 3 ? null : 'Add a location.',
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _price,
              decoration: const InputDecoration(
                labelText: 'Price value (GH₵, 0 if none)',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 8),
            const Text(
                'Only you can see this record. It syncs to your account.'),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: const Text('Save record'),
            ),
          ],
        ),
      ),
    );
  }
}
