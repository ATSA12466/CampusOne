import 'package:campusone/src/app/app_shell.dart';
import 'package:campusone/src/demo/demo_campus_modules.dart';
import 'package:campusone/src/demo/demo_campus_services.dart';
import 'package:campusone/src/demo/demo_market_profile.dart';
import 'package:campusone/src/demo/demo_store.dart';
import 'package:campusone/src/demo/demo_student_tools.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('student demo screens do not overflow on narrow phones',
      (tester) async {
    for (final width in [320.0, 360.0, 430.0]) {
      tester.view.physicalSize = Size(width, 900);
      tester.view.devicePixelRatio = 1;

      final store = DemoStore();
      await _pumpAndCheck(tester, DemoClubsScreen(store: store));
      await _scrollAndCheck(tester);
      await _pumpAndCheck(tester, DemoSrcOfficeScreen(store: store));
      await _scrollAndCheck(tester);
      await _pumpAndCheck(
          tester,
          DemoMoreScreen(
            store: store,
            onLogout: () {},
            onProfile: () {},
          ));
      await _scrollAndCheck(tester);

      await _pumpAndCheck(tester, const DemoHostelsScreen());
      await _scrollAndCheck(tester);
      await _pumpAndCheck(tester, const DemoMarketScreen());
      await _scrollAndCheck(tester);
      await _pumpAndCheck(tester, const DemoClassRepScreen());
      await _scrollAndCheck(tester);

      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    }
  });
}

Future<void> _pumpAndCheck(WidgetTester tester, Widget screen) async {
  await tester.pumpWidget(MaterialApp(home: screen));
  await tester.pump(const Duration(milliseconds: 100));
  await _checkCurrentLayout(tester);
}

Future<void> _scrollAndCheck(WidgetTester tester) async {
  for (var index = 0; index < 12; index++) {
    final lists = find.byType(ListView).hitTestable();
    if (lists.evaluate().isEmpty) return;
    final list = lists.first;
    await tester.drag(list, const Offset(0, -700));
    await tester.pump(const Duration(milliseconds: 50));
    await _checkCurrentLayout(tester);
  }
}

Future<void> _checkCurrentLayout(WidgetTester tester) async {
  final exception = tester.takeException();
  final details = exception is FlutterError
      ? exception.diagnostics.map((node) => node.toStringDeep()).join('\n')
      : '$exception';
  expect(exception, isNull,
      reason: 'A screen produced a Flutter layout error: $details');
}
