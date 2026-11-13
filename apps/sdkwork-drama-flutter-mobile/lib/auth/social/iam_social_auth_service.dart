import 'package:sdkwork_iam_app_sdk/sdkwork_iam_app_sdk.dart';

import 'social_auth_service.dart';
import 'social_provider.dart';

/// IAM owns provider credentials and callback exchange. The client only asks
/// for the enabled provider projection and an authorization URL.
class IamSocialAuthService implements SocialAuthService {
  IamSocialAuthService({
    required this.client,
    required this.enabledProviderIds,
    required this.providerLabels,
    required this.redirectUri,
    this.scopes = const <String>[],
  });

  final SdkworkAppClient client;
  final List<String> enabledProviderIds;
  final Map<String, String> providerLabels;
  final String redirectUri;
  final List<String> scopes;

  @override
  Future<List<SocialProvider>> availableProviders() async {
    try {
      final SdkWorkListResponse? response = await client.oauth.providersList(1, 100);
      final List<String> backendIds = _providerCodes(response?.data);
      return resolveSocialProviders(
        backendProviderIds: backendIds,
        enabledProviderIds: enabledProviderIds,
        labels: providerLabels,
      );
    } catch (error) {
      throw SocialAuthException('Unable to load social providers: $error');
    }
  }

  @override
  Future<Uri> authorizationUrl(String providerId) async {
    SocialProvider? provider;
    for (final SocialProvider candidate in socialProviderCatalog) {
      if (candidate.matches(providerId)) {
        provider = candidate;
        break;
      }
    }
    if (provider == null) {
      throw SocialAuthException('Unknown social provider: $providerId');
    }

    try {
      final SdkWorkResourceResponse? response =
          await client.oauth.authorizationUrlsCreate(<String, dynamic>{
        'providerCode': provider.id,
        'redirectUri': redirectUri,
        'state': DateTime.now().microsecondsSinceEpoch.toString(),
        if (scopes.isNotEmpty) 'scopes': scopes,
      });
      final String? rawUrl = _findString(
        response?.data,
        <String>['authorizationUrl', 'authorization_url', 'url'],
      );
      if (rawUrl == null || rawUrl.trim().isEmpty) {
        throw const SocialAuthException('IAM did not return an authorization URL.');
      }
      final Uri? uri = Uri.tryParse(rawUrl);
      if (uri == null || !uri.hasScheme) {
        throw const SocialAuthException('IAM returned an invalid authorization URL.');
      }
      return uri;
    } on SocialAuthException {
      rethrow;
    } catch (error) {
      throw SocialAuthException('Unable to start ${provider.label} sign-in: $error');
    }
  }

  List<String> _providerCodes(dynamic data) {
    final List<dynamic> items = _listItems(data);
    final List<String> codes = <String>[];
    for (final dynamic item in items) {
      if (item is Map) {
        final String? code = _findString(
          item,
          <String>['providerCode', 'provider_code', 'code', 'id'],
        );
        if (code != null) codes.add(code);
      }
    }
    return codes;
  }

  List<dynamic> _listItems(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      for (final String key in <String>['items', 'records', 'list', 'data']) {
        final dynamic nested = data[key];
        if (nested is List) return nested;
      }
    }
    return const <dynamic>[];
  }

  String? _findString(dynamic value, List<String> keys) {
    if (value is! Map) {
      if (value is List) {
        for (final dynamic item in value) {
          final String? found = _findString(item, keys);
          if (found != null) return found;
        }
      }
      return null;
    }
    for (final String key in keys) {
      final dynamic candidate = value[key];
      if (candidate is String && candidate.trim().isNotEmpty) return candidate;
    }
    for (final dynamic nested in value.values) {
      final String? found = _findString(nested, keys);
      if (found != null) return found;
    }
    return null;
  }
}
