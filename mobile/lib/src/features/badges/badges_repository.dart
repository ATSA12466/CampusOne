import 'package:flutter/material.dart';

import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';

class BadgeDefinition {
  BadgeDefinition({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.rule,
    required this.threshold,
  });

  final String id;
  final String name;
  final String description;
  final String icon;
  final String rule;
  final int threshold;

  IconData get iconData {
    switch (icon) {
      case 'groups':
        return Icons.groups_outlined;
      case 'explore':
        return Icons.explore_outlined;
      case 'verified':
      default:
        return Icons.verified_outlined;
    }
  }

  factory BadgeDefinition.fromJson(Map<String, dynamic> json) => BadgeDefinition(
    id: asString(json['id']),
    name: asString(json['name']),
    description: asString(json['description']),
    icon: asString(json['icon']),
    rule: asString(json['rule']),
    threshold: asInt(json['threshold']),
  );
}

class BadgeAward {
  BadgeAward({
    required this.id,
    required this.badgeId,
    required this.awardedAt,
    this.badge,
  });

  final String id;
  final String badgeId;
  final String awardedAt;
  final BadgeDefinition? badge;

  factory BadgeAward.fromJson(Map<String, dynamic> json) {
    final raw = json['badge'];
    return BadgeAward(
      id: asString(json['id']),
      badgeId: asString(json['badgeId']),
      awardedAt: asString(json['awardedAt']),
      badge: raw is Map<String, dynamic>
          ? BadgeDefinition.fromJson(raw)
          : null,
    );
  }
}

class BadgesRepository {
  BadgesRepository(this._api);

  final ApiClient _api;

  Future<List<BadgeDefinition>> definitions() async {
    final json = await _api.get(ApiPaths.badgeDefinitions);
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(BadgeDefinition.fromJson)
        .toList();
  }

  Future<List<BadgeAward>> mine() async {
    final json = await _api.get(ApiPaths.badges);
    final items = asMap(json)['items'];
    if (items is! List) return [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(BadgeAward.fromJson)
        .toList();
  }
}
