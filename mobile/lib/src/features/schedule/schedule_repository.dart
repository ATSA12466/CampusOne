import '../../core/api/api_client.dart';
import '../../core/api/api_paths.dart';
import '../../core/auth/auth_session.dart';
import '../../core/store/personal_store.dart';

/// A class meeting: public catalog sessions and personal classes share
/// the same shape on both clients.
class ClassSession {
  ClassSession({
    required this.id,
    required this.day,
    required this.course,
    required this.start,
    required this.end,
    required this.venue,
    this.mine = false,
  });

  final String id;
  final String day;
  final String course;
  final String start;
  final String end;
  final String venue;
  final bool mine;

  factory ClassSession.fromJson(Map<String, dynamic> json, {bool mine = false}) =>
      ClassSession(
        id: asString(json['id']),
        day: asString(json['day']),
        course: asString(json['course']),
        start: asString(json['start']),
        end: asString(json['end']),
        venue: asString(json['venue']),
        mine: mine,
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'day': day,
    'course': course,
    'start': start,
    'end': end,
    'venue': venue,
  };
}

class PersonalPlan {
  PersonalPlan({
    required this.id,
    required this.title,
    required this.date,
    required this.start,
    required this.end,
    required this.venue,
  });

  final String id;
  final String title;
  final String date;
  final String start;
  final String end;
  final String venue;

  factory PersonalPlan.fromJson(Map<String, dynamic> json) => PersonalPlan(
    id: asString(json['id']),
    title: asString(json['title']),
    date: asString(json['date']),
    start: asString(json['start']),
    end: asString(json['end']),
    venue: asString(json['venue']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'date': date,
    'start': start,
    'end': end,
    'venue': venue,
  };
}

class ScheduleRepository {
  ScheduleRepository(ApiClient api)
    : _api = api,
      _store = PersonalStoreRepository(api);

  final ApiClient _api;
  final PersonalStoreRepository _store;

  Future<List<ClassSession>> catalogSessions() async {
    final json = await _api.get(
      ApiPaths.catalog('timetable'),
      query: {'pageSize': '30'},
    );
    return asList(
      asMap(json)['items'],
    ).map((item) => ClassSession.fromJson(item)).toList();
  }

  Future<List<ClassSession>> myClasses() async =>
      (await _store.list('sessions'))
          .map((item) => ClassSession.fromJson(item, mine: true))
          .toList();

  Future<ClassSession> saveClass(ClassSession session) async =>
      ClassSession.fromJson(
        await _store.put('sessions', session.toJson()),
        mine: true,
      );

  Future<bool> removeClass(String id) => _store.remove('sessions', id);

  Future<List<PersonalPlan>> myPlans() async =>
      (await _store.list('plans')).map(PersonalPlan.fromJson).toList();

  Future<PersonalPlan> savePlan(PersonalPlan plan) async =>
      PersonalPlan.fromJson(await _store.put('plans', plan.toJson()));

  Future<bool> removePlan(String id) => _store.remove('plans', id);
}
