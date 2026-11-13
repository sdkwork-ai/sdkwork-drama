import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';
import 'social_auth_launcher.dart';
import 'social_auth_service.dart';
import 'social_provider.dart';

class SocialLoginPanel extends StatefulWidget {
  const SocialLoginPanel({
    super.key,
    required this.service,
    required this.launcher,
    this.onAuthorizationUri,
  });

  final SocialAuthService? service;
  final SocialAuthLauncher launcher;
  final ValueChanged<Uri>? onAuthorizationUri;

  @override
  State<SocialLoginPanel> createState() => _SocialLoginPanelState();
}

class _SocialLoginPanelState extends State<SocialLoginPanel> {
  Future<List<SocialProvider>>? _providers;
  String? _message;
  String? _busyProviderId;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    if (widget.service == null) {
      _providers = null;
      return;
    }
    _providers = widget.service!.availableProviders();
  }

  Future<void> _authorize(SocialProvider provider) async {
    final SocialAuthService? service = widget.service;
    if (service == null) return;
    setState(() {
      _busyProviderId = provider.id;
      _message = null;
    });
    try {
      final Uri uri = await service.authorizationUrl(provider.id);
      final bool opened = await widget.launcher.open(uri);
      widget.onAuthorizationUri?.call(uri);
      if (mounted && !opened) {
        setState(() => _message = 'A browser could not be opened for ${provider.label}.');
      }
    } catch (error) {
      if (mounted) {
        setState(() => _message = error.toString());
      }
    } finally {
      if (mounted) {
        setState(() => _busyProviderId = null);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: kSurface,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'SOCIAL SIGN-IN',
            style: theme.textTheme.labelSmall?.copyWith(
              color: kTechBlue,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.3,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Continue with an open platform',
            style: theme.textTheme.titleMedium?.copyWith(
              color: kInk,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Provider availability is projected by IAM; the client only renders the enabled providers.',
            style: theme.textTheme.bodySmall?.copyWith(color: kMuted, height: 1.5),
          ),
          const SizedBox(height: 14),
          if (widget.service == null)
            Text(
              'IAM endpoint is not configured. Set SDKWORK_API_BASE_URL to enable social sign-in.',
              style: theme.textTheme.bodySmall?.copyWith(color: kWarning),
            )
          else
            FutureBuilder<List<SocialProvider>>(
              future: _providers,
              builder: (BuildContext context, AsyncSnapshot<List<SocialProvider>> snapshot) {
                if (snapshot.connectionState != ConnectionState.done) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: LinearProgressIndicator(minHeight: 2, color: kTechBlue),
                  );
                }
                if (snapshot.hasError) {
                  return Text(
                    snapshot.error.toString(),
                    style: theme.textTheme.bodySmall?.copyWith(color: kWarning),
                  );
                }
                final List<SocialProvider> providers =
                    snapshot.data ?? const <SocialProvider>[];
                if (providers.isEmpty) {
                  return Text(
                    'No social provider is enabled by both IAM and this client.',
                    style: theme.textTheme.bodySmall?.copyWith(color: kMuted),
                  );
                }
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: providers
                      .map((SocialProvider provider) => _ProviderButton(
                            provider: provider,
                            busy: _busyProviderId == provider.id,
                            disabled: _busyProviderId != null,
                            onPressed: () => _authorize(provider),
                          ))
                      .toList(growable: false),
                );
              },
            ),
          if (_message != null) ...<Widget>[
            const SizedBox(height: 10),
            Text(
              _message!,
              style: theme.textTheme.bodySmall?.copyWith(color: kWarning),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProviderButton extends StatelessWidget {
  const _ProviderButton({
    required this.provider,
    required this.busy,
    required this.disabled,
    required this.onPressed,
  });

  final SocialProvider provider;
  final bool busy;
  final bool disabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: disabled ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: kInk,
        backgroundColor: kSurfaceAlt,
        side: BorderSide.none,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Color(provider.accent),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Text(
              provider.mark,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            busy ? 'Opening…' : provider.label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
