class SocialProvider {
  const SocialProvider({
    required this.id,
    required this.label,
    required this.mark,
    required this.accent,
    required this.order,
    this.aliases = const <String>[],
  });

  final String id;
  final String label;
  final String mark;
  final int accent;
  final int order;
  final List<String> aliases;

  bool matches(String candidate) {
    final String normalized = candidate.trim().toLowerCase();
    return normalized == id || aliases.contains(normalized);
  }
}

/// Provider descriptors are additive. A new provider only needs a descriptor
/// and an enabled id in the component configuration; the UI and service have no
/// provider-specific branches.
const List<SocialProvider> socialProviderCatalog = <SocialProvider>[
  SocialProvider(
    id: 'apple',
    label: 'Apple',
    mark: 'A',
    accent: 0xFF0A1324,
    order: 10,
  ),
  SocialProvider(
    id: 'google',
    label: 'Google',
    mark: 'G',
    accent: 0xFF0A5CFF,
    order: 20,
  ),
  SocialProvider(
    id: 'meta',
    label: 'Meta',
    mark: 'M',
    accent: 0xFF0866FF,
    order: 30,
    aliases: <String>['facebook'],
  ),
  SocialProvider(
    id: 'github',
    label: 'GitHub',
    mark: 'GH',
    accent: 0xFF24292F,
    order: 40,
  ),
  SocialProvider(
    id: 'x',
    label: 'X',
    mark: 'X',
    accent: 0xFF0A1324,
    order: 50,
    aliases: <String>['twitter'],
  ),
  SocialProvider(
    id: 'wechat',
    label: 'WeChat',
    mark: 'W',
    accent: 0xFF07C160,
    order: 60,
    aliases: <String>['weixin', 'wechat_open'],
  ),
];

List<SocialProvider> resolveSocialProviders({
  required List<String> backendProviderIds,
  required List<String> enabledProviderIds,
  required Map<String, String> labels,
}) {
  final Set<String> available = backendProviderIds
      .map((String id) => id.trim().toLowerCase())
      .where((String id) => id.isNotEmpty)
      .toSet();
  final List<SocialProvider> resolved = <SocialProvider>[];

  for (final String id in enabledProviderIds) {
    final String normalized = id.trim().toLowerCase();
    SocialProvider? descriptor;
    for (final SocialProvider candidate in socialProviderCatalog) {
      if (candidate.matches(normalized)) {
        descriptor = candidate;
        break;
      }
    }
    if (descriptor == null) continue;
    if (available.isNotEmpty && !available.any(descriptor.matches)) continue;
    resolved.add(SocialProvider(
      id: descriptor.id,
      label: labels[descriptor.id] ?? descriptor.label,
      mark: descriptor.mark,
      accent: descriptor.accent,
      order: descriptor.order,
      aliases: descriptor.aliases,
    ));
  }

  resolved.sort((SocialProvider left, SocialProvider right) {
    final int byOrder = left.order.compareTo(right.order);
    return byOrder != 0 ? byOrder : left.label.compareTo(right.label);
  });
  return resolved;
}
