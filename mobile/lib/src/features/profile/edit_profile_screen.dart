import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart';
import '../../core/media/media.dart';
import '../../core/photos/app_photos.dart';
import '../../core/store/personal_store.dart';
import '../../core/widgets/states.dart';

/// Edits the signed-in profile. Name/programme/level go to the account
/// record (`PATCH /api/users/me`); bio/interests/visibility go to the
/// account-synced `profile` store row, mirroring the web profile editor.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

const _levels = [
  'Level 100',
  'Level 200',
  'Level 300',
  'Level 400',
  'Postgraduate',
];

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _programme = TextEditingController();
  final _bio = TextEditingController();
  final _interests = TextEditingController();
  String? _level;
  String? _photo;
  String _visibility = 'private';
  bool _showProgramme = true;
  bool _busy = false;
  bool _loading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _prefill();
  }

  @override
  void dispose() {
    _name.dispose();
    _programme.dispose();
    _bio.dispose();
    _interests.dispose();
    super.dispose();
  }

  Future<void> _prefill() async {
    final user = SessionScope.sessionOf(context).user;
    if (user != null) {
      _name.text = user.name;
      _programme.text = user.programme;
      if (_levels.contains(user.level)) _level = user.level;
    }
    try {
      final rows = await PersonalStoreRepository(
        SessionScope.apiOf(context),
      ).list('profile');
      final matches = rows.where((r) => r['id'] == 'profile');
      final row = matches.isEmpty ? null : matches.first;
      if (row != null && mounted) {
        final photo = asString(row['photo']);
        _photo = photo.isEmpty ? null : photo;
        _bio.text = asString(row['bio']);
        _interests.text = asString(row['interests']);
        final visibility = asString(row['visibility']);
        if (visibility == 'campus-preview' || visibility == 'private') {
          _visibility = visibility;
        }
        _showProgramme = asString(row['showProgramme']) != 'no';
      }
    } on ApiException {
      // Prefill is best-effort; the account record above is enough to edit.
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _pickPhoto() async {
    try {
      final photo = await AppPhotos.chooseDataUrl(context);
      if (photo != null && mounted) setState(() => _photo = photo);
    } on PhotoTooLarge catch (error) {
      if (mounted) showAppMessage(context, error.toString(), error: true);
    } catch (_) {
      if (mounted) {
        showAppMessage(context, 'That photo could not be read.', error: true);
      }
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _busy) return;
    if (_photo != null &&
        (_programme.text.trim().length < 2 || _level == null)) {
      showAppMessage(
        context,
        'Choose a programme and level before saving a profile photo.',
        error: true,
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final session = SessionScope.sessionOf(context);
      final api = SessionScope.apiOf(context);
      await session.updateProfile(
        name: _name.text.trim(),
        programme: _programme.text.trim(),
        level: _level ?? '',
      );
      // The store row requires every field; skip it when the account
      // record legitimately leaves programme/level blank.
      if (_programme.text.trim().length >= 2 && _level != null) {
        await PersonalStoreRepository(api).put(
          'profile',
          {
            'id': 'profile',
            'name': _name.text.trim(),
            'programme': _programme.text.trim(),
            'level': _level,
            'bio': _bio.text.trim(),
            'interests': _interests.text.trim(),
            'visibility': _visibility,
            'showProgramme': _showProgramme ? 'yes' : 'no',
            if (_photo != null) 'photo': _photo,
          },
        );
      }
      if (mounted) {
        showAppMessage(context, 'Profile updated.');
        Navigator.of(context).pop();
      }
    } on ApiException catch (error) {
      if (mounted) showAppMessage(context, error.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _form,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _name,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(
                      labelText: 'Preferred name',
                    ),
                    maxLength: 80,
                    validator: (value) =>
                        (value == null || value.trim().length < 2)
                            ? 'Add your preferred name.'
                            : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _programme,
                    textInputAction: TextInputAction.next,
                    decoration: const InputDecoration(labelText: 'Programme'),
                    maxLength: 120,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _level,
                    decoration: const InputDecoration(labelText: 'Level'),
                    items: [
                      for (final level in _levels)
                        DropdownMenuItem(value: level, child: Text(level)),
                    ],
                    onChanged: (value) => setState(() => _level = value),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Profile photo',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              CampusAvatar(
                                name: _name.text.trim().isEmpty
                                    ? 'You'
                                    : _name.text.trim(),
                                image: CampusMedia.tryParse(
                                  _photo,
                                  alt: 'Your profile photo',
                                ),
                                size: 56,
                              ),
                              const SizedBox(width: 12),
                              OutlinedButton.icon(
                                onPressed: _busy ? null : _pickPhoto,
                                icon: const Icon(Icons.photo_library_outlined),
                                label: Text(
                                  _photo == null
                                      ? 'Choose photo'
                                      : 'Change photo',
                                ),
                              ),
                              if (_photo != null)
                                TextButton(
                                  onPressed: _busy
                                      ? null
                                      : () => setState(() => _photo = null),
                                  child: const Text('Remove'),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Stored with your account profile. Use only a photo '
                            'you are comfortable sharing with this service.',
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _bio,
                    decoration: const InputDecoration(labelText: 'About you'),
                    minLines: 2,
                    maxLines: 4,
                    maxLength: 500,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _interests,
                    decoration: const InputDecoration(
                      labelText: 'Interests',
                      hintText: 'Music, football, robotics…',
                    ),
                    maxLength: 240,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _visibility,
                    decoration: const InputDecoration(labelText: 'Visibility'),
                    items: const [
                      DropdownMenuItem(
                        value: 'private',
                        child: Text('Private'),
                      ),
                      DropdownMenuItem(
                        value: 'campus-preview',
                        child: Text('Campus preview'),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => _visibility = value ?? 'private'),
                  ),
                  SwitchListTile(
                    title: const Text('Show programme on your profile card'),
                    value: _showProgramme,
                    onChanged: (value) =>
                        setState(() => _showProgramme = value),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: _busy ? null : _save,
                    child: _busy
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Save changes'),
                  ),
                ],
              ),
            ),
    );
  }
}
