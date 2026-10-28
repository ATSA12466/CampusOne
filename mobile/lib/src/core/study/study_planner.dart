/// Rule-based study planner, ported from the web's `lib/study/planner`
/// (no AI service involved on either client).
class StudyPlannerInput {
  StudyPlannerInput({
    required this.course,
    required this.weekStart,
    required this.days,
    required this.start,
    required this.duration,
    required this.breakMinutes,
    required this.goal,
  });

  final String course;
  final String weekStart; // yyyy-MM-dd
  final List<String> days; // Sunday..Saturday
  final String start; // HH:mm
  final int duration; // minutes
  final int breakMinutes;
  final String goal; // Mixed, Revision, Practice, Recall & reflect
}

class StudySessionPlan {
  StudySessionPlan({
    required this.date,
    required this.start,
    required this.end,
    required this.breakUntil,
    required this.focus,
  });

  final String date;
  final String start;
  final String end;
  final String breakUntil;
  final String focus;

  Map<String, dynamic> toJson() => {
    'date': date,
    'start': start,
    'end': end,
    'breakUntil': breakUntil,
    'focus': focus,
  };

  factory StudySessionPlan.fromJson(Map<String, dynamic> json) =>
      StudySessionPlan(
        date: json['date'] as String? ?? '',
        start: json['start'] as String? ?? '',
        end: json['end'] as String? ?? '',
        breakUntil: json['breakUntil'] as String? ?? '',
        focus: json['focus'] as String? ?? '',
      );
}

const studyWeekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

int _minutes(String time) =>
    int.parse(time.substring(0, 2)) * 60 + int.parse(time.substring(3, 5));

String _time(int value) =>
    '${(value ~/ 60).toString().padLeft(2, '0')}:${(value % 60).toString().padLeft(2, '0')}';

List<StudySessionPlan> buildStudySessions(StudyPlannerInput input) {
  final result = <StudySessionPlan>[];
  final base = DateTime.parse('${input.weekStart}T12:00:00Z');
  const focuses = ['Revision', 'Practice', 'Recall & reflect'];
  for (var offset = 0; offset < 7; offset++) {
    final date = base.add(Duration(days: offset));
    if (!input.days.contains(studyWeekdays[date.weekday % 7])) continue;
    result.add(
      StudySessionPlan(
        date: date.toIso8601String().substring(0, 10),
        start: input.start,
        end: _time(_minutes(input.start) + input.duration),
        breakUntil: _time(
          _minutes(input.start) + input.duration + input.breakMinutes,
        ),
        focus: input.goal == 'Mixed'
            ? focuses[result.length % focuses.length]
            : input.goal,
      ),
    );
  }
  return result;
}

/// Monday of next week, yyyy-MM-dd.
String nextStudyWeek([DateTime? now]) {
  final base = now ?? DateTime.now();
  final next = base.add(Duration(days: (8 - base.weekday) % 7));
  return next.toIso8601String().substring(0, 10);
}
