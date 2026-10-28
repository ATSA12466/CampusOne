import '../../core/api/api_client.dart';
import '../../core/auth/auth_session.dart' show asInt, asString;
import '../../core/store/personal_store.dart';

class GradeEntry {
  GradeEntry({
    required this.id,
    required this.course,
    required this.term,
    required this.credits,
    required this.points,
  });

  final String id;
  final String course;
  final String term;
  final int credits;
  final double points;

  factory GradeEntry.fromJson(Map<String, dynamic> json) => GradeEntry(
    id: asString(json['id']),
    course: asString(json['course']),
    term: asString(json['term']),
    credits: asInt(json['credits']),
    points: json['points'] is num ? (json['points'] as num).toDouble() : 0,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'course': course,
    'term': term,
    'credits': credits,
    'points': points,
  };
}

class StudyNote {
  StudyNote({
    required this.id,
    required this.course,
    required this.title,
    required this.body,
    required this.createdAt,
  });

  final String id;
  final String course;
  final String title;
  final String body;
  final String createdAt;

  factory StudyNote.fromJson(Map<String, dynamic> json) => StudyNote(
    id: asString(json['id']),
    course: asString(json['course']),
    title: asString(json['title']),
    body: asString(json['body']),
    createdAt: asString(json['createdAt']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'course': course,
    'title': title,
    'body': body,
    'createdAt': createdAt,
  };
}

class AcademicToolsRepository {
  AcademicToolsRepository(ApiClient api)
    : _store = PersonalStoreRepository(api);

  final PersonalStoreRepository _store;

  Future<List<GradeEntry>> grades() async =>
      (await _store.list('grades')).map(GradeEntry.fromJson).toList();

  Future<GradeEntry> saveGrade(GradeEntry entry) async =>
      GradeEntry.fromJson(await _store.put('grades', entry.toJson()));

  Future<bool> removeGrade(String id) => _store.remove('grades', id);

  Future<List<StudyNote>> notes() async =>
      (await _store.list('notes')).map(StudyNote.fromJson).toList();

  Future<StudyNote> saveNote(StudyNote note) async =>
      StudyNote.fromJson(await _store.put('notes', note.toJson()));

  Future<bool> removeNote(String id) => _store.remove('notes', id);
}

/// Credit-weighted GPA on the 0–4 scale (same as web `weightedGpa`).
({double? gpa, int credits}) weightedGpa(List<GradeEntry> rows) {
  var points = 0.0;
  var credits = 0;
  for (final row in rows) {
    points += row.points * row.credits;
    credits += row.credits;
  }
  return (gpa: credits == 0 ? null : points / credits, credits: credits);
}
