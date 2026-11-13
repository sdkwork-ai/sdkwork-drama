import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_drama_flutter_mobile/app.dart';

void main() {
  testWidgets('renders the SDKWork foundation shell', (WidgetTester tester) async {
    await tester.pumpWidget(const SdkworkApp());
    expect(find.text(appName), findsWidgets);
    expect(find.text('SDKWORK APPLICATION FOUNDATION'), findsOneWidget);
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
