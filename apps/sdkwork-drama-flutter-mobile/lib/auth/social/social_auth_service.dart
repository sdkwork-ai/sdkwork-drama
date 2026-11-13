import 'social_provider.dart';

abstract interface class SocialAuthService {
  Future<List<SocialProvider>> availableProviders();

  Future<Uri> authorizationUrl(String providerId);
}

class SocialAuthException implements Exception {
  const SocialAuthException(this.message);

  final String message;

  @override
  String toString() => message;
}
