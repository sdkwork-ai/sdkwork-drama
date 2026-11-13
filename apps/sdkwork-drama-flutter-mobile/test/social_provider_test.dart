import 'package:flutter_test/flutter_test.dart';
import 'package:sdkwork_drama_flutter_mobile/auth/social/social_provider.dart';

void main() {
  test('renders only providers enabled by both IAM discovery and the client', () {
    final List<SocialProvider> providers = resolveSocialProviders(
      backendProviderIds: <String>['facebook', 'google', 'github'],
      enabledProviderIds: <String>['apple', 'meta', 'google', 'wechat'],
      labels: <String, String>{'meta': 'Meta'},
    );

    expect(providers.map((SocialProvider provider) => provider.id), <String>['google', 'meta']);
    expect(providers.last.label, 'Meta');
  });

  test('resolves aliases without provider-specific branches', () {
    final List<SocialProvider> providers = resolveSocialProviders(
      backendProviderIds: <String>['twitter', 'weixin'],
      enabledProviderIds: <String>['x', 'wechat'],
      labels: const <String, String>{},
    );

    expect(providers.map((SocialProvider provider) => provider.id), <String>['x', 'wechat']);
  });

  test('ignores unknown providers and keeps catalog order', () {
    final List<SocialProvider> providers = resolveSocialProviders(
      backendProviderIds: <String>['github', 'apple', 'unknown'],
      enabledProviderIds: <String>['unknown', 'github', 'apple'],
      labels: const <String, String>{},
    );

    expect(providers.map((SocialProvider provider) => provider.id), <String>['apple', 'github']);
  });
}
