import 'package:flutter/material.dart';

import 'auth/social/social_auth_factory.dart';
import 'auth/social/social_auth_launcher.dart';
import 'auth/social/social_login_panel.dart';
import 'composition/architecture_registry.dart';
import 'composition/component_registry.dart';
import 'theme/app_theme.dart';

const String appName = 'SDKWork Drama';
const String appCode = 'sdkwork-drama';
const String appDescription = 'Short-drama (短剧) video creation application: episode authoring, media assets, publishing, and playback.';

class SdkworkApp extends StatelessWidget {
  const SdkworkApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: appName,
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const FoundationHomePage(),
    );
  }
}

class FoundationHomePage extends StatefulWidget {
  const FoundationHomePage({super.key});

  @override
  State<FoundationHomePage> createState() => _FoundationHomePageState();
}

class _FoundationHomePageState extends State<FoundationHomePage> {
  static const List<String> _titles = <String>[
    'Overview',
    'Surfaces',
    'Components',
    'Me',
  ];

  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final int linked = integratedComponents
        .where((IntegratedComponent component) => component.supported)
        .length;
    final int planned = integratedComponents.length - linked;

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: <Widget>[
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                'Flutter',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: kTechBlueStrong,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _index,
        children: <Widget>[
          _overviewTab(context, linked, planned),
          _surfacesTab(context),
          _componentsTab(context, linked, planned),
          _meTab(context),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (int index) => setState(() => _index = index),
        destinations: const <NavigationDestination>[
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Overview',
          ),
          NavigationDestination(
            icon: Icon(Icons.layers_outlined),
            selectedIcon: Icon(Icons.layers),
            label: 'Surfaces',
          ),
          NavigationDestination(
            icon: Icon(Icons.widgets_outlined),
            selectedIcon: Icon(Icons.widgets),
            label: 'Components',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Me',
          ),
        ],
      ),
    );
  }

  Widget _overviewTab(BuildContext context, int linked, int planned) {
    final ThemeData theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      children: <Widget>[
        Text(
          'SDKWORK APPLICATION FOUNDATION',
          style: theme.textTheme.labelSmall?.copyWith(
            color: kTechBlue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          appName,
          style: theme.textTheme.headlineSmall?.copyWith(
            color: kInk,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          appDescription,
          style: theme.textTheme.bodyMedium?.copyWith(color: kMuted),
        ),
        const SizedBox(height: 20),
        Row(
          children: <Widget>[
            _StatTile(label: 'Architectures', value: '${architectureRoots.length}'),
            const SizedBox(width: 10),
            _StatTile(label: 'Linked', value: '$linked'),
            const SizedBox(width: 10),
            _StatTile(label: 'Plan', value: '$planned'),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Foundation status',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: kInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'The initial delivery boundary is visible and explicit.',
                  style: theme.textTheme.bodySmall?.copyWith(color: kMuted),
                ),
                const SizedBox(height: 14),
                const _StatusRow(
                  title: 'Repository baseline',
                  subtitle: 'Canon, identity, workspace metadata, and root layout',
                  status: 'Ready',
                ),
                const _StatusRow(
                  title: 'Architecture surface',
                  subtitle: 'Flutter root with composition and component registry',
                  status: 'Ready',
                ),
                const _StatusRow(
                  title: 'First vertical workflow',
                  subtitle: 'Requirements, API contracts, and package modules',
                  status: 'Next',
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _surfacesTab(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      children: <Widget>[
        Text(
          'SDKWORK APPLICATION FOUNDATION',
          style: theme.textTheme.labelSmall?.copyWith(
            color: kTechBlue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Application surfaces',
          style: theme.textTheme.headlineSmall?.copyWith(
            color: kInk,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Each architecture keeps its own root, manifest, and toolchain.',
          style: theme.textTheme.bodyMedium?.copyWith(color: kMuted),
        ),
        const SizedBox(height: 16),
        ...architectureRoots.map(
          (ArchitectureRoot root) => _SurfaceRow(root: root),
        ),
      ],
    );
  }

  Widget _componentsTab(BuildContext context, int linked, int planned) {
    final ThemeData theme = Theme.of(context);
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      children: <Widget>[
        Text(
          'SDKWORK APPLICATION FOUNDATION',
          style: theme.textTheme.labelSmall?.copyWith(
            color: kTechBlue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Component composition',
          style: theme.textTheme.headlineSmall?.copyWith(
            color: kInk,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$linked linked · $planned planned · resolved from sibling SDK manifests.',
          style: theme.textTheme.bodyMedium?.copyWith(color: kMuted),
        ),
        const SizedBox(height: 16),
        if (integratedComponents.isEmpty)
          Text(
            'No common component is enabled for this application.',
            style: theme.textTheme.bodySmall?.copyWith(color: kMuted),
          )
        else
          ...integratedComponents.map(
            (IntegratedComponent component) => _ComponentRow(component: component),
          ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: kTechBlueSoft,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Recommended next move',
                style: theme.textTheme.labelSmall?.copyWith(
                  color: kTechBlue,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Write the requirement before the screen.',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: kInk,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Capture the first workflow in docs/product/prd/PRD.md, record the boundary decision, then add API, SDK, and package work.',
                style: theme.textTheme.bodySmall?.copyWith(color: kMuted, height: 1.55),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _meTab(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    IntegratedComponent? iam;
    for (final IntegratedComponent component in integratedComponents) {
      if (component.id == 'iam') {
        iam = component;
        break;
      }
    }
    final bool iamLinked = iam?.supported ?? false;

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      children: <Widget>[
        Text(
          'SDKWORK APPLICATION FOUNDATION',
          style: theme.textTheme.labelSmall?.copyWith(
            color: kTechBlue,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'My account',
          style: theme.textTheme.headlineSmall?.copyWith(
            color: kInk,
            fontWeight: FontWeight.w700,
            letterSpacing: -0.6,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Identity, session, and account security through sdkwork-iam.',
          style: theme.textTheme.bodyMedium?.copyWith(color: kMuted),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: kSurface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Container(
                    width: 52,
                    height: 52,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: kTechBlue,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Text(
                      'D',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          iamLinked ? 'IAM integration ready' : 'IAM is not selected',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: kInk,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          iamLinked
                              ? 'Connect the IAM runtime with a base URL and the global token manager to load the signed-in profile.'
                              : 'Select the iam component to enable account, session, and security capabilities.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: kMuted,
                            height: 1.55,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  _StatusPill(
                    label: iamLinked ? 'Linked' : 'Plan',
                    ready: iamLinked,
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: <Widget>[
                  const _AccountFact(label: 'Application', value: appCode),
                  const SizedBox(width: 10),
                  _AccountFact(
                    label: 'IAM package',
                    value: iam != null && iam.sdkPackage.isNotEmpty ? iam.sdkPackage : '—',
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Row(
                children: <Widget>[
                  _AccountFact(label: 'Tenant', value: 'Loaded at runtime'),
                  SizedBox(width: 10),
                  _AccountFact(label: 'Session', value: 'Global token manager'),
                ],
              ),
            ],
          ),
        ),
        if (iamLinked) ...<Widget>[
          const SizedBox(height: 16),
          SocialLoginPanel(
            service: createIamSocialAuthService(),
            launcher: const BrowserSocialAuthLauncher(),
          ),
        ],
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: kSurface,
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              _CapabilityRow(title: 'Profile', detail: 'Display name, email, phone', source: 'iam.users.current'),
              SizedBox(height: 8),
              _CapabilityRow(title: 'Session', detail: 'Retrieve and revoke the current session', source: 'auth.sessions.current'),
              SizedBox(height: 8),
              _CapabilityRow(title: 'Security', detail: 'Password and binding changes', source: 'iam.users.current'),
              SizedBox(height: 8),
              _CapabilityRow(title: 'Preferences', detail: 'Locale, theme, and notification defaults', source: 'config/components'),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kSurfaceAlt,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              label.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                color: kMuted,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                color: kInk,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({required this.title, required this.subtitle, required this.status});

  final String title;
  final String subtitle;
  final String status;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final bool ready = status == 'Ready';
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kSurfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: kInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(color: kMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
            decoration: BoxDecoration(
              color: ready ? kSuccessSoft : kWarningSoft,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              status,
              style: theme.textTheme.labelSmall?.copyWith(
                color: ready ? kSuccess : kWarning,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SurfaceRow extends StatelessWidget {
  const _SurfaceRow({required this.root});

  final ArchitectureRoot root;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kSurfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 30,
            height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: kTechBlue,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Text(
              root.id.substring(0, 2).toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  root.title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: kInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  root.root,
                  style: theme.textTheme.bodySmall?.copyWith(color: kMuted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            root.kind,
            style: theme.textTheme.labelSmall?.copyWith(color: kMuted),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.ready});

  final String label;
  final bool ready;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: ready ? kSuccessSoft : kWarningSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: ready ? kSuccess : kWarning,
              fontWeight: FontWeight.w600,
            ),
      ),
    );
  }
}

class _AccountFact extends StatelessWidget {
  const _AccountFact({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: kSurfaceAlt,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              label.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                color: kMuted,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodySmall?.copyWith(
                color: kInk,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CapabilityRow extends StatelessWidget {
  const _CapabilityRow({required this.title, required this.detail, required this.source});

  final String title;
  final String detail;
  final String source;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kSurfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            title,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: kInk,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 2),
          Text(detail, style: theme.textTheme.bodySmall?.copyWith(color: kMuted)),
          const SizedBox(height: 4),
          Text(
            source,
            style: theme.textTheme.labelSmall?.copyWith(color: kTechBlueStrong),
          ),
        ],
      ),
    );
  }
}

class _ComponentRow extends StatelessWidget {
  const _ComponentRow({required this.component});

  final IntegratedComponent component;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: kSurfaceAlt,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Container(
            width: 32,
            height: 32,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: kTechBlue,
              borderRadius: BorderRadius.circular(9),
            ),
            child: Text(
              component.id.substring(0, 2).toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  component.title,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: kInk,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  component.supported
                      ? (component.sdkPackage.isEmpty ? component.mode : component.sdkPackage)
                      : component.reason,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: component.supported ? kTechBlueStrong : kWarning,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: component.supported ? kSuccessSoft : kWarningSoft,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              component.supported ? 'Linked' : 'Plan',
              style: theme.textTheme.labelSmall?.copyWith(
                color: component.supported ? kSuccess : kWarning,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
