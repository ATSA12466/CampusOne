/// Date helpers shared by the home, calendar and timetable screens.
///
/// CampusOne is an Accra campus: Accra is UTC+0 year round, so "campus time"
/// is simply UTC. All helpers take the clock as an argument so screens stay
/// testable and consistent with the web's `useHomeClock` behaviour.
library;

const List<String> _weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const List<String> _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

DateTime campusNow() => DateTime.now().toUtc();

/// 1 = Monday … 7 = Sunday (matches `DateTime.weekday`).
int weekdayIndexOf(String day) {
  final key = day.trim().toLowerCase();
  for (var index = 0; index < _weekdays.length; index++) {
    final name = _weekdays[index].toLowerCase();
    if (key == name || key.startsWith(name.substring(0, 3))) return index + 1;
  }
  return 0;
}

String weekdayName(int weekday) =>
    weekday >= 1 && weekday <= 7 ? _weekdays[weekday - 1] : '';

DateTime? parseCampusDate(String? value) {
  final raw = (value ?? '').trim();
  if (raw.isEmpty) return null;
  final parsed = DateTime.tryParse(raw);
  if (parsed == null) return null;
  return DateTime.utc(parsed.year, parsed.month, parsed.day);
}

DateTime campusToday([DateTime? now]) {
  final clock = now ?? campusNow();
  return DateTime.utc(clock.year, clock.month, clock.day);
}

/// "Wednesday, 15 October" — the web welcome header line.
String longDateLabel(DateTime date) =>
    '${weekdayName(date.weekday)}, ${date.day} ${_months[date.month - 1]}';

/// "Today" / "Tomorrow" / "Monday 20 October" — the web `relativeCampusDay`.
String relativeDayLabel(DateTime date, [DateTime? now]) {
  final today = campusToday(now);
  final target = DateTime.utc(date.year, date.month, date.day);
  final difference = target.difference(today).inDays;
  if (difference == 0) return 'Today';
  if (difference == 1) return 'Tomorrow';
  if (difference == -1) return 'Yesterday';
  final weekday = weekdayName(target.weekday);
  if (difference > 1 && difference < 7) {
    return '$weekday ${target.day} ${_months[target.month - 1]}';
  }
  return '${target.day} ${_months[target.month - 1]}';
}

/// Minutes since midnight for an "HH:MM" string, or null when unparseable.
int? minutesOfDay(String value) {
  final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(value.trim());
  if (match == null) return null;
  final hours = int.tryParse(match.group(1)!);
  final minutes = int.tryParse(match.group(2)!);
  if (hours == null || minutes == null) return null;
  return hours * 60 + minutes;
}

/// "in 2h 15m" / "now" / "starts 14:00" — compact next-class timing.
String startsInLabel(String start, [DateTime? now]) {
  final startMinutes = minutesOfDay(start);
  if (startMinutes == null) return '';
  final clock = now ?? campusNow();
  final nowMinutes = clock.hour * 60 + clock.minute;
  final delta = startMinutes - nowMinutes;
  if (delta <= 0) return 'in progress';
  if (delta < 60) return 'in ${delta}m';
  final hours = delta ~/ 60;
  final minutes = delta % 60;
  return minutes == 0 ? 'in ${hours}h' : 'in ${hours}h ${minutes}m';
}
