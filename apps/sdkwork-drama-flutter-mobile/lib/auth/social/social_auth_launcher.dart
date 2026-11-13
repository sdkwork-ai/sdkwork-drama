import 'package:url_launcher/url_launcher.dart';

abstract interface class SocialAuthLauncher {
  Future<bool> open(Uri authorizationUrl);
}

class BrowserSocialAuthLauncher implements SocialAuthLauncher {
  const BrowserSocialAuthLauncher();

  @override
  Future<bool> open(Uri authorizationUrl) {
    return launchUrl(authorizationUrl, mode: LaunchMode.externalApplication);
  }
}
