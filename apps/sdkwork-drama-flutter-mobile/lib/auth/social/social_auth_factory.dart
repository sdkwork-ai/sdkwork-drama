import 'package:sdkwork_iam_app_sdk/sdkwork_iam_app_sdk.dart';

import 'iam_social_auth_service.dart';
import 'social_auth_service.dart';
import 'social_login_config.dart';

const String _apiBaseUrl = String.fromEnvironment('SDKWORK_API_BASE_URL');

SocialAuthService? createIamSocialAuthService() {
  if (_apiBaseUrl.trim().isEmpty) return null;
  final SdkworkAppClient client = SdkworkAppClient.withBaseUrl(baseUrl: _apiBaseUrl);
  return IamSocialAuthService(
    client: client,
    enabledProviderIds: socialLoginEnabledProviderIds,
    providerLabels: socialLoginProviderLabels,
    redirectUri: socialLoginRedirectUri,
  );
}
