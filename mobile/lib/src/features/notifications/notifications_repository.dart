import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';

class AppNotification {
  AppNotification({
    required this.id,
    required this.kind,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.read,
  });

  final String id;
  final String kind;
  final String title;
  final String body;
  final String createdAt;
  final bool read;

  IconData get iconData {
    switch (kind) {
      case 'event':
        return Icons.event_outlined;
      case 'club':
        return Icons.groups_outlined;
      case 'badge':
        return Icons.verified_outlined;
      case 'message':
        return Icons.forum_outlined;
      case 'announcement':
        return Icons.campaign_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) =>
      AppNotification(
        id: asString(json['id']),
        kind: asString(json['kind']),
        title: asString(json['title']),
        body: asString(json['body']),
        createdAt: asString(json['createdAt']),
        read: asString(json['readAt']).isNotEmpty,
      );
}

class NotificationFeed {
  NotificationFeed({required this.items, required this.unread});

  final List<AppNotification> items;
  final int unread;
}

class NotificationsRepository {
  NotificationsRepository(this._api);

  final ApiClient _api;

  Future<NotificationFeed> feed() async {
    final json = await _api.get(ApiPaths.notifications);
    final root = asMap(json);
    final items = root['items'];
    return NotificationFeed(
      items: items is List
          ? items
                .whereType<Map<String, dynamic>>()
                .map(AppNotification.fromJson)
                .toList()
          : const [],
      unread: asInt(root['unread']),
    );
  }

  Future<List<AppNotification>> list() async => (await feed()).items;

  Future<void> markAllRead() =>
      _api.patch(ApiPaths.notifications, body: {'ids': 'all'});

  Future<void> markRead(String id) =>
      _api.patch(ApiPaths.notifications, body: {
        'ids': [id],
      });
}
